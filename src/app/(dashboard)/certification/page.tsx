import { createClient } from '@/lib/supabase/server'
import CertificationClient from '@/components/modules/CertificationClient'
import { redirect } from 'next/navigation'

export default async function CertificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('role, entreprise_id')
    .eq('id', user.id)
    .single()

  const role = profil?.role ?? 'filature'
  const entrepriseId = profil?.entreprise_id ?? ''

  // --- Certifications existantes ---
  const certsQuery = supabase
    .from('certifications_ethys')
    .select(`
      id, reference, statut, date_emission, date_expiration, created_at,
      declaration:declarations_ethys(
        id, statut, type_produit, volume_recycle_kg, volume_vierge_kg,
        pct_recycle, provenance_pays, filature_nom, filature_pays,
        description, commentaire_admin, entreprise_id, initiateur_id,
        created_at,
        entreprise:entreprises!declarations_ethys_entreprise_id_fkey(id, nom)
      )
    `)
    .order('created_at', { ascending: false })

  const { data: certsRaw } = await certsQuery

  const certifications = (certsRaw ?? []).filter((c: any) => {
    if (role === 'admin') return true
    const decl = Array.isArray(c.declaration) ? c.declaration[0] : c.declaration
    return decl?.entreprise_id === entrepriseId
  })

  // --- Déclarations en attente de certification (pour admin) ---
  let declarationsEnAttente: any[] = []
  if (role === 'admin') {
    const { data: declsRaw } = await supabase
      .from('declarations_ethys')
      .select(`
        id, statut, type_produit, volume_recycle_kg, volume_vierge_kg,
        pct_recycle, provenance_pays, filature_nom, filature_pays,
        description, declaration_honneur, created_at, entreprise_id, initiateur_id,
        entreprise:entreprises!declarations_ethys_entreprise_id_fkey(id, nom)
      `)
      .eq('statut', 'en_attente')
      .order('created_at', { ascending: false })
    declarationsEnAttente = declsRaw ?? []
  }

  // --- Commandes éligibles pour la filature (production 100%, pas de demande en cours) ---
  let commandesEligibles: any[] = []
  if (role === 'filature') {
    // Récupère les commandes de la filature avec tous les lots à 100%
    const { data: commandes } = await supabase
      .from('commandes')
      .select(`
        id, reference, volume_recycle_tonnes, volume_vierge_tonnes, pct_recycle,
        marque:entreprises!commandes_marque_id_fkey(nom),
        filature:entreprises!commandes_filature_id_fkey(nom),
        lots(id, avancement_pct)
      `)
      .eq('filature_id', entrepriseId)
      .not('statut', 'eq', 'annulee')

    // Récupère les déclarations déjà en cours pour cette filature
    const { data: declsEnCours } = await supabase
      .from('declarations_ethys')
      .select('id, statut')
      .eq('entreprise_id', entrepriseId)
      .in('statut', ['en_attente', 'en_validation', 'certifiee'])

    // Filtre : toutes les commandes avec lots à 100% et sans demande certif en cours
    // Pour la beta on ne bloque pas sur le nb de déclarations existantes
    commandesEligibles = (commandes ?? [])
      .filter((c: any) => {
        const lots = c.lots ?? []
        if (lots.length === 0) return false
        return lots.every((l: any) => l.avancement_pct === 100)
      })
      .map((c: any) => ({
        id: c.id,
        reference: c.reference,
        volume_recycle_kg: (c.volume_recycle_tonnes ?? 0) * 1000,
        volume_vierge_kg: (c.volume_vierge_tonnes ?? 0) * 1000,
        pct_recycle: c.pct_recycle ?? 51,
        filature_nom: (c.filature as any)?.nom ?? '',
        marque_nom: (c.marque as any)?.nom ?? '',
      }))
  }

  return (
    <CertificationClient
      certifications={certifications as any}
      declarationsEnAttente={declarationsEnAttente as any}
      commandesEligibles={commandesEligibles}
      userRole={role}
      entrepriseId={entrepriseId}
      userId={user.id}
    />
  )
}
