with open('src/components/modules/CommandesClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if '<td' in line and i > 220 and i < 290:
        print(str(i+1) + ': ' + line.strip())
