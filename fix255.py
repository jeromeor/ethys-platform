with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[350] = "                <div style={{ fontSize: 14, fontWeight: 900, color: '#c2956e', marginBottom: 4 }}>Fil certifi\u00e9 ETHYS</div>\n"

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
