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
      ),
      qr_codes(*)
    `)
    .order('created_at', { ascending: false })

  return <QRCodeClient lots={lots ?? []} user={user} />
}