import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Vérifie qu'une demande n'est pas déjà en attente pour ce lot
    const [existante] = await sql`
      SELECT id FROM demandes_qr
      WHERE lot_id = ${body.lot_id} AND statut = 'en_attente'
    `
    if (existante) {
      return NextResponse.json(
        { error: 'Une demande est déjà en attente pour ce lot' },
        { status: 409 }
      )
    }

    const [row] = await sql`
      INSERT INTO demandes_qr (lot_id, demandeur_id, entreprise_id)
      VALUES (${body.lot_id}, ${body.demandeur_id}, ${body.entreprise_id})
      RETURNING *
    `

    // Notifie tous les admins
    const admins = await sql`
      SELECT id FROM profils_utilisateurs WHERE role = 'admin'
    `
    for (const admin of admins) {
      await sql`
        INSERT INTO notifications (utilisateur_id, type, titre, message, lien, lu, reference_id)
        VALUES (
          ${admin.id},
          'demande_qr',
          ${'Demande QR Code — ' + body.lot_reference},
          ${'Lot ' + body.lot_reference + ' · ' + (body.${'/qrcode?lot_id=' + body.lot_id} _reference ?? '')},
          '/qrcode',
          false,
          ${row.id}
        )
      `
    }

    return NextResponse.json({ data: row })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
