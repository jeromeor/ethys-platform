with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Reorganiser le header - logo inline avec le titre
content = content.replace(
    """<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1 }}>ETHYS \u2014 TRA\u00c7ABILIT\u00c9</div>
            <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 70, height: 'auto', filter: 'invert(1)' }} />
          </div>""",
    """<div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 52, height: 'auto', filter: 'invert(1)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 9, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>ETHYS \u2014 TRA\u00c7ABILIT\u00c9</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Votre fil ETHYS</div>
            </div>
          </div>"""
)

# Supprimer le titre duplique
content = content.replace(
    '\n            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Votre fil ETHYS</div>',
    ''
)
content = content.replace(
    '\n            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{typeLabel}</div>',
    '\n            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{typeLabel}</div>'
)

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
