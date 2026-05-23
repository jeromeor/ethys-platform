import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    // Vérifie doublon
    const { data: existante } = await supabase
      .from('demandes_qr')
      .select('id')
      .eq('lot_id', body.lot_id)
      .eq('statut', 'en_attente')
      .single()

    if (existante) {
      return NextResponse.json(
        { error: 'Une demande est déjà en attente pour ce lot' },
        { status: 409 }
      )
    }

    // INSERT demande
    const { data: row, error } = await supabase
      .from('demandes_qr')
      .insert({ lot_id: body.lot_id, demandeur_id: body.demandeur_id, entreprise_id: body.entreprise_id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // INSERT notifications via SQL direct (contourne cache PostgREST)
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })
    const admins = await sql`SELECT id FROM profils_utilisateurs WHERE role = 'admin'`

    for (const admin of admins) {
      await sql`
        INSERT INTO notifications (user_id, type, titre, contenu, lien, lu)
        VALUES (
          ${admin.id},
          'demande_qr',
          ${'Demande QR Code — ' + body.lot_reference},
          ${'Lot ' + body.lot_reference + ' · ' + (body.commande_reference ?? '')},
          ${'/qrcode?lot_id=' + body.lot_id},
          false
        )
      `
    }
    await sql.end()

    return NextResponse.json({ data: row })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
