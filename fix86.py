import re

files = [
    "src/components/modules/CommandesClient.tsx",
    "src/components/modules/ProductionClient.tsx",
]

replacements = [
    ("controle qualite", "contrôle qualité"),
    ("en_attente", "en_attente"),
    ("'en attente'", "'en attente'"),
    ("valide", "validé"),
    ("livre", "livré"),
    ("'En attente'", "'En attente'"),
    ("'Valide'", "'Validé'"),
    ("'Livre'", "'Livré'"),
    ("'en production'", "'en production'"),
    ("'controle qualite'", "'contrôle qualité'"),
]

for filepath in files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed: " + filepath)

print("Done")
