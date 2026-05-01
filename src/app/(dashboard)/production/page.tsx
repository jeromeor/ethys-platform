import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductionClient from '@/components/modules/ProductionClient'

export default async function ProductionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: commandes } = await supabase
    .from('commandes')
    .select(`
      id, reference, statut, priorite,
      volume_total_tonnes, pct_recycle,
      date_livraison_souhaitee,
      marque:entreprises!commandes_marque_id_fkey(nom),
      filature:entreprises!commandes_filature_id_fkey(nom),
      lots(
        id, reference, type_coton, volume_tonnes,
        statut, avancement_pct, machine, origine,
        certification, date_debut, date_fin_prevue,
        controles_qualite(*)
      )
    `)
    .in('statut', [
      'validation_finale', 'en_production',
      'controle_qualite', 'qr_genere', 'expediee'
    ])
    .order('created_at', { ascending: false })

  return <ProductionClient commandes={commandes ?? []} user={user} />
}