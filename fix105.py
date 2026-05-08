with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'volume' in line.lower() and i > 310 and i < 370:
        print(str(i+1) + ': ' + line.strip())
