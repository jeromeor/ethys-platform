with open('src/components/modules/CertificationClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[152] = "        filature_nom: form.filature_nom || null,\n        filature_pays: form.filature_pays || null,\n"

with open('src/components/modules/CertificationClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
