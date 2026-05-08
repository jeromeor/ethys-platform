with open("src/components/layout/NotificationBell.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if any(x in line for x in ["notif", "Notif", "marquer", "Marquer", "lire", "Lire"]):
        print(str(i+1) + ": " + line.strip())
