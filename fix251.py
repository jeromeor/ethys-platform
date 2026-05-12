with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

del lines[259]  # supprimer ligne 260 (doublon vide)

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
