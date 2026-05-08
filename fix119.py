with open("src/components/modules/MessagerieClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i in range(91, 102):
    print(str(i+1) + ": " + lines[i].rstrip())
