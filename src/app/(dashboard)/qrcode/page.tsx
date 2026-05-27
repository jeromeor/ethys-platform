import { createClient } from '@/lib/supabase/server'
import QRCodeClient from '@/components/modules/QRCodeClient'
import { redirect } from 'next/navigation'

export default async function QRCodePage({ searchParams }: { searchParams: Promise<{ certification_id?: string; lot_id?: string }> }) {
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
    .select(`*, commande:commandes(reference, titre, marque:entreprises!commandes_marque_id_fkey(nom), filature:entreprises!commandes_filature_id_fkey(nom), fournisseur:entreprises!commandes_fournisseur_id_fkey(nom)), qr_codes(*)`)
    .order('created_at', { ascending: false })

  const { data: certifications } = profil?.role === 'filature'
  ? await supabase
      .from('certifications_ethys')
      .select('id, reference, date_emission, date_expiration, declaration_id, filature_id')
      .eq('filature_id', profil.entreprise_id)
      .order('created_at', { ascending: false })
  : await supabase
      .from('certifications_ethys')
      .select('id, reference, date_emission, date_expiration, declaration_id, filature_id')
      .order('created_at', { ascending: false })

  const { data: declarations } = await supabase
    .from('declarations_ethys')
    .select('id, type_produit, volume_recycle_kg, volume_vierge_kg, pct_recycle, provenance_pays, filature_nom, filature_pays, description, entreprise_id')

  const { data: entreprises } = await supabase
    .from('entreprises')
    .select('id, nom, pays')

  const { data: qrCodesCerts } = await supabase
    .from('qr_codes')
    .select('*')
    .not('certification_id', 'is', null)

  const certificationsEnrichies = (certifications ?? []).map(cert => {
  const decl = (declarations ?? []).find(d => d.id === cert.declaration_id)
  const entreprise = decl ? (entreprises ?? []).find(e => e.id === decl.entreprise_id) : null
  const qrCodes = (qrCodesCerts ?? []).filter(q => q.certification_id === cert.id)
  return {
    ...cert,
    numero: cert.reference,        // ← alias pour compatibilité QRCodeClient
    date_validite: cert.date_expiration,  // ← alias pour compatibilité QRCodeClient
    declaration: decl ? { ...decl, entreprise: entreprise ?? null } : null,
    qr_codes: qrCodes,
  }
})

  // Calcul avancement global par commande
  const commandeIds = [...new Set((lots ?? []).map(l => (l.commande as any)?.id).filter(Boolean))]
  const { data: tousLots } = commandeIds.length > 0
    ? await supabase.from('lots').select('id, commande_id, avancement_pct').in('commande_id', commandeIds)
    : { data: [] }

  const avancementParCommande: Record<string, number> = {}
  for (const cmdId of commandeIds) {
    const lotsCmd = (tousLots ?? []).filter((l: any) => l.commande_id === cmdId)
    if (lotsCmd.length === 0) continue
    avancementParCommande[cmdId] = Math.round(lotsCmd.reduce((s: number, l: any) => s + l.avancement_pct, 0) / lotsCmd.length)
  }

  const lotsEnrichis = (lots ?? []).map(l => ({
    ...l,
    avancement_commande_pct: avancementParCommande[(l.commande as any)?.id] ?? (l as any).avancement_pct
  }))

  // Demandes QR en attente pour les lots visibles
  const lotIds = (lots ?? []).map(l => l.id)
  const { data: demandesQr } = lotIds.length > 0
    ? await supabase
        .from('demandes_qr')
        .select('id, lot_id, statut, created_at')
        .in('lot_id', lotIds)
        .eq('statut', 'en_attente')
    : { data: [] }

  return (
    <QRCodeClient
      lots={lotsEnrichis}
      user={{ id: user.id }}
      profil={{ role: profil?.role ?? '', entreprise_id: profil?.entreprise_id ?? '' }}
      certifications={certificationsEnrichies}
      certificationIdActif={params.certification_id ?? null}
      lotIdActif={params.lot_id ?? null}
      demandesQrEnAttente={demandesQr ?? []}
    />
  )
}
