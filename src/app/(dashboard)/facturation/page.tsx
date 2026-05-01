import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FacturationClient from '@/components/modules/FacturationClient'

export default async function FacturationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: factures } = await supabase
    .from('factures')
    .select(`
      *,
      lignes:lignes_facture(*),
      commande:commandes(reference, volume_total_tonnes),
      emetteur:entreprises!factures_emetteur_id_fkey(nom, adresse, email_contact),
      destinataire:entreprises!factures_destinataire_id_fkey(nom, adresse, email_contact)
    `)
    .order('created_at', { ascending: false })

  const { data: commandes } = await supabase
    .from('commandes')
    .select(`
      id, reference, volume_total_tonnes, pct_recycle,
      marque:entreprises!commandes_marque_id_fkey(id, nom),
      filature:entreprises!commandes_filature_id_fkey(id, nom)
    `)
    .in('statut', ['en_production', 'controle_qualite', 'qr_genere', 'livree'])

  const { data: entreprises } = await supabase
    .from('entreprises')
    .select('id, nom, type')
    .order('nom')

  return (
    <FacturationClient
      factures={factures ?? []}
      commandes={commandes ?? []}
      entreprises={entreprises ?? []}
      user={user}
    />
  )
}