import { createClient } from '@/lib/supabase/server'
import QRCodeClient from '@/components/modules/QRCodeClient'
import { redirect } from 'next/navigation'

export default async function QRCodePage({ searchParams }: { searchParams: Promise<{ certification_id?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const params = await searchParams

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('role, entreprise_id')
    .eq('id', user.id)
    .single()

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

  const { data: certifications } = await supabase
    .from('certifications_ethys')
    .select(`
      *,
      declaration:declarations_ethys(
        type_produit, volume_recycle_kg, volume_vierge_kg, pct_recycle,
        provenance_pays, filature_nom, filature_pays, description,
        entreprise:entreprises(nom, pays)
      ),
      qr_codes(*)
    `)
    .order('created_at', { ascending: false })

  return (
    <QRCodeClient
      lots={lots ?? []}
      user={{ id: user.id }}
      certifications={certifications ?? []}
      certificationIdActif={params.certification_id ?? null}
    />
  )
}
