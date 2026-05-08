with open("src/components/modules/AdminClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "TABS" in line and "const" in line:
        print(str(i+1) + ": " + line.strip())
