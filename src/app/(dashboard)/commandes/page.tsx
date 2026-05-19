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
      lots(id, avancement_pct)
    `)

  if (role !== 'admin' && entrepriseId) {
    if (role === 'marque') commandesQuery = commandesQuery.eq('marque_id', entrepriseId)
    else if (role === 'filature') commandesQuery = commandesQuery.eq('filature_id', entrepriseId)
    else if (role === 'fournisseur_coton') commandesQuery = commandesQuery.eq('fournisseur_id', entrepriseId)
  }

  const { data: commandes } = await commandesQuery.order('created_at', { ascending: false })

  // Récupère les partenaires acceptés de l'entreprise connectée
  let entreprises: { id: string; nom: string; type: string }[] = []

  if (role === 'admin') {
    // Admin voit tout
    const { data } = await supabase
      .from('entreprises')
      .select('id, nom, type')
      .neq('type', 'plateforme')
      .order('nom')
    entreprises = data ?? []
  } else if (entrepriseId) {
    // Récupère les partenariats acceptés
    const { data: partnerships } = await supabase
      .from('partnerships')
      .select('requester_id, receiver_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${entrepriseId},receiver_id.eq.${entrepriseId}`)

    // Extrait les IDs partenaires (l'autre côté de la relation)
    const partnerIds = (partnerships ?? []).map(p =>
      p.requester_id === entrepriseId ? p.receiver_id : p.requester_id
    )

    // Ajoute sa propre entreprise
    const allIds = [entrepriseId, ...partnerIds]

    const { data } = await supabase
      .from('entreprises')
      .select('id, nom, type')
      .in('id', allIds)
      .order('nom')
    entreprises = data ?? []
  }

  return (
    <CommandesClient
      user={user}
      profil={profil}
      commandes={commandes ?? []}
      entreprises={entreprises}
    />
  )
}
