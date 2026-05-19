'use server'
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30))
console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20))
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function creerCommandeAction(formData: {
  reference: string
  titre: string | null
  marque_id: string
  filature_id: string
  fournisseur_id: string
  type_coton: string
  volume_recycle_tonnes: number
  volume_vierge_tonnes: number
  grammage: number | null
  date_livraison_souhaitee: string
  priorite: string
  notes: string | null
  statut: string
  created_by: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('commandes')
    .insert(formData)
    .select('*, marque:entreprises!commandes_marque_id_fkey(nom), filature:entreprises!commandes_filature_id_fkey(nom), fournisseur:entreprises!commandes_fournisseur_id_fkey(nom)')
    .single()

  if (error) return { error: error.message }
  return { data }
}
