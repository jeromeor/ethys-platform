with open('src/components/modules/CertificationClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'declaration.entreprise_pays' in line:
        lines[i] = line.replace('declaration.entreprise_pays', '(declaration as any).entreprise?.pays')

with open('src/components/modules/CertificationClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
