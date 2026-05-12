import glob

# PROFIL - header vert
with open('src/components/modules/ProfilClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("background: 'linear-gradient(135deg, #0A3D26", "background: 'linear-gradient(135deg, #1a1a1a")
content = content.replace("background: 'linear-gradient(135deg,#0A3D26", "background: 'linear-gradient(135deg,#1a1a1a")
content = content.replace("background: '#0A3D26'", "background: '#1a1a1a'")
content = content.replace("background: '#0D5C3A'", "background: '#2a2a2a'")
with open('src/components/modules/ProfilClient.tsx', 'w', encoding='utf-8') as f:
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

# PRODUCTION - etapes
with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Etape active: vert -> ocre
content = content.replace(
    "background: step <= currentStep ? '#1a1a1a' : '#e8e3d8'",
    "background: step === currentStep ? '#c2956e' : step < currentStep ? '#1a1a1a' : '#e8e3d8'"
)
content = content.replace(
    "color: step <= currentStep ? '#fff' : '#8b7355'",
    "color: step <= currentStep ? '#fff' : '#8b7355'"
)
# Si la structure est differente
content = content.replace("'#10B981'", "'#c2956e'")
content = content.replace("'#059691'", "'#c2956e'")

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Production")
