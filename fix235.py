with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remplacer les lignes 142-148 par le bon layout
lines[141] = "          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>\n"
lines[142] = "            <div>\n"
lines[143] = "              <div style={{ fontSize: 9, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>ETHYS \u2014 TRA\u00c7ABILIT\u00c9</div>\n"
lines[144] = "              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Votre fil ETHYS</div>\n"
lines[145] = "            </div>\n"
lines[146] = "            <img src='/logo_ethys.png' alt='ETHYS' style={{ width: 90, height: 'auto', filter: 'invert(1)', flexShrink: 0 }} />\n"
lines[147] = "          </div>\n"
lines[148] = "\n"

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
