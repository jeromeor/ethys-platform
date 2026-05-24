import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { Resend } from 'resend'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })
const resend = new Resend(process.env.RESEND_API_KEY)

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const [demande] = await sql`
      UPDATE demandes_annulation
      SET statut = ${body.statut}, traite_at = now(), traite_par = ${body.traite_par}
      WHERE id = ${id}
      RETURNING commande_id
    `
    if (!demande) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
    }

    // Marque lu toutes les notifs liées à cette demande pour tous les admins
await sql`
  UPDATE notifications SET lu = true
  WHERE type = 'demande_annulation' AND user_id = ${body.traite_par} AND lu = false
`
    if (body.statut === 'acceptee') {
      // Passe la commande en annulee et récupère les infos pour le mail
      const [commande] = await sql`
        UPDATE commandes SET statut = 'annulee' WHERE id = ${demande.commande_id}
        RETURNING reference, titre,
          (SELECT email FROM auth.users WHERE id = created_by) as email_createur,
          (SELECT nom FROM entreprises WHERE id = marque_id) as nom_marque
      `
// Notifie les users de la filature concernée
const usersFilature = await sql`
  SELECT pu.id FROM profils_utilisateurs pu
  JOIN entreprises e ON e.id = pu.entreprise_id
  JOIN commandes c ON c.filature_id = e.id
  WHERE c.id = ${demande.commande_id} AND pu.role = 'filature'
`
for (const u of usersFilature) {
  await sql`
    INSERT INTO notifications (user_id, type, titre, contenu, lien, lu)
    VALUES (
      ${u.id},
      'commande_annulee',
      ${'Commande annulée — ' + commande.reference},
      ${'La commande ' + commande.reference + ' a été annulée par Textile Loop.'},
      '/commandes',
      false
    )
  `
}
      // Envoi mail à la marque
      if (commande?.email_createur) {
        await resend.emails.send({
          from: 'ETHYS Platform <contact@textile-loop.com>',
          to: commande.email_createur,
          subject: `Commande ${commande.reference} annulée`,
          html: `
            <p>Bonjour,</p>
            <p>La commande <strong>${commande.reference}</strong>${commande.titre ? ` — ${commande.titre}` : ''} a été annulée par Textile Loop.</p>
            <p>Si vous avez des questions, contactez-nous à <a href="mailto:contact@textile-loop.com">contact@textile-loop.com</a>.</p>
            <p>L'équipe ETHYS</p>
          `,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
