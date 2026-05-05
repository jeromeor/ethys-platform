with open('src/components/modules/FacturationClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'emise': 'Emise'", "'emise': 'Emises'")
content = content.replace("'en_attente': 'En attente'", "'en_attente': 'En attente'")
content = content.replace("'payee': 'Payee'", "'payee': 'Payees'")
content = content.replace("'en_retard': 'En retard'", "'en_retard': 'En retard'")
content = content.replace("s === 'emise' ? 'Emise'", "s === 'emise' ? 'Emises'")
content = content.replace("s === 'payee' ? 'Payee'", "s === 'payee' ? 'Payees'")

with open('src/components/modules/FacturationClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
