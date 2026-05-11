with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Element actif dans la sidebar
content = content.replace(
    "background: isActive ? '#0A3D26'",
    "background: isActive ? 'rgba(194,149,110,0.15)'"
)
content = content.replace(
    "background: isActive ? 'rgba(255,255,255,0.15)'",
    "background: isActive ? 'rgba(194,149,110,0.15)'"
)
content = content.replace(
    "borderLeft: `3px solid ${isActive ? '#10B981' : 'transparent'}`",
    "borderLeft: `3px solid ${isActive ? '#c2956e' : 'transparent'}`"
)
content = content.replace(
    "borderLeft: `3px solid ${isActive ? '#6EE7B7' : 'transparent'}`",
    "borderLeft: `3px solid ${isActive ? '#c2956e' : 'transparent'}`"
)

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
