with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[172] = "          {source === 'lots' && lots.length === 0 && (\n"
lines[173] = "            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Aucun lot disponible.</div>\n"
lines[174] = "          )}\n"
lines[175] = "          {source === 'lots' && lots.length > 0 && lots.map(lot => {\n"

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
