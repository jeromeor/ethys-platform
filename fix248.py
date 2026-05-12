with open('src/app/(dashboard)/profil/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "background: 'linear-gradient(135deg, #1a1a1a, #0D5C3A)'",
    "background: '#1a1a1a'"
)
content = content.replace(
    "background: entreprise?.statut === 'verifie' ? '#10B981' : '#F59E0B'",
    "background: entreprise?.statut === 'verifie' ? '#2d5016' : '#b8860b'"
)
content = content.replace("color: '#6EE7B7'", "color: '#c2956e'")
content = content.replace("background: '#D1FAE5'", "background: '#f0f4ec'")
content = content.replace("border: '1px solid #EEF0F3'", "border: '1px solid #e8e3d8'")
content = content.replace("borderRadius: 14", "borderRadius: 8")

with open('src/app/(dashboard)/profil/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Profil")
