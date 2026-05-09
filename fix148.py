with open("src/components/modules/ReportingClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "montant_ttc: number",
    "montant_ht: number"
)
content = content.replace(
    "s + f.montant_ttc",
    "s + f.montant_ht"
)
content = content.replace(
    "map[mois].ca += f.montant_ttc",
    "map[mois].ca += f.montant_ht"
)

with open("src/components/modules/ReportingClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
