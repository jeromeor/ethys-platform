with open("src/app/(dashboard)/dashboard/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter formatage statuts
format_fn = """
const formatStatut = (s: string) => ({
  en_production: 'En production',
  livree: 'Livr\u00e9e',
  soumise: 'Soumise',
  validation_filature: 'Val. filature',
  validation_finale: 'Val. finale',
  annulee: 'Annul\u00e9e',
}[s] ?? s)

"""

content = content.replace(
    "export default async function DashboardPage",
    format_fn + "export default async function DashboardPage"
)

content = content.replace("{c.statut}", "{formatStatut(c.statut)}")

with open("src/app/(dashboard)/dashboard/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
