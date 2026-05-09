import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportingClient from '@/components/modules/ReportingClient'

export default async function ReportingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: commandes } = await supabase
    .from('commandes')
    .select('statut, volume_total_tonnes, pct_recycle, created_at, priorite')
    .order('created_at', { ascending: true })

  const { data: factures } = await supabase
    .from('factures')
    .select('montant_ht, statut, date_emission')
    .order('date_emission', { ascending: true })

  const { data: entreprises } = await supabase
    .from('entreprises')
    .select('type, statut, pays')
    .neq('type', 'plateforme')

  const { data: lots } = await supabase
    .from('lots')
    .select('type_coton, volume_tonnes, statut')

  return (
    <ReportingClient
      commandes={commandes ?? []}
      factures={factures ?? []}
      entreprises={entreprises ?? []}
      lots={lots ?? []}
    />
  )
}