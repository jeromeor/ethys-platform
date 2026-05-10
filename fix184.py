with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(122, 132):
    print(str(i+1) + ': ' + lines[i].rstrip())
