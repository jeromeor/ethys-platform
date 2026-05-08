with open("src/components/modules/CommandesClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "recycle" in line.lower() and "option" in line.lower() and i > 390 and i < 460:
        print(str(i+1) + ": " + line.strip())
