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

  const { data: utilisateursRaw } = await supabase
    .from('profils_utilisateurs')
    .select('id, email, prenom, nom, role, entreprise:entreprises(nom)')
    .order('email')

  const utilisateurs = (utilisateursRaw ?? []).map(u => ({
    ...u,
    entreprise: Array.isArray(u.entreprise) ? u.entreprise[0] : u.entreprise,
  }))

  const adminId = process.env.NEXT_PUBLIC_ADMIN_ID ?? 'fd1f7942-fee6-4ae0-b1f0-1c5c0e23f4dd'
  const adminUser = utilisateurs.find(u => u.id === adminId) ?? {
    id: adminId,
    email: 'jeromeoriol1964@gmail.com',
    prenom: 'Jerome',
    nom: 'Oriol',
    role: 'admin',
    entreprise: { nom: 'TEXTILE LOOP' }
  }

  return (
    <MessagerieClient
      currentUser={{ id: user.id, email: user.email ?? '' }}
      currentRole={profil?.role ?? 'marque'}
      adminId={adminId}
      adminUser={adminUser}
      utilisateurs={utilisateurs}
    />
  )
}
