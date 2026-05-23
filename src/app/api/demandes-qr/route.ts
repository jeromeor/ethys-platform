import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // Notifie tous les admins
    const { data: admins } = await supabase
      .from('profils_utilisateurs')
      .select('id')
      .eq('role', 'admin')

    for (const admin of admins ?? []) {
      await supabase.from('notifications').insert({
        user_id: admin.id,
        type: 'demande_qr',
        titre: 'Demande QR Code — ' + body.lot_reference,
        contenu: 'Lot ' + body.lot_reference + ' · ' + (body.commande_reference ?? ''),
        lien: '/qrcode?lot_id=' + body.lot_id,
        lu: false,
      })
    }

    return NextResponse.json({ data: row })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
