with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "}).select().single()" in line and i > 440:
        lines[i] = line.replace(
            "}).select().single()",
            "}).select().single()\n                    .then(({ data, error }) => {\n                      console.log('QR insert result:', data, error?.message)\n                      if (data) window.location.reload()\n                      else console.error('Insert failed:', error)\n                    })"
        )
        # Supprimer les lignes suivantes qui font doublon
        break

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
