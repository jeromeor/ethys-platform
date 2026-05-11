with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remplacer le bloc logo (lignes 69-72)
lines[68] = "        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #e8e3d8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>\n"
lines[69] = "          <img src='/logo_ethys.jpg' alt='ETHYS' style={{ width: open ? 100 : 36, height: 'auto', transition: 'width 0.25s', flexShrink: 0 }} />\n"
lines[70] = "          {open && <div style={{ fontSize: 10, fontWeight: 600, color: '#1a1a1a', letterSpacing: 2, marginTop: 6, textTransform: 'uppercase' }}>Platform</div>}\n"
lines[71] = "        </div>\n"

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
