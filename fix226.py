content = open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8').read()

# Remplacer les couleurs du header
content = content.replace(
    "background: 'linear-gradient(135deg,#0A3D26,#0D5C3A)', padding: '32px 24px', color: '#fff'",
    "background: '#1a1a1a', padding: '32px 24px', color: '#fff'"
)

# Sous-titre couleur
content = content.replace(
    "fontSize: 10, color: '#6EE7B7', fontWeight: 600, letterSpacing: 1, marginBottom: 8",
    "fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 8"
)

# Fond composition
content = content.replace(
    "background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px', marginBottom: 14",
    "background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '16px', marginBottom: 14"
)

# Couleur label MATIERES PREMIERES
content = content.replace(
    "fontSize: 10, color: '#6EE7B7', fontWeight: 600, marginBottom: 10, letterSpacing: 1",
    "fontSize: 10, color: '#c2956e', fontWeight: 600, marginBottom: 10, letterSpacing: 1"
)

# Bloc recycle - vert -> ocre
content = content.replace(
    "flex: pctRecycl\u00e9, background: '#10B981', borderRadius: 6",
    "flex: pctRecycl\u00e9, background: '#8b7355', borderRadius: 4"
)

# Bloc vierge
content = content.replace(
    "flex: pctVierge, background: 'rgba(255,255,255,0.15)', borderRadius: 6",
    "flex: pctVierge, background: 'rgba(255,255,255,0.12)', borderRadius: 4"
)

# Barre de progression
content = content.replace(
    "background: '#6EE7B7', borderRadius: 3",
    "background: '#c2956e', borderRadius: 2"
)
content = content.replace(
    "background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden'",
    "background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden'"
)

# Bloc certification - vert -> neutre
content = content.replace(
    "background: 'rgba(110,231,183,0.2)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(110,231,183,0.4)'",
    "background: 'rgba(194,149,110,0.15)', borderRadius: 4, padding: '12px 14px', border: '1px solid rgba(194,149,110,0.3)'"
)
content = content.replace(
    "fontSize: 14, fontWeight: 900, color: '#6EE7B7', marginBottom: 4",
    "fontSize: 14, fontWeight: 900, color: '#c2956e', marginBottom: 4"
)
content = content.replace(
    "fontSize: 11, fontWeight: 700, color: '#6EE7B7'",
    "fontSize: 11, fontWeight: 700, color: '#c2956e'"
)

# Fond page
content = content.replace(
    "minHeight: '100vh', background: '#F7F8FA', fontFamily: \"'DM Sans', sans-serif\"",
    "minHeight: '100vh', background: '#f5f3ef', fontFamily: \"'Inter', system-ui, sans-serif\""
)

# Icones fond
content = content.replace(
    "background: label === 'Numero certification' ? '#D1FAE5' : '#F0FDF4'",
    "background: label === 'Numero certification' ? '#f0f4ec' : '#f5f3ef'"
)
content = content.replace(
    "background: label === 'Certification fil' ? '#D1FAE5' : '#F0FDF4'",
    "background: '#f5f3ef'"
)

# Couleur certification fil
content = content.replace(
    "color: label === 'Certification fil' ? '#065F46' : '#64748B', fontWeight: label === 'Certification fil' ? 700 : 400",
    "color: label === 'Certification fil' ? '#2d5016' : '#4a5568', fontWeight: label === 'Certification fil' ? 700 : 400"
)
content = content.replace(
    "color: label === 'Numero certification' ? '#065F46' : '#64748B', fontWeight: label === 'Numero certification' ? 700 : 400",
    "color: label === 'Numero certification' ? '#2d5016' : '#4a5568', fontWeight: label === 'Numero certification' ? 700 : 400"
)

# Logo ETHYS en bas
content = content.replace(
    "fontFamily: \"'DM Sans', sans-serif\"",
    "fontFamily: \"'Inter', system-ui, sans-serif\""
)

# Bordures
content = content.replace("borderBottom: '1px solid #EEF0F3'", "borderBottom: '1px solid #e8e3d8'")

open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8').write(content)
print("Done")
