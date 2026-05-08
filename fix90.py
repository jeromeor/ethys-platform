with open('src/app/(auth)/en-attente/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "<img src=\"/logo.png\" alt=\"TEXTILE LOOP\" style={{ width: 140, height: 'auto', margin: '0 auto 32px', display: 'block' }} />",
    """<img src="/logo.png" alt="TEXTILE LOOP" style={{ width: 140, height: 'auto', margin: '0 auto 12px', display: 'block' }} />
        <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 32, textAlign: 'center' }}>Plateforme ETHYS</div>"""
)

content = content.replace(
    "<button onClick={handleLogout} style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #EEF0F3', background: '#F8FAFC', color: '#64748B', fontSize: 12, cursor: 'pointer' }}>\n          Se déconnecter\n        </button>",
    """<div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => router.push('/dashboard')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Retour au dashboard
            </button>
            <button onClick={handleLogout} style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #EEF0F3', background: '#F8FAFC', color: '#64748B', fontSize: 12, cursor: 'pointer' }}>
              Se déconnecter
            </button>
          </div>"""
)

with open('src/app/(auth)/en-attente/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
