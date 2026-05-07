with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Supprimer les lignes du bloc profil/deconnexion en bas (lignes 82 a 97 environ)
# Trouver le debut et la fin du bloc
start = None
end = None
for i, line in enumerate(lines):
    if "padding: '10px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)'" in line:
        start = i
    if start and i > start and '</aside>' in line:
        end = i
        break

if start and end:
    del lines[start:end]
    print(f'Removed lines {start+1} to {end}')

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
