import { createClient } from '@/lib/supabase/server'
import { getProfilUtilisateur } from '@/lib/data/profils'
import { redirect } from 'next/navigation'
import AdminClient from '@/components/modules/AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await getProfilUtilisateur(supabase, user.id)

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
    .select('id, nom, type, statut, ville, pays, siret, tva, email_contact, telephone, site_web, adresse_rue, code_postal, created_at')
    .order('nom')

  // Royalties avec noms filature et marque
  const { data: royaltiesData } = await supabase
    .from('royalties_filatures')
    .select(`
      *,
      filature:entreprises!royalties_filatures_filature_id_fkey(nom),
      marque:entreprises!royalties_filatures_marque_id_fkey(nom),
      facture:factures(reference)
    `)
    .order('created_at', { ascending: false })

  return (
    <AdminClient
      utilisateurs={utilisateursData ?? []}
      audit={auditData ?? []}
      entreprises={entreprisesData ?? []}
      royalties={royaltiesData ?? []}
      currentUserId={user.id}
    />
  )
}
