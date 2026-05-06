with open('src/components/modules/CertificationClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[175] = """    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const zones = ZONES[declaration.filature_pays ?? ''] ?? [1]
    const zoneCode = String(zones[0]).padStart(3, '0')
    const paysCode = PAYS_CODES[declaration.entreprise_pays ?? ''] ?? 'XX'
    const seq = String(declarations.filter(d => d.statut === 'certifiee').length + 1).padStart(4, '0')
    const numero = `ETHYS-${year}-${month}-${zoneCode}-${paysCode}-${seq}`\n"""

with open('src/components/modules/CertificationClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
