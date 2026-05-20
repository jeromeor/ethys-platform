import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Vérif que l'user est bien Textile Loop
  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('entreprise:entreprises(nom)')
    .eq('id', user.id)
    .single()

  const nomEntreprise = (profil?.entreprise as any)?.nom
  if (nomEntreprise !== 'Textile Loop') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { qr_id } = await req.json()
  const { error } = await supabase
    .from('qr_codes')
    .update({
      actif: true,
      activated_by: user.id,
      activated_at: new Date().toISOString(),
    })
    .eq('id', qr_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
