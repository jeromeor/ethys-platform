with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Deplacer le logo en haut a droite et agrandir
content = content.replace(
    """<img src="/logo_ethys.png" alt="ETHYS" style={{ width: 40, height: 'auto', marginBottom: 16, filter: 'invert(1)' }} />
            <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>ETHYS - TRA""",
    "<div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>ETHYS - TRA"
)

# Ajouter logo dans le header en flex justify-between
content = content.replace(
    "<div style={{ maxWidth: 480, margin: '0 auto' }}>",
    """<div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1 }}>ETHYS - TRACABILITE</div>
            <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 55, height: 'auto', filter: 'invert(1)' }} />
          </div>"""
)

# Supprimer l ancien label ETHYS TRACABILITE qui sera duplique
content = content.replace(
    """          <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>ETHYS - TRA\u00c7ABILIT\u00c9 TOTALE</div>""",
    ""
)

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
