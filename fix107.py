with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'volume_tonnes' in line and 'newLot' in line and 'parseFloat' in line:
        print(str(i+1) + ': ' + line.strip())
