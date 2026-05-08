with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'Ajouter' in line or 'recycle' in line.lower() or 'vierge' in line.lower() or 'option' in line.lower():
        if i > 310 and i < 360:
            print(str(i+1) + ': ' + line.strip())
