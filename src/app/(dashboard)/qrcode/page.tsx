import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QRCodeClient from '@/components/modules/QRCodeClient'

export default async function QRCodePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lots } = await supabase
    .from('lots')
    .select(`
      *,
      commande:commandes(
        reference, titre,
        marque:entreprises!commandes_marque_id_fkey(nom),
        filature:entreprises!commandes_filature_id_fkey(nom),
        fournisseur:entreprises!commandes_fournisseur_id_fkey(nom)
      )
    `)
    .order('created_at', { ascending: false })

  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('*')

  const lotsAvecQR = (lots ?? []).map(l => ({
    ...l,
    qr_codes: (qrCodes ?? []).filter(q => q.lot_id === l.id),
  }))

  return <QRCodeClient lots={lotsAvecQR} user={user} />
}