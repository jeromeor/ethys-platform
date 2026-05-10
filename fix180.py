with open("src/app/(dashboard)/production/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Ajouter le filtre apres .order et avant const entreprises
lines[36] = "    .order('created_at', { ascending: false })\n"
lines.insert(37, "\n  if (role !== 'admin' && entrepriseId) {\n    if (role === 'filature') productionQuery = productionQuery.eq('filature_id', entrepriseId)\n    else if (role === 'marque') productionQuery = productionQuery.eq('marque_id', entrepriseId)\n  }\n\n  const { data: raw } = await productionQuery\n")

with open("src/app/(dashboard)/production/page.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
