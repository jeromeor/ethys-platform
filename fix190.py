with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Sidebar: vert -> noir ETHYS
content = content.replace("background: '#0A3D26'", "background: '#1a1a1a'")
content = content.replace("background: '#0D5C3A'", "background: '#1a1a1a'")
content = content.replace("background: '#0B4A2E'", "background: '#2a2a2a'")

# Liens actifs: vert clair -> ocre
content = content.replace("background: 'rgba(255,255,255,0.15)'", "background: 'rgba(194,149,110,0.20)'")
content = content.replace("background: 'rgba(255,255,255,0.1)'", "background: 'rgba(255,255,255,0.06)'")

# Texte actif: blanc -> ocre
content = content.replace("color: isActive ? '#fff' : 'rgba(255,255,255,0.6)'", "color: isActive ? '#c2956e' : 'rgba(255,255,255,0.55)'")
content = content.replace("color: '#6EE7B7'", "color: '#c2956e'")

# Boutons header: vert -> noir
content = content.replace("background: '#0A3D26', color: '#fff'", "background: '#1a1a1a', color: '#ffffff'")

# Avatar: vert -> noir
content = content.replace("background: '#0A3D26', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff'", "background: '#c2956e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff'")

# Bordures et fonds header
content = content.replace("background: '#fff', borderBottom: '1px solid #EEF0F3'", "background: '#ffffff', borderBottom: '1px solid #e8e3d8'")

# Logo text
content = content.replace("color: '#0A3D26'", "color: '#1a1a1a'")
content = content.replace("color: '#065F46'", "color: '#2d5016'")
content = content.replace("color: '#D1FAE5'", "color: '#e8e3d8'")

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
