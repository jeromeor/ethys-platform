import { createAdminClient } from "@/lib/supabase/admin";

// Récupère la liste des filatures avec leur barème actif
export async function getBaremeFilatures() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("entreprises")
    .select(`
      id,
      nom,
      bareme_commissions_filatures (
        niveau,
        personnalise,
        tranches_personnalisees,
        date_validation
      )
    `)
    .eq("type", "filature");

  if (error) throw error;
  return data;
}

// Récupère les tranches par défaut des 3 niveaux (pour affichage/pré-remplissage)
export async function getBaremeDefautNiveaux() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bareme_defaut_niveaux")
    .select("*")
    .order("tranche_min", { ascending: true });

  if (error) throw error;
  return data;
}
