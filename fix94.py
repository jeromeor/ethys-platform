with open('src/components/modules/CommandesClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'c.reference' in line or 'commande.reference' in line:
        print(str(i+1) + ': ' + line.strip())
