with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Verifier les lignes 40-46
for i in range(38, 48):
    print(str(i+1) + ': ' + repr(lines[i].rstrip()))
