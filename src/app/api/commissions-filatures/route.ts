import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfilUtilisateur } from "@/lib/data/profils";
import { getBaremeFilatures, getBaremeDefautNiveaux } from "@/lib/data/commissions";

// GET : liste des filatures + barèmes (admin uniquement)
export async function GET() {
  const profil = await getProfilUtilisateur();
  if (!profil || profil.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const filatures = await getBaremeFilatures();
  const defauts = await getBaremeDefautNiveaux();

  return NextResponse.json({ filatures, defauts });
}

// POST : mise à jour du barème d'une filature (admin uniquement)
export async function POST(req: NextRequest) {
  const profil = await getProfilUtilisateur();
  if (!profil || profil.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const { filature_id, niveau, personnalise, tranches_personnalisees } = body;

  if (!filature_id || !niveau) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  // Récupération de l'IP réelle (proxy Vercel)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  const supabase = createAdminClient();

  // Ancien état pour l'historique
  const { data: ancien } = await supabase
    .from("bareme_commissions_filatures")
    .select("niveau, tranches_personnalisees")
    .eq("filature_id", filature_id)
    .single();

  // Mise à jour (ou création si absente) du barème actif
  const { error: errUpsert } = await supabase
    .from("bareme_commissions_filatures")
    .upsert(
      {
        filature_id,
        niveau,
        personnalise: !!personnalise,
        tranches_personnalisees: personnalise ? tranches_personnalisees : null,
        valide_par_admin_id: profil.id,
        date_validation: new Date().toISOString(),
        ip_validation: ip,
      },
      { onConflict: "filature_id" }
    );

  if (errUpsert) {
    return NextResponse.json({ error: errUpsert.message }, { status: 500 });
  }

  // Trace dans l'historique
  await supabase.from("bareme_commissions_historique").insert({
    filature_id,
    ancien_niveau: ancien?.niveau ?? null,
    nouveau_niveau: niveau,
    ancien_tranches: ancien?.tranches_personnalisees ?? null,
    nouveau_tranches: personnalise ? tranches_personnalisees : null,
    modifie_par_admin_id: profil.id,
    ip_adresse: ip,
  });

  return NextResponse.json({ success: true });
}
