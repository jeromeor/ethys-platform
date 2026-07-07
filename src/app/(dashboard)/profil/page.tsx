import { createClient } from '@/lib/supabase/server'
import { getProfilUtilisateur } from '@/lib/data/profils'
import { redirect } from 'next/navigation'
import ProfilClient from '@/components/modules/ProfilClient'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await getProfilUtilisateur(supabase, user.id)

  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('entreprise_id', profil?.entreprise_id ?? '')
    .order('created_at', { ascending: false })

  const { data: documents } = await supabase
    .from('documents_entreprise')
    .select('*')
    .eq('entreprise_id', profil?.entreprise_id ?? '')

  const entreprise = profil?.entreprise as Record<string, string> | null

  return (
    <ProfilClient
      user={{ id: user.id, email: user.email }}
      profil={profil as Record<string, string> | null}
      entreprise={entreprise}
      certifications={(certifications ?? []) as Record<string, string>[]}
      documents={(documents ?? []) as Record<string, string>[]}
    />
  )
}
