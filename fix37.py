with open('src/components/modules/CertificationClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'PAYS_CODES[declaration.filature_pays' in line:
        lines[i] = line.replace(
            "PAYS_CODES[declaration.filature_pays ?? ''] ?? 'XX'",
            "PAYS_CODES[(declaration as any).entreprise?.pays ?? ''] ?? 'XX'"
        )

with open('src/components/modules/CertificationClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
