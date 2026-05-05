import { createClient } from '@/lib/supabase/server'
import AnnuaireClient from '@/components/modules/AnnuaireClient'

export default async function AnnuairePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('role')
    .eq('id', user!.id)
    .single()

  const { data: partenaires } = await supabase
    .from('entreprises')
    .select('*')
    .neq('type', 'plateforme')
    .order('nom')

  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')

  const paysList = [...new Set(
    (partenaires ?? []).map(p => p.pays).filter(Boolean)
  )].sort()

  const partenairesAvecCerts = (partenaires ?? []).map(p => ({
    ...p,
    certifications: (certifications ?? []).filter(c =>
      c.entreprise_id.trim() === p.id.trim()
    ),
    notations: [],
  }))

  return (
    <AnnuaireClient
      partenaires={partenairesAvecCerts}
      paysList={paysList}
      userRole={profil?.role ?? 'marque'}
    />
  )
}