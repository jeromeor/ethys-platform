with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "MATIERES" in line or "MATIÈRES" in line:
        print(str(i+1) + ": " + line.strip())
