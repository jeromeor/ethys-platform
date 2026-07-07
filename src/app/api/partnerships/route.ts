import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — liste des partenaires acceptés de l'entreprise connectée
export async function GET(req: NextRequest) {
  const sessionSupabase = await createSessionClient()
  const { data: { user } } = await sessionSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const entreprise_id = req.nextUrl.searchParams.get('entreprise_id')
  if (!entreprise_id) return NextResponse.json({ error: 'entreprise_id requis' }, { status: 400 })

  const { data, error } = await supabase
    .from('partnerships')
    .select(`
      id, status,
      requester:requester_id(id, nom, type),
      receiver:receiver_id(id, nom, type)
    `)
    .or(`requester_id.eq.${entreprise_id},receiver_id.eq.${entreprise_id}`)
    .eq('status', 'accepted')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — envoyer une demande de partenariat
export async function POST(req: NextRequest) {
  const sessionSupabase = await createSessionClient()
  const { data: { user } } = await sessionSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { requester_id, receiver_id } = await req.json()
  if (!requester_id || !receiver_id)
    return NextResponse.json({ error: 'requester_id et receiver_id requis' }, { status: 400 })

  const { data, error } = await supabase
    .from('partnerships')
    .insert({ requester_id, receiver_id, status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log
  await supabase.from('partnership_logs').insert({
    partnership_id: data.id,
    action: 'requested',
    actor_entreprise_id: requester_id
  })

  return NextResponse.json(data)
}

// PATCH — accepter ou rejeter
export async function PATCH(req: NextRequest) {
  const sessionSupabase = await createSessionClient()
  const { data: { user } } = await sessionSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { partnership_id, status, actor_entreprise_id } = await req.json()
  if (!partnership_id || !status || !actor_entreprise_id)
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const { data, error } = await supabase
    .from('partnerships')
    .update({ status })
    .eq('id', partnership_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log
  await supabase.from('partnership_logs').insert({
    partnership_id,
    action: status === 'accepted' ? 'accepted' : 'rejected',
    actor_entreprise_id
  })

  return NextResponse.json(data)
}
