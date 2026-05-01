import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MessagerieClient from '@/components/modules/MessagerieClient'

export default async function MessageriePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('*, entreprise:entreprises(*)')
    .eq('id', user.id)
    .single()

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      participants:participants_conversation(
        *,
        entreprise:entreprises(nom, type)
      ),
      messages(
        id, contenu, created_at, auteur_id, lu
      )
    `)
    .order('updated_at', { ascending: false })

  return (
    <MessagerieClient
      user={user}
      profil={profil}
      conversationsInitiales={conversations ?? []}
    />
  )
}