with open("src/components/modules/CertificationClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "new Date(selected.certification?.date_validite).toLocaleDateString('fr-FR')",
    "selected.certification?.date_validite ? new Date(selected.certification.date_validite).toLocaleDateString('fr-FR') : 'N/A'"
)
content = content.replace(
    "new Date(selected.certification?.date_emission).toLocaleDateString('fr-FR')",
    "selected.certification?.date_emission ? new Date(selected.certification.date_emission).toLocaleDateString('fr-FR') : 'N/A'"
)

with open("src/components/modules/CertificationClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
