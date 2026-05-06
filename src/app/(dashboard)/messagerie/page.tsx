import { createClient } from '@/lib/supabase/server'
import MessagerieClient from '@/components/modules/MessagerieClient'
import { redirect } from 'next/navigation'

export default async function MessageriePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('*, entreprise:entreprises(nom)')
    .eq('id', user.id)
    .single()

  const { data: admin } = await supabase
    .from('profils_utilisateurs')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  const { data: utilisateursRaw } = await supabase
    .from('profils_utilisateurs')
    .select('id, email, prenom, nom, role, entreprise:entreprises(nom)')
    .neq('id', user.id)
    .order('email')

  const utilisateurs = (utilisateursRaw ?? []).map(u => ({
    ...u,
    entreprise: Array.isArray(u.entreprise) ? u.entreprise[0] : u.entreprise,
  }))

  return (
    <MessagerieClient
      currentUser={{ id: user.id, email: user.email ?? '' }}
      currentRole={profil?.role ?? 'marque'}
      adminId={admin?.id ?? ''}
      utilisateurs={utilisateurs}
    />
  )
}
