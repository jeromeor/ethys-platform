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
  // UPDATE lu
await sql`
  UPDATE notifications SET lu = true
  WHERE type = 'demande_qr' AND lu = false
`

// INSERT notification filature
if (body.statut === 'acceptee' && demande.demandeur_id) {
  await sql`
    INSERT INTO notifications (user_id, type, titre, contenu, lien, lu)
    VALUES (
      ${demande.demandeur_id},
      'qr_genere',
      'QR Code généré !',
      'Votre demande de QR Code a été acceptée. Le QR Code est disponible dans la section QR Code.',
      '/qrcode',
      false
    )
  `
}

    return NextResponse.json({ data: row })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
