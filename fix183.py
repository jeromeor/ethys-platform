with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'volumeRecycle = lot?.type_coton' in line:
        print(str(i+1) + ': ' + line.rstrip())
    if 'volumeVierge = lot?.type_coton' in line:
        print(str(i+1) + ': ' + line.rstrip())
    if 'pctRecycle = totalVolume' in line:
        print(str(i+1) + ': ' + line.rstrip())
