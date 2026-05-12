with open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Supprimer le premier lien logo (panneau gauche display:none) et garder le second
# Le premier est dans le panneau decoratif qui est display:none
content = content.replace(
    '<a href="/login"><img src="/logo_ethys.png" alt="ETHYS" style={{ width: 80,  }} /></a>',
    '<img src="/logo_ethys.png" alt="ETHYS" style={{ width: 80 }} />'
)

with open('src/app/(auth)/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
