with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Le flex doit englober titre + reference lot d un cote, logo de l autre
lines[141] = "          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>\n"
lines[142] = "            <div>\n"
lines[143] = "              <div style={{ fontSize: 9, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>ETHYS \u2014 TRA\u00c7ABILIT\u00c9</div>\n"
lines[144] = "              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>Votre fil ETHYS</div>\n"

# Trouver la ligne de reference lot et l inclure dans le div gauche
for i in range(145, 160):
    if "Lot #" in lines[i]:
        # Deplacer la ligne reference dans le div gauche
        ref_line = lines[i]
        lines[i] = ""
        lines[144] = lines[144].rstrip('\n') + "\n              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>" + "Lot #{String(lot?.reference ?? '')} - {String(commande?.reference ?? '')}" + "</div>\n"
        break

lines[145] = "            </div>\n"
lines[146] = "            <img src='/logo_ethys.png' alt='ETHYS' style={{ width: 90, height: 'auto', filter: 'invert(1)', flexShrink: 0 }} />\n"
lines[147] = "          </div>\n"

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
