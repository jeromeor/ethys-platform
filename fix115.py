with open("src/components/modules/AdminClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "const TABS = ['Utilisateurs', 'Demandes en attente', 'S\u00e9curit\u00e9']",
    "const TABS = ['Utilisateurs', 'Comptes \u00e0 valider', 'Demandes en attente', 'S\u00e9curit\u00e9']"
)

with open("src/components/modules/AdminClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
