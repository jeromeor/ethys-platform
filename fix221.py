import glob

files = glob.glob('src/components/modules/*.tsx')

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    
    # Revenir sur les remplacements de statuts dans les cles d objet
    content = content.replace("'En production':", "'en_production':")
    content = content.replace('"En production":', '"en_production":')
    content = content.replace("'Livree':", "'livree':")
    content = content.replace('"Livree":', '"livree":')
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

print("Done")
