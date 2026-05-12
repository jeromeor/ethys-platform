with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[256] = "                              background: fait ? '#e8e3d8' : enCours ? '#c2956e' : '#d4c5b0',\n"
lines[257] = "                              color: fait ? '#1a1a1a' : enCours ? '#fff' : '#8b7355',\n"
lines[258] = "                              boxShadow: enCours ? '0 0 0 3px rgba(194,149,110,0.3)' : 'none'\n"
lines[260] = "                            }}>{fait ? '\u2713' : i + 1}</div>\n"
lines[261] = "                            <div style={{ fontSize: 9, color: fait ? '#4a5568' : enCours ? '#c2956e' : '#8b7355', fontWeight: enCours ? 700 : 400, textAlign: 'center', marginTop: 4, lineHeight: 1.3 }}>\n"

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
