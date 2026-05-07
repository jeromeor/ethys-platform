with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Ajouter le state showUserMenu apres open
for i, line in enumerate(lines):
    if 'const [open, setOpen] = useState(true)' in line:
        lines[i] = line + "  const [showUserMenu, setShowUserMenu] = useState(false)\n"

# Remplacer le header (ligne 102 = index 101)
lines[101] = """          <div style={{ fontSize: 12, color: '#94A3B8', position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 10, border: '1.5px solid #EEF0F3', background: '#F8FAFC', cursor: 'pointer' }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0A3D26', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {initiales}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{nomEntreprise}</div>
                <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'capitalize' }}>{profil?.role ?? 'utilisateur'}</div>
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginLeft: 4 }}>\u25bc</div>
            </button>
            {showUserMenu && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', borderRadius: 12, border: '1px solid #EEF0F3', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', minWidth: 200, zIndex: 100, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{nomEntreprise}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{user?.email}</div>
                </div>
                <button onClick={() => { setShowUserMenu(false); router.push('/profil') }} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: 12, color: '#475569', cursor: 'pointer' }}>
                  Mon profil
                </button>
                <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: 12, color: '#DC2626', cursor: 'pointer', borderTop: '1px solid #F1F5F9' }}>
                  D\u00e9connexion
                </button>
              </div>
            )}
          </div>
"""

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
