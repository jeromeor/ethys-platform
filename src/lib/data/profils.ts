import type { SupabaseClient } from '@supabase/supabase-js'

// Récupère le profil de l'utilisateur connecté avec son entreprise
export async function getProfilUtilisateur(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('profils_utilisateurs')
    .select('*, entreprise:entreprises(*)')
    .eq('id', userId)
    .single()
}
