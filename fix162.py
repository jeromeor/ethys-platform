with open("src/components/modules/FacturationClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter destinataire_id dans l interface Facture
content = content.replace(
    "  destinataire: { nom: string; adresse: string | null; email_contact: string | null } | null\n}",
    "  destinataire_id: string | null\n  destinataire: { nom: string; adresse: string | null; email_contact: string | null } | null\n}"
)

with open("src/components/modules/FacturationClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
