import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const [commande] = await sql`
      SELECT statut, reference FROM commandes WHERE id = ${body.commande_id}
    `
    if (!commande) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }
    if (['livree', 'qr_genere', 'expediee'].includes(commande.statut)) {
      return NextResponse.json(
        { error: `Annulation impossible — statut : ${commande.statut}` },
        { status: 403 }
      )
    }

    const [existante] = await sql`
      SELECT id FROM demandes_annulation
      WHERE commande_id = ${body.commande_id} AND statut = 'en_attente'
    `
    if (existante) {
      return NextResponse.json(
        { error: 'Une demande est déjà en attente pour cette commande' },
        { status: 409 }
      )
    }

    const [row] = await sql`
      INSERT INTO demandes_annulation (commande_id, demandeur_id, entreprise_id, motif)
      VALUES (${body.commande_id}, ${body.demandeur_id}, ${body.entreprise_id}, ${body.motif})
      RETURNING *
    `

    // Notifie tous les admins
    const admins = await sql`
      SELECT id FROM profils_utilisateurs WHERE role = 'admin'
    `
    if (admins.length > 0) {
      for (const admin of admins) {
        await sql`
          INSERT INTO notifications (utilisateur_id, type, titre, message, lien, lu, reference_id)
          VALUES (
            ${admin.id},
            'demande_annulation',
            ${'Demande d\'annulation — ' + commande.reference},
            ${'Motif : ' + (body.motif || 'Non précisé')},
            '/commandes',
            false,
            ${row.id}
          )
        `
      }
    }

    return NextResponse.json({ data: row })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
