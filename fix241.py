with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remplacer le header certification (lignes 52-58) par le meme layout que le lot
lines[51] = "          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>\n"
lines[52] = "            <div>\n"
lines[53] = "              <div style={{ fontSize: 9, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>ETHYS \u2014 CERTIFICATION</div>\n"
lines[54] = "              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 2 }}>Fil certifi\u00e9 ETHYS</div>\n"
lines[55] = "              <div style={{ fontSize: 11, opacity: 0.6 }}>{cert?.numero}</div>\n"
lines[56] = "            </div>\n"
lines[57] = "            <img src='/logo_ethys.png' alt='ETHYS' style={{ width: 90, height: 'auto', filter: 'invert(1)', flexShrink: 0 }} />\n"
lines[58] = "          </div>\n"

# Supprimer les lignes devenues inutiles (numero cert et validite en double)
lines[59] = "\n"
lines[60] = "\n"
lines[61] = "\n"
lines[62] = "\n"

# Corriger couleur #0A3D26 -> #1a1a1a
for i in range(len(lines)):
    lines[i] = lines[i].replace('#0A3D26', '#1a1a1a')
    lines[i] = lines[i].replace('#1A202C', '#1a1a1a')
    lines[i] = lines[i].replace('#94A3B8', '#8b7355')
    lines[i] = lines[i].replace('#CBD5E1', '#d4c5b0')
    lines[i] = lines[i].replace("borderRadius: 12", "borderRadius: 4")
    lines[i] = lines[i].replace("border: '1px solid #EEF0F3'", "border: '1px solid #e8e3d8'")
    # Supprimer le v parasite
    lines[i] = lines[i].replace('>v Certifi\u00e9 ETHYS<', '>\u2713 Certifi\u00e9 ETHYS<')

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
