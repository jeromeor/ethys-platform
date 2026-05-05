with open('src/components/modules/FacturationClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[63] = "  emise:      '\u00c9mises',\n"
lines[65] = "  payee:      'Pay\u00e9es',\n"

with open('src/components/modules/FacturationClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
