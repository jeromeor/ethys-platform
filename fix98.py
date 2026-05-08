with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'slider' in line.lower() or 'range' in line.lower() or 'avancement_pct' in line.lower():
        print(str(i+1) + ': ' + line.strip())
