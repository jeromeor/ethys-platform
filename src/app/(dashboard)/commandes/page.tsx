import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CommandesClient from '@/components/modules/CommandesClient'

export default async function CommandesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('*, entreprise:entreprises(*)')
    .eq('id', user.id)
    .single()

  const entrepriseId = profil?.entreprise_id
  const role = profil?.role

  let commandesQuery = supabase
    .from('commandes')
    .select(`
      *,
      marque:entreprises!commandes_marque_id_fkey(nom, pays),
      filature:entreprises!commandes_filature_id_fkey(nom, pays),
      fournisseur:entreprises!commandes_fournisseur_id_fkey(nom, pays),
      validations(*)
    `)

  if (role !== 'admin' && entrepriseId) {
    if (role === 'marque') commandesQuery = commandesQuery.eq('marque_id', entrepriseId)
    else if (role === 'filature') commandesQuery = commandesQuery.eq('filature_id', entrepriseId)
    else if (role === 'fournisseur_coton') commandesQuery = commandesQuery.eq('fournisseur_id', entrepriseId)
  }

  const { data: commandes } = await commandesQuery.order('created_at', { ascending: false })

  const { data: entreprises } = await supabase
    .from('entreprises')
    .select('id, nom, type')
    .neq('type', 'plateforme')
    .order('nom')

  return (
    <CommandesClient
      user={user}
      profil={profil}
      commandes={commandes ?? []}
      entreprises={entreprises ?? []}
    />
  )
}