with open("src/app/(auth)/en-attente/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if any(x in line for x in ["verif", "genér", "creer", "Creer", "deconne", "Deconne", "attente"]):
        print(str(i+1) + ": " + line.strip())
