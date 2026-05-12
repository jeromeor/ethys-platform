# PROFIL - header vert dans page.tsx
with open('src/app/(dashboard)/profil/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("background: 'linear-gradient(135deg, #0A3D26", "background: 'linear-gradient(135deg, #1a1a1a")
content = content.replace("background: 'linear-gradient(135deg,#0A3D26", "background: 'linear-gradient(135deg,#1a1a1a")
content = content.replace("background: '#0A3D26'", "background: '#1a1a1a'")
content = content.replace("background: '#0D5C3A'", "background: '#2a2a2a'")
content = content.replace("color: '#0A3D26'", "color: '#1a1a1a'")
content = content.replace("color: '#065F46'", "color: '#2d5016'")
with open('src/app/(dashboard)/profil/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Profil")

# ANNUAIRE - badges
with open('src/components/modules/AnnuaireClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("background: '#D1FAE5', color: '#065F46'", "background: '#f0f4ec', color: '#2d5016'")
content = content.replace("background: '#DBEAFE', color: '#1E40AF'", "background: '#f0f3fc', color: '#1a1a1a'")
content = content.replace("background: '#FEF3C7', color: '#92400E'", "background: '#fdf8ec', color: '#b8860b'")
with open('src/components/modules/AnnuaireClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Annuaire")

# PRODUCTION - etapes passees visibles (beige clair, pas noir sur noir)
with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("'#10B981'", "'#c2956e'")
content = content.replace("'#059691'", "'#c2956e'")
with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Production")
