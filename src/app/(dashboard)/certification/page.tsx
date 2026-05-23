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
  // Jointure : certifications_ethys → declarations_ethys → entreprises
  let certsQuery = supabase
    .from('certifications_ethys')
    .select(`
      id, numero, date_emission, date_validite, valide, created_at,
      declaration:declarations_ethys(
        id, statut, type_produit, volume_recycle_kg, volume_vierge_kg,
        pct_recycle, provenance_pays, filature_nom, filature_pays,
        description, commentaire_admin, entreprise_id, initiateur_id,
        created_at,
        entreprise:entreprises!declarations_ethys_entreprise_id_fkey(id, nom)
      )
    `)
    .order('created_at', { ascending: false })

  // Filature : uniquement ses propres certifications (via declaration.entreprise_id)
  // On filtre côté JS après fetch car Supabase ne supporte pas le filtre sur relation imbriquée directement
  const { data: certsRaw } = await certsQuery

  const certifications = (certsRaw ?? []).filter(c => {
    if (role === 'admin') return true
    const decl = Array.isArray(c.declaration) ? c.declaration[0] : c.declaration
    return decl?.entreprise_id === entrepriseId
  })

  // --- Déclarations en attente de certification (pour admin) ---
  // Déclarations soumises par des filatures, pas encore certifiées
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

  // --- Déclarations éligibles pour la filature connectée (pas encore certifiées) ---
  // Utilisé pour le formulaire "Demander une certification"
  let declarationsEligibles: any[] = []
  if (role === 'filature') {
    // Récupère les declaration_id déjà certifiés
    const { data: declsDejaCouverts } = await supabase
      .from('certifications_ethys')
      .select('declaration_id')
    const declIdsCoverts = (declsDejaCouverts ?? []).map(c => c.declaration_id).filter(Boolean)

    let declQuery = supabase
      .from('declarations_ethys')
      .select(`
        id, statut, type_produit, volume_recycle_kg, volume_vierge_kg,
        pct_recycle, provenance_pays, filature_nom, description, created_at
      `)
      .eq('entreprise_id', entrepriseId)
      .eq('eligible_ethys', true)

    if (declIdsCoverts.length > 0) {
      declQuery = declQuery.not('id', 'in', `(${declIdsCoverts.join(',')})`)
    }

    const { data: declsRaw } = await declQuery
    declarationsEligibles = declsRaw ?? []
  }

  return (
    <CertificationClient
      certifications={certifications as any}
      declarationsEnAttente={declarationsEnAttente as any}
      declarationsEligibles={declarationsEligibles as any}
      userRole={role}
      entrepriseId={entrepriseId}
      userId={user.id}
    />
  )
}
