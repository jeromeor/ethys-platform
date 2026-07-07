import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })
const resend = new Resend(process.env.RESEND_API_KEY)

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
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

    // Marque lu toutes les notifs li\u00e9es \u00e0 cette demande pour tous les admins
    await sql`
      UPDATE notifications SET lu = true
      WHERE type = 'demande_annulation' AND user_id = ${body.traite_par} AND lu = false
    `

    if (body.statut === 'acceptee') {
      const [commande] = await sql`
        UPDATE commandes SET statut = 'annulee' WHERE id = ${demande.commande_id}
        RETURNING reference, titre,
          (SELECT email FROM auth.users WHERE id = created_by) as email_createur,
          (SELECT nom FROM entreprises WHERE id = marque_id) as nom_marque
      `

      // Notifie les users de la filature concern\u00e9e
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
            ${'Commande annul\u00e9e \u2014 ' + commande.reference},
            ${'La commande ' + commande.reference + ' a \u00e9t\u00e9 annul\u00e9e par Textile Loop.'},
            '/commandes',
            false
          )
        `
      }

      // Envoi mail \u00e0 la marque — domaine v\u00e9rifi\u00e9 ethys-textileloop.com
      if (commande?.email_createur) {
        await resend.emails.send({
          from: 'ETHYS Platform <contact@ethys-textileloop.com>',
          to: commande.email_createur,
          subject: 'Commande ' + commande.reference + ' annul\u00e9e / Order ' + commande.reference + ' cancelled',
          html: '<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#f5f3ef;">'
            + '<div style="background:#1a1a1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">'
            + '<img src="https://www.ethys-textileloop.com/logo_ethys.png" alt="ETHYS" style="width:60px;filter:invert(1);" />'
            + '<div style="color:#c2956e;font-size:11px;letter-spacing:2px;margin-top:8px;">ETHYS PLATFORM</div>'
            + '</div>'
            // --- FR ---
            + '<div style="background:#fff;border-radius:8px;border:1px solid #e8e3d8;padding:28px 24px;">'
            + '<h2 style="color:#1a1a1a;font-size:18px;margin:0 0 12px;">Commande annul\u00e9e</h2>'
            + '<p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 16px;">'
            + 'Bonjour,<br/><br/>'
            + 'La commande <strong>' + commande.reference + '</strong>'
            + (commande.titre ? ' \u2014 ' + commande.titre : '')
            + ' a \u00e9t\u00e9 annul\u00e9e par Textile Loop.'
            + '</p>'
            + '<p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 16px;">'
            + 'Si vous avez des questions, contactez-nous \u00e0 '
            + '<a href="mailto:contact@ethys-textileloop.com" style="color:#2d5016;">contact@ethys-textileloop.com</a>.'
            + '</p>'
            + '</div>'
            // --- S\u00e9parateur ---
            + '<div style="text-align:center;margin:24px 0;font-size:11px;color:#8b7355;font-weight:600;">ENGLISH VERSION BELOW</div>'
            // --- EN ---
            + '<div style="background:#fff;border-radius:8px;border:1px solid #e8e3d8;padding:28px 24px;">'
            + '<h2 style="color:#1a1a1a;font-size:18px;margin:0 0 12px;">Order cancelled</h2>'
            + '<p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 16px;">'
            + 'Hello,<br/><br/>'
            + 'Order <strong>' + commande.reference + '</strong>'
            + (commande.titre ? ' \u2014 ' + commande.titre : '')
            + ' has been cancelled by Textile Loop.'
            + '</p>'
            + '<p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 16px;">'
            + 'If you have any questions, contact us at '
            + '<a href="mailto:contact@ethys-textileloop.com" style="color:#2d5016;">contact@ethys-textileloop.com</a>.'
            + '</p>'
            + '</div>'
            // --- Footer ---
            + '<div style="text-align:center;margin-top:20px;font-size:11px;color:#d4c5b0;">'
            + 'TEXTILE LOOP \u2014 15 rue d\u2019Upsal, 67000 Strasbourg'
            + '</div>'
            + '</div>',
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
