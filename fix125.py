with open("src/app/(dashboard)/messagerie/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "utilisateurs={utilisateurs.filter(u => u.id !== user.id)}",
    "utilisateurs={utilisateurs}"
)

with open("src/app/(dashboard)/messagerie/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
