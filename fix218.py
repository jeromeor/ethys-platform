import glob

files = glob.glob('src/components/modules/*.tsx')

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    
    # Supprimer les emojis
    content = content.replace('\U0001f3c6', '')  # coupe
    content = content.replace('\u267b', '')  # recycle
    content = content.replace('\U0001f33f', '')  # feuille
    content = content.replace('\u2605', '')  # etoile
    content = content.replace('\u26a1', '')  # eclair
    content = content.replace('\u2699', '')  # engrenage
    
    # Statuts avec accents dans le dashboard
    content = content.replace("'en_production'", "'En production'")
    content = content.replace("'livree'", "'Livree'")
    content = content.replace('"en_production"', '"En production"')
    content = content.replace('"livree"', '"Livree"')
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

print("Done")
