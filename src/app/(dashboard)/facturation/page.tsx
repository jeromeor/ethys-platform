import { createClient } from '@/lib/supabase/server'
import { getProfilUtilisateur } from '@/lib/data/profils'
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
      emetteur_id,
      destinataire_id,
      emetteur:entreprises!factures_emetteur_id_fkey(nom, adresse, adresse_rue, code_postal, ville, pays, telephone, email_contact, siret, tva),
     destinataire:entreprises!factures_destinataire_id_fkey(nom, adresse, email_contact, pays)
    `)
    .order('created_at', { ascending: false })

  const { data: commandesRaw } = await supabase
    .from('commandes')
    .select('id, reference, volume_total_tonnes, pct_recycle, marque_id, filature_id')
    .in('statut', ['en_production', 'controle_qualite', 'qr_genere', 'livree'])

  const { data: entreprises } = await supabase
    .from('entreprises')
    .select('id, nom, type, pays')
    .order('nom')

  const { data: profil } = await getProfilUtilisateur(supabase, user.id)

  const { data: accords } = await supabase
    .from('accords_commerciaux')
    .select('*, entreprise:entreprises(nom)')
    .order('created_at', { ascending: false })

  // Enrichir les commandes avec les noms d'entreprises
  const commandes = (commandesRaw ?? []).map(c => {
    const marque = (entreprises ?? []).find(e => e.id === c.marque_id)
    const filature = (entreprises ?? []).find(e => e.id === c.filature_id)
    return {
      id: c.id,
      reference: c.reference,
      volume_total_tonnes: c.volume_total_tonnes,
      pct_recycle: c.pct_recycle,
      marque: marque ? { id: marque.id, nom: marque.nom } : null,
      filature: filature ? { id: filature.id, nom: filature.nom } : null,
    }
  })

  return (
    <FacturationClient
      factures={factures ?? []}
      commandes={commandes}
      entreprises={entreprises ?? []}
      accords={accords ?? []}
      profil={{ role: profil?.role ?? '', entreprise_id: profil?.entreprise_id ?? '' }}
      user={user}
    />
  )
}
