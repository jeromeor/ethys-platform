'use server'

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

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/commandes?select=*,marque:entreprises!commandes_marque_id_fkey(nom),filature:entreprises!commandes_filature_id_fkey(nom),fournisseur:entreprises!commandes_fournisseur_id_fkey(nom)`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SECRET_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY!}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(formData)
  })

  if (!res.ok) {
    const err = await res.text()
    return { error: err }
  }

  const rows = await res.json()
  return { data: rows[0] }
}
