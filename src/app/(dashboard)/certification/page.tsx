import { createClient } from '@/lib/supabase/server'
import CertificationClient from '@/components/modules/CertificationClient'
import { redirect } from 'next/navigation'

export default async function CertificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('role, entreprise_id')
    .eq('id', user.id)
    .single()

  const { data: declarations } = await supabase
    .from('declarations_ethys')
    .select('*, certification:certifications_ethys(numero, date_emission, date_validite)')
    .order('created_at', { ascending: false })

  return (
    <CertificationClient
      declarations={declarations ?? []}
      userRole={profil?.role ?? 'marque'}
      entrepriseId={profil?.entreprise_id ?? ''}
      userId={user.id}
    />
  )
}
