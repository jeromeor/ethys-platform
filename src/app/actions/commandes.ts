'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function creerCommandeAction(formData: {
  reference: string
  titre: string | null
  marque_id: string
  filature_id: string
  fournisseur_id: string
  volume_recycle_tonnes: number
  volume_vierge_tonnes: number
  grammage: number | null
  date_livraison_souhaitee: string
  priorite: string
  notes: string | null
  statut: string
  created_by: string
}) {
  // Vérifie que l'utilisateur est bien authentifié
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // INSERT avec service_role pour bypasser les problèmes PostgREST
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('commandes')
    .insert(formData)
    .select('*, marque:entreprises!commandes_marque_id_fkey(nom), filature:entreprises!commandes_filature_id_fkey(nom), fournisseur:entreprises!commandes_fournisseur_id_fkey(nom)')
    .single()

  if (error) return { error: error.message }
  return { data }
}
