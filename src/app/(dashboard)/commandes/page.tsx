export const dynamic = 'force-dynamic'
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

  // MVP : toutes les entreprises accessibles — logique partenariats activée post-beta
  let commandesQuery = supabase
    .from('commandes')
    .select(`
      *,
      marque:entreprises!commandes_marque_id_fkey(nom, pays),
      filature:entreprises!commandes_filature_id_fkey(nom, pays),
      fournisseur:entreprises!commandes_fournisseur_id_fkey(nom, pays),
      lots(id, avancement_pct)
    `)

  if (role !== 'admin' && entrepriseId) {
    if (role === 'marque') {
      commandesQuery = commandesQuery.eq('marque_id', entrepriseId)
    } else if (role === 'filature') {
      commandesQuery = commandesQuery.eq('filature_id', entrepriseId)
    } else if (role === 'fournisseur_coton') {
      commandesQuery = commandesQuery.eq('fournisseur_id', entrepriseId)
    }
  }

  const { data: commandes } = await commandesQuery.order('created_at', { ascending: false })

  // Toutes les entreprises visibles pour le formulaire
  const { data: entreprisesData } = await supabase
    .from('entreprises')
    .select('id, nom, type')
    .neq('type', 'plateforme')
    .order('nom')
  const entreprises = entreprisesData ?? []

  // IDs des commandes avec une demande d'annulation en attente
  const { data: demandesEnAttente } = await supabase
    .from('demandes_annulation')
    .select('commande_id')
    .eq('statut', 'en_attente')

  const commandesAvecDemandeIds = [...new Set((demandesEnAttente ?? []).map(d => d.commande_id))]

  return (
    <CommandesClient
      user={user}
      profil={profil}
      commandes={commandes ?? []}
      entreprises={entreprises}
      commandesAvecDemandeIds={commandesAvecDemandeIds}
    />
  )
}
