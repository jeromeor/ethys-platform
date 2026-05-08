with open("src/app/(dashboard)/messagerie/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "currentUser={{ id: user.id, email: user.email ?? '' }}",
    "currentUser={{ id: user.id, email: user.email ?? '', prenom: profil?.prenom, nom: profil?.nom }}"
)

with open("src/app/(dashboard)/messagerie/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
