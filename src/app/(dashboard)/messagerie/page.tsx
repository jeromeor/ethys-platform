import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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

  const { data: utilisateursRaw } = await supabase
    .from('profils_utilisateurs')
    .select('id, email, prenom, nom, role, entreprise:entreprises(nom)')
    .order('email')

  const utilisateurs = (utilisateursRaw ?? []).map(u => ({
    ...u,
    entreprise: Array.isArray(u.entreprise) ? u.entreprise[0] : u.entreprise,
  }))

  const admins = utilisateurs.filter(u => u.role === 'admin')
  const adminPrincipal = admins.find(u => u.email === 'jeromeoriol1964@gmail.com') ?? admins[0] ?? null

  return (
    <MessagerieClient
      currentUser={{ id: user.id, email: user.email ?? '' }}
      currentRole={profil?.role ?? 'marque'}
      adminId={adminPrincipal?.id ?? ''}
      adminUser={adminPrincipal}
      utilisateurs={utilisateurs.filter(u => u.id !== user.id)}
    />
  )
}
