import { createClient } from '@/lib/supabase/server'
import QRCodeClient from '@/components/modules/QRCodeClient'
import { redirect } from 'next/navigation'

export default async function QRCodePage({ searchParams }: { searchParams: Promise<{ certification_id?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const params = await searchParams

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

  const { data: certifications, error: certError } = await supabase
    .from('certifications_ethys')
    .select('*, qr_codes(*)')
    .order('created_at', { ascending: false })

  const { data: declarations } = await supabase
    .from('declarations_ethys')
    .select('id, type_produit, volume_recycle_kg, volume_vierge_kg, pct_recycle, provenance_pays, filature_nom, filature_pays, description, entreprise_id')

  const { data: entreprises } = await supabase
    .from('entreprises')
    .select('id, nom, pays')

  const certificationsEnrichies = (certifications ?? []).map(cert => {
    const decl = declarations?.find(d => d.id === cert.declaration_id)
    const entreprise = entreprises?.find(e => e.id === decl?.entreprise_id)
    return {
      ...cert,
      declaration: decl ? { ...decl, entreprise: entreprise ?? null } : null,
    }
  })

  return (
    <QRCodeClient
      lots={lots ?? []}
      user={{ id: user.id }}
      certifications={certificationsEnrichies}
      certificationIdActif={params.certification_id ?? null}
    />
  )
}
