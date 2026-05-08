with open('src/components/modules/CommandesClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'reference' in line.lower() and 'td' in line and i > 200 and i < 280:
        print(str(i+1) + ': ' + line.strip())
