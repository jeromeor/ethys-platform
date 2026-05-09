with open("src/app/(dashboard)/facturation/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "  const { data: entreprises } = await supabase\n    .from('entreprises')\n    .select('id, nom, type')\n    .order('nom')",
    """  const { data: entreprises } = await supabase
    .from('entreprises')
    .select('id, nom, type')
    .order('nom')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('role, entreprise_id')
    .eq('id', user.id)
    .single()

  const { data: accords } = await supabase
    .from('accords_commerciaux')
    .select('*, entreprise:entreprises(nom)')
    .order('created_at', { ascending: false })"""
)

content = content.replace(
    "    <FacturationClient\n      factures={factures ?? []}\n      commandes={commandes}\n      entreprises={entreprises ?? []}\n      user={user}\n    />",
    """    <FacturationClient
      factures={factures ?? []}
      commandes={commandes}
      entreprises={entreprises ?? []}
      accords={accords ?? []}
      profil={{ role: profil?.role ?? '', entreprise_id: profil?.entreprise_id ?? '' }}
      user={user}
    />"""
)

with open("src/app/(dashboard)/facturation/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
