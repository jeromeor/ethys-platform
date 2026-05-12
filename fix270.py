with open('src/app/(dashboard)/profil/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Supprimer la ligne 187 (</div> en trop)
del lines[186]

with open('src/app/(dashboard)/profil/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
