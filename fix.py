import os
path = "src/components/layout/NotificationBell.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace(".eq('user_id', userId)", ".eq('utilisateur_id', userId)")
content = content.replace("filter: `user_id=eq.${userId}`", "filter: `utilisateur_id=eq.${userId}`")
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
