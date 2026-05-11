with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    """<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1 }}>ETHYS - TRACABILITE</div>
            <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 55, height: 'auto', filter: 'invert(1)' }} />
          </div>""",
    """<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1 }}>ETHYS \u2014 TRA\u00c7ABILIT\u00c9</div>
            <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 70, height: 'auto', filter: 'invert(1)' }} />
          </div>"""
)

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
