with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Ajouter logo avant le titre dans le header
content = content.replace(
    "<div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>ETHYS - TRA",
    """<img src="/logo_ethys.png" alt="ETHYS" style={{ width: 40, height: 'auto', marginBottom: 16, filter: 'invert(1)' }} />
            <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>ETHYS - TRA"""
)

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
