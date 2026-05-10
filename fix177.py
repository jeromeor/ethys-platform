with open("src/app/(dashboard)/commandes/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    """  const { data: commandes } = await supabase
    .from('commandes')
    .select(`
      *,
      marque:entreprises!commandes_marque_id_fkey(nom, pays),
      filature:entreprises!commandes_filature_id_fkey(nom, pays),
      fournisseur:entreprises!commandes_fournisseur_id_fkey(nom, pays),
      validations(*)
    `)
    .order('created_at', { ascending: false })""",
    """  const entrepriseId = profil?.entreprise_id
  const role = profil?.role

  let commandesQuery = supabase
    .from('commandes')
    .select(`
      *,
      marque:entreprises!commandes_marque_id_fkey(nom, pays),
      filature:entreprises!commandes_filature_id_fkey(nom, pays),
      fournisseur:entreprises!commandes_fournisseur_id_fkey(nom, pays),
      validations(*)
    `)

  if (role !== 'admin' && entrepriseId) {
    if (role === 'marque') commandesQuery = commandesQuery.eq('marque_id', entrepriseId)
    else if (role === 'filature') commandesQuery = commandesQuery.eq('filature_id', entrepriseId)
    else if (role === 'fournisseur_coton') commandesQuery = commandesQuery.eq('fournisseur_id', entrepriseId)
  }

  const { data: commandes } = await commandesQuery.order('created_at', { ascending: false })"""
)

with open("src/app/(dashboard)/commandes/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
