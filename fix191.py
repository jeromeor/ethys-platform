with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer l affichage du logo
content = content.replace(
    '<img src="/logo.png" alt="ETHYS" style={{ width: open ? 110 : 32, height: \'auto\', transition: \'width 0.2s\' }} />',
    '<img src="/logo_ethys.jpg" alt="ETHYS" style={{ width: open ? 90 : 28, height: \'auto\', transition: \'width 0.2s\', filter: \'invert(1)\' }} />'
)

# Si le logo est reference differemment
content = content.replace('src="/logo.png"', 'src="/logo_ethys.jpg"')

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
