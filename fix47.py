with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'onClick={() => setSelectedCert(cert)}' in line:
        lines[i] = line.replace(
            'onClick={() => setSelectedCert(cert)}',
            'onClick={() => { setSelectedCert(cert); setSelected(null) }}'
        )

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
