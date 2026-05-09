with open("src/app/(dashboard)/facturation/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "      emetteur:entreprises!factures_emetteur_id_fkey(nom, adresse, email_contact),\n      destinataire:entreprises!factures_destinataire_id_fkey(nom, adresse, email_contact)",
    "      emetteur_id,\n      destinataire_id,\n      emetteur:entreprises!factures_emetteur_id_fkey(nom, adresse, email_contact),\n      destinataire:entreprises!factures_destinataire_id_fkey(nom, adresse, email_contact)"
)

with open("src/app/(dashboard)/facturation/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
