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

  // Récupère les partenaires acceptés une seule fois
  let partnerIds: string[] = []

  if (role !== 'admin' && entrepriseId) {
    const { data: partnerships } = await supabase
      .from('partnerships')
      .select('requester_id, receiver_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${entrepriseId},receiver_id.eq.${entrepriseId}`)

    partnerIds = (partnerships ?? []).map(p =>
      p.requester_id === entrepriseId ? p.receiver_id : p.requester_id
    )
  }

  // UUID invalide utilisé comme fallback quand aucun partenaire → retourne 0 résultats
  const fallback = ['00000000-0000-0000-0000-000000000000']

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
    const ids = partnerIds.length > 0 ? partnerIds : fallback
    if (role === 'marque') {
      commandesQuery = commandesQuery
        .eq('marque_id', entrepriseId)
        .in('filature_id', ids)
    } else if (role === 'filature') {
      commandesQuery = commandesQuery
        .eq('filature_id', entrepriseId)
        .in('marque_id', ids)
    } else if (role === 'fournisseur_coton') {
      commandesQuery = commandesQuery
        .eq('fournisseur_id', entrepriseId)
        .in('marque_id', ids)
    }
  }

  const { data: commandes } = await commandesQuery.order('created_at', { ascending: false })

  // Entreprises visibles = sa propre société + partenaires
  let entreprises: { id: string; nom: string; type: string }[] = []

  if (role === 'admin') {
    const { data } = await supabase
      .from('entreprises')
      .select('id, nom, type')
      .neq('type', 'plateforme')
      .order('nom')
    entreprises = data ?? []
  } else if (entrepriseId) {
    const allIds = [entrepriseId, ...partnerIds]
    const { data } = await supabase
      .from('entreprises')
      .select('id, nom, type')
      .in('id', allIds)
      .order('nom')
    entreprises = data ?? []
  }
// IDs des commandes avec une demande d'annulation en attente
const { data: demandesEnAttente } = await supabase
  .from('demandes_annulation')
  .select('commande_id')
  .eq('statut', 'en_attente')

const commandesAvecDemande = new Set(
  (demandesEnAttente ?? []).map(d => d.commande_id)
)
const commandesAvecDemandeIds = Array.from(commandesAvecDemande)
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
