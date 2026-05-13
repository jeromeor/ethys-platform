with open('src/app/(auth)/reset-password/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "  } : !ready ? (\n            <div style={{ textAlign: 'center', padding: '20px', color: '#8b7355', fontSize: 13 }}>\n              Chargement...\n            </div>",
    """  } : !ready ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ color: '#8b3a3a', fontSize: 13, marginBottom: 16 }}>
                Le lien de r\u00e9initialisation a expir\u00e9 ou est invalide.
              </div>
              <a href="/forgot-password" style={{ display: 'inline-block', padding: '10px 20px', background: '#1a1a1a', color: '#fff', borderRadius: 4, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Demander un nouveau lien
              </a>
            </div>"""
)

with open('src/app/(auth)/reset-password/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
