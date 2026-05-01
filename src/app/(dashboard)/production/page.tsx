import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductionClient from '@/components/modules/ProductionClient'

export default async function ProductionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: raw } = await supabase
    .from('commandes')
    .select(`
      id, reference, statut, priorite,
      volume_total_tonnes, pct_recycle,
      date_livraison_souhaitee,
      marque_id, filature_id,
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

  const { data: entreprises } = await supabase
    .from('entreprises')
    .select('id, nom')

  const commandes = (raw ?? []).map(c => ({
    ...c,
    marque: (entreprises ?? []).find(e => e.id === c.marque_id) ?? null,
    filature: (entreprises ?? []).find(e => e.id === c.filature_id) ?? null,
    lots: c.lots ?? [],
  }))

  return <ProductionClient commandes={commandes} user={user} />
}