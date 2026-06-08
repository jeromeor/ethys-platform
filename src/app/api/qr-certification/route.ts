import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const body = await request.json()
  const { certification_id, numero } = body

  const reference = `ETHYS-CERT-${numero.replace(/\//g, '-')}`
  const urlPublique = `https://www.ethys-textileloop.com/tracabilite/${reference}`

  const { data, error } = await supabase
    .from('qr_codes')
    .insert({
      certification_id,
      reference,
      url_publique: urlPublique,
      data_encodee: body.data_encodee,
      actif: true,
      nb_scans: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
