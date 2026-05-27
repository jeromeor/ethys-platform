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

  // Filtre par filature_id si role filature, sinon toutes les certifications
  let certifications: any[] = []
  if (profil?.role === 'filature' && profil?.entreprise_id) {
    const { data } = await supabase
      .from('certifications_ethys')
      .select('id, reference, date_emission, date_expiration, filature_id, volume_recycle_kg, volume_vierge_kg, pct_recycle, type_produit')
      .eq('filature_id', profil.entreprise_id)
      .order('created_at', { ascending: false })
    certifications = data ?? []
  } else {
    const { data } = await supabase
      .from('certifications_ethys')
      .select('id, reference, date_emission, date_expiration, filature_id, volume_recycle_kg, volume_vierge_kg, pct_recycle, type_produit')
      .order('created_at', { ascending: false })
    certifications = data ?? []
  }

  const { data: entreprises } = await supabase
    .from('entreprises')
    .select('id, nom, pays')

  const { data: qrCodesCerts } = await supabase
    .from('qr_codes')
    .select('*')
    .not('certification_id', 'is', null)

  const certificationsEnrichies = certifications.map((cert: any) => {
    const filature = (entreprises ?? []).find(e => e.id === cert.filature_id)
    const qrCodes = (qrCodesCerts ?? []).filter(q => q.certification_id === cert.id)
    return {
      ...cert,
      numero: cert.reference,
      date_validite: cert.date_expiration,
      declaration: {
        type_produit: cert.type_produit,
        volume_recycle_kg: cert.volume_recycle_kg,
        volume_vierge_kg: cert.volume_vierge_kg,
        pct_recycle: cert.pct_recycle,
        filature_nom: filature?.nom ?? null,
        entreprise: filature ? { nom: filature.nom, pays: filature.pays } : null,
      },
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
