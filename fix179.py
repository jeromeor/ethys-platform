with open("src/app/(dashboard)/production/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter le filtre par entreprise
old = """  const { data: raw } = await supabase
    .from('commandes')
    .select(`"""

new = """  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('role, entreprise_id')
    .eq('id', user.id)
    .single()

  const role = profil?.role
  const entrepriseId = profil?.entreprise_id

  let productionQuery = supabase
    .from('commandes')
    .select(`"""

content = content.replace(old, new)

# Remplacer .select( par productionQuery variable
content = content.replace(
    "  const { data: raw } = await supabase\n    .from('commandes')\n    .select(`",
    "  let productionQuery = supabase\n    .from('commandes')\n    .select(`"
)

with open("src/app/(dashboard)/production/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
