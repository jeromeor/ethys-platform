with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "profil: {\n    role?: string\n    prenom?: string\n    nom?: string\n    entreprise?: { nom?: string }\n  } | null",
    "profil: {\n    id?: string\n    role?: string\n    prenom?: string\n    nom?: string\n    entreprise?: { nom?: string }\n  } | null"
)

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
