with open("src/components/modules/AdminClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "Demandes en attente" in line and "activeTab" in line:
        print(str(i+1) + ": " + line.strip())
