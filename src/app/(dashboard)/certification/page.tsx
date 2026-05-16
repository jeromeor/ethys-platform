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

  const role = profil?.role ?? 'marque'
  const entrepriseId = profil?.entreprise_id ?? ''

  // Recuperer les certifications avec leurs lots et commandes
  let certsQuery = supabase
    .from('certifications_ethys')
    .select(`
      *,
      lot:lots(
        id, reference, volume_tonnes, avancement_pct, origine, certification,
        commande:commandes(
          id, reference, marque_id, filature_id,
          marque:entreprises!commandes_marque_id_fkey(nom),
          filature:entreprises!commandes_filature_id_fkey(nom)
        )
      ),
      createur:profils_utilisateurs!certifications_ethys_created_by_fkey(prenom, nom)
    `)
    .order('created_at', { ascending: false })

  if (role !== 'admin') {
    if (role === 'filature') certsQuery = certsQuery.eq('filature_id', entrepriseId)
    else if (role === 'marque') certsQuery = certsQuery.eq('marque_id', entrepriseId)
  }

  const { data: certifications } = await certsQuery

  // Recuperer les lots eligibles (avancement 100%) sans certification
  const { data: lotsAvecCert } = await supabase
    .from('certifications_ethys')
    .select('lot_id')

  const lotIdsDejaCouverts = (lotsAvecCert ?? []).map(c => c.lot_id).filter(Boolean)

  let lotsQuery = supabase
    .from('lots')
    .select('id, reference, volume_tonnes, avancement_pct, origine, statut, commande_id')
    .eq('avancement_pct', 100)

  if (lotIdsDejaCouverts.length > 0) {
    lotsQuery = lotsQuery.not('id', 'in', '(' + lotIdsDejaCouverts.join(',') + ')')
  }

  const { data: lotsRaw } = await lotsQuery

  // Recuperer les commandes associees
  const commandeIds = [...new Set((lotsRaw ?? []).map(l => l.commande_id).filter(Boolean))]
  const { data: commandesRaw } = commandeIds.length > 0
    ? await supabase
        .from('commandes')
        .select('id, reference, marque_id, filature_id, marque:entreprises!commandes_marque_id_fkey(nom), filature:entreprises!commandes_filature_id_fkey(nom)')
        .in('id', commandeIds)
    : { data: [] }

  const lotsEligibles = (lotsRaw ?? []).map(lot => ({
    ...lot,
    commande: (commandesRaw ?? []).find(c => c.id === lot.commande_id) ?? null,
  }))
    <CertificationClient
      certifications={(certifications ?? []) as any}
      lotsEligibles={(lotsEligibles ?? []) as any}
      userRole={role}
      entrepriseId={entrepriseId}
      userId={user.id}
    />
  )
}
