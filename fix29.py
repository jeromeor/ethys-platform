with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[146] = "              ['R\u00e9f\u00e9rence lot', selected.reference],\n"
lines[62] = "    const urlPublique = `${window.location.origin}/tracabilite/${reference}`\n"

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
