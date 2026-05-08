with open('src/app/(auth)/onboarding/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('Completez', 'Complétez'),
    ('necessaires', 'nécessaires'),
    ('fonctionnalites', 'fonctionnalités'),
    ('Prenom', 'Prénom'),
    ('Telephone', 'Téléphone'),
    ('reinitialisation', 'réinitialisation'),
    ('Validez', 'Validez'),
    ('valable', 'valable'),
    ('apres', 'après'),
    ('Sauvegarde', 'Sauvegarde'),
    ('Sauvegardé', 'Sauvegardé'),
    ('verifiee', 'vérifiée'),
    ('verifier', 'vérifier'),
    ('entreprise sera verifiee', 'entreprise sera vérifiée'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('src/app/(auth)/onboarding/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
