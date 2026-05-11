with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[70] = "          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>\n"
lines[71] = "            <img src='/logo_ethys.jpg' alt='ETHYS' style={{ width: open ? 80 : 28, height: 'auto', transition: 'width 0.25s', filter: 'invert(1)', flexShrink: 0 }} />\n"
lines[72] = "          </div>\n"
lines[73] = ""
lines[74] = ""
lines[75] = ""
lines[76] = ""

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
