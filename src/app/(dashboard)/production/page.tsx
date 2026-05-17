import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductionClient from '@/components/modules/ProductionClient'

export default async function ProductionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('role, entreprise_id')
    .eq('id', user.id)
    .single()

  const role = profil?.role
  const entrepriseId = profil?.entreprise_id

  let productionQuery = supabase
    .from('commandes')
    .select(`
      id, reference, statut, priorite,
      volume_total_tonnes, pct_recycle,
      date_livraison_souhaitee,
      marque_id, filature_id,
      lots(
        id, reference, type_coton, volume_tonnes,
        statut, avancement_pct, machine, origine,
        certification, date_debut, date_fin_prevue, updated_at,
        controles_qualite(*)
      )
    `)
    .in('statut', [
      'validation_finale', 'en_production',
      'controle_qualite', 'qr_genere', 'expediee'
    ])
    .order('created_at', { ascending: false })

  if (role !== 'admin' && entrepriseId) {
    if (role === 'filature') productionQuery = productionQuery.eq('filature_id', entrepriseId)
    else if (role === 'marque') productionQuery = productionQuery.eq('marque_id', entrepriseId)
  }

  const { data: raw } = await productionQuery

  const { data: entreprises } = await supabase
    .from('entreprises')
    .select('id, nom')

  const commandes = (raw ?? []).map(c => ({
    ...c,
    marque: (entreprises ?? []).find(e => e.id === c.marque_id) ?? null,
    filature: (entreprises ?? []).find(e => e.id === c.filature_id) ?? null,
    lots: c.lots ?? [],
  }))

  return <ProductionClient commandes={commandes} user={user} role={role ?? ''} />
}
