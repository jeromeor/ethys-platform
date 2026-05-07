with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Supprimer le console.log
for i, line in enumerate(lines):
    if "console.log('certifications:'," in line:
        lines[i] = ''

# Corriger les stats pour afficher selon la source active
for i, line in enumerate(lines):
    if "lots.filter(l => l.qr_codes?.length > 0).length" in line:
        lines[i] = "            <span style={{ fontWeight: 700, color: '#0A3D26' }}>{source === 'lots' ? lots.filter(l => l.qr_codes?.length > 0).length : certifications.filter(c => c.qr_codes?.length > 0).length}</span> QR g\u00e9n\u00e9r\u00e9s\n"
    if "lots.filter(l => !l.qr_codes?.length).length" in line:
        lines[i] = "            <span style={{ fontWeight: 700, color: '#D97706' }}>{source === 'lots' ? lots.filter(l => !l.qr_codes?.length).length : certifications.filter(c => !c.qr_codes?.length).length}</span> en attente\n"

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
