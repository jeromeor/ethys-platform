import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { createClient } from '@/lib/supabase/server'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

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
      UPDATE demandes_qr
      SET statut = ${body.statut}, traite_at = now(), traite_par = ${body.traite_par}
      WHERE id = ${id}
      RETURNING lot_id, demandeur_id
    `
    if (!demande) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
    }

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

    return NextResponse.json({ success: true, lot_id: demande.lot_id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
