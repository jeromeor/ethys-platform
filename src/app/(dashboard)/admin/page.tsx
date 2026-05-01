import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from '@/components/modules/AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profil?.role !== 'admin') redirect('/dashboard')

  const { data: utilisateursData } = await supabase
    .from('profils_utilisateurs')
    .select('*, entreprise:entreprises(nom, type)')
    .order('created_at', { ascending: false })

  const { data: auditData } = await supabase
    .from('journal_audit')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: entreprisesData } = await supabase
    .from('entreprises')
    .select('id, nom, type, statut')
    .order('nom')

  return (
    <AdminClient
      utilisateurs={utilisateursData ?? []}
      audit={auditData ?? []}
      entreprises={entreprisesData ?? []}
      currentUserId={user.id}
    />
  )
}