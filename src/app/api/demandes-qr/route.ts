
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
 
    // INSERT demande — le trigger notify_demande_qr insère la notification automatiquement
    const { data: row, error } = await supabase
      .from('demandes_qr')
      .insert({ lot_id: body.lot_id, demandeur_id: body.demandeur_id, entreprise_id: body.entreprise_id })
      .select()
      .single()
 
    console.log('INSERT RESULT:', JSON.stringify({ row, error }))
 
    if (error) {
      console.error('DEMANDE QR ERROR:', error)
      return NextResponse.json({ error: (error as any).message }, { status: 500 })
    }
 
    return NextResponse.json({ data: row })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
