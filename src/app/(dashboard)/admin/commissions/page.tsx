import { redirect } from "next/navigation";
import { getProfilUtilisateur } from "@/lib/data/profils";
import { getBaremeFilatures, getBaremeDefautNiveaux } from "@/lib/data/commissions";
import CommissionsFilaturesClient from "./CommissionsFilaturesClient";

export default async function CommissionsPage() {
  const profil = await getProfilUtilisateur();
  if (!profil || profil.role !== "admin") {
    redirect("/dashboard");
  }

  const filatures = await getBaremeFilatures();
  const defauts = await getBaremeDefautNiveaux();

  return <CommissionsFilaturesClient filatures={filatures} defauts={defauts} />;
}
