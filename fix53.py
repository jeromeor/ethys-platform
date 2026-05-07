with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'if (data) window.location.reload()' in line:
        lines[i] = "                    console.log('QR insert result:', data, error)\n                    if (data) window.location.reload()\n                    else console.error('Insert failed:', error)\n"

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
