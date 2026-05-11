with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Sidebar: noir -> blanc
content = content.replace(
    "background: '#1a1a1a', display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease', overflow: 'hidden', flexShrink: 0",
    "background: '#ffffff', display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease', overflow: 'hidden', flexShrink: 0, borderRight: '1px solid #d4c5b0'"
)

# Bordure logo section
content = content.replace(
    "borderBottom: '1px solid rgba(255,255,255,0.08)'",
    "borderBottom: '1px solid #e8e3d8'"
)

# Logo: invert(1) -> pas de filtre
content = content.replace(
    "filter: 'invert(1)', flexShrink: 0",
    "flexShrink: 0"
)

# Texte nav: blanc -> noir
content = content.replace(
    "color: active ? '#6EE7B7' : 'rgba(255,255,255,0.55)'",
    "color: active ? '#1a1a1a' : '#4a5568'"
)
content = content.replace(
    "color: active ? '#c2956e' : 'rgba(255,255,255,0.55)'",
    "color: active ? '#1a1a1a' : '#4a5568'"
)

# Fond actif
content = content.replace(
    "background: active ? 'rgba(194,149,110,0.15)' : 'transparent'",
    "background: active ? '#e8e3d8' : 'transparent'"
)
content = content.replace(
    "background: active ? 'rgba(16,185,129,0.18)' : 'transparent'",
    "background: active ? '#e8e3d8' : 'transparent'"
)

# Bouton toggle
content = content.replace(
    "background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)'",
    "background: '#f5f3ef', color: '#8b7355'"
)

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
