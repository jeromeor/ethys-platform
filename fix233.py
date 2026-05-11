with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer le layout du header lot
old_lot = """<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 9, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>ETHYS \u2014 TRA\u00c7ABILIT\u00c9</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 2 }}>Votre fil ETHYS</div>
            </div>
            <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 100, height: 'auto', filter: 'invert(1)', flexShrink: 0 }} />
          </div>"""

new_lot = """<div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 110, height: 'auto', filter: 'invert(1)', margin: '0 auto 12px', display: 'block' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>ETHYS \u2014 TRA\u00c7ABILIT\u00c9</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 2 }}>Votre fil ETHYS</div>
          </div>"""

content = content.replace(old_lot, new_lot)

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
