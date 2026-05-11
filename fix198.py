with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[69] = "        <div style={{ padding: '22px 16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>\n"
lines[70] = "          <img src='/logo_ethys.jpg' alt='ETHYS' style={{ width: open ? 80 : 28, height: 'auto', transition: 'width 0.25s', filter: 'invert(1)', flexShrink: 0 }} />\n"
lines[71] = "        </div>\n"
lines[72] = "\n"
lines[73] = "\n"

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
