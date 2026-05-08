with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Trouver la fonction de mise a jour du slider
for i, line in enumerate(lines):
    if '.update({ avancement_pct: pct })' in line:
        print(str(i+1) + ': ' + line.strip())
