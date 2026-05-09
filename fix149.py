with open("src/app/(dashboard)/reporting/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    ".select('montant_ttc, statut, date_emission')",
    ".select('montant_ht, statut, date_emission')"
)

with open("src/app/(dashboard)/reporting/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
