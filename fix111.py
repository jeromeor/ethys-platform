with open('src/components/modules/MessagerieClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'chargerMessages' in line or 'from messages' in line.lower() or '.from(' in line:
        print(str(i+1) + ': ' + line.strip())
