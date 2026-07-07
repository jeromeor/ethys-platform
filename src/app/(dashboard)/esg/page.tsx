import { createClient } from '@/lib/supabase/server'
import { getProfilUtilisateur } from '@/lib/data/profils'
import { redirect } from 'next/navigation'
import ESGClient from '@/components/modules/ESGClient'

export default async function ESGPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await getProfilUtilisateur(supabase, user.id)

  const { data: commandes } = await supabase
    .from('commandes')
    .select('statut, volume_total_tonnes, pct_recycle, created_at')

  const { data: lots } = await supabase
    .from('lots')
    .select('type_coton, volume_tonnes, statut, certification')

  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('entreprise_id', profil?.entreprise_id ?? '')

  const { data: scores } = await supabase
    .from('scores_esg')
    .select('*')
    .eq('entreprise_id', profil?.entreprise_id ?? '')
    .order('created_at', { ascending: false })
    .limit(1)

  return (
    <ESGClient
      profil={profil}
      commandes={commandes ?? []}
      lots={lots ?? []}
      certifications={certifications ?? []}
      scoreExistant={scores?.[0] ?? null}
    />
  )
}
