with open("src/components/modules/DashboardClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter une fonction de formatage des statuts
statut_map = """
const formatStatut = (s: string) => {
  const map: Record<string, string> = {
    'en_production': 'En production',
    'livree': 'Livree',
    'livree': 'Livree',
    'soumise': 'Soumise',
    'validation_filature': 'Val. filature',
    'validation_finale': 'Val. finale',
    'annulee': 'Annulee',
  }
  return map[s] ?? s
}
"""

# Inserer la fonction avant le export default
content = content.replace(
    "export default function DashboardClient",
    statut_map + "export default function DashboardClient"
)

# Utiliser la fonction pour afficher le statut
content = content.replace(
    "{c.statut}",
    "{formatStatut(c.statut)}"
)

with open("src/components/modules/DashboardClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
