with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    ("TRACABILITE", "TRAÇABILITÉ"),
    ("tracabilite", "traçabilité"),
    ("Tracabilite", "Traçabilité"),
    ("certifie", "certifié"),
    ("Certifie", "Certifié"),
    ("recycle", "recyclé"),
    ("Recycle", "Recyclé"),
    ("vierge", "vierge"),
    ("matiere", "matière"),
    ("Matiere", "Matière"),
    ("premiere", "première"),
    ("Premiere", "Première"),
    ("resultat", "résultat"),
    ("Resultat", "Résultat"),
    ("renseigne", "renseigné"),
    ("Renseigne", "Renseigné"),
    ("verifiees", "vérifiées"),
    ("certifiees", "certifiées"),
    ("Donnees", "Données"),
    ("donnees", "données"),
    ("emis", "émis"),
    ("Emis", "Émis"),
    ("Valide jusqu au", "Valide jusqu'au"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open("src/app/tracabilite/[qrId]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
