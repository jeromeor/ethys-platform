with open("src/components/modules/AdminClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_tab = """        {activeTab === 'Comptes \u00e0 valider' && (
          <div>
            {utilisateurs.filter(u => !u.entreprise_id && u.role !== 'admin').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>\u2713</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun compte en attente</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Tous les comptes sont valid\u00e9s.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {utilisateurs.filter(u => !u.entreprise_id && u.role !== 'admin').map((u, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 14, border: '2px solid #FCD34D', padding: '18px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>{u.email}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>R\u00f4le : {u.role} · Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: '#FEF3C7', color: '#92400E' }}>\u23f3 En attente</span>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Associer \u00e0 une entreprise :</div>
                      <select onChange={async (e) => {
                        if (!e.target.value) return
                        const { createClient } = await import('@/lib/supabase/client')
                        const sb = createClient()
                        await sb.from('profils_utilisateurs').update({ entreprise_id: e.target.value }).eq('id', u.id)
                        window.location.reload()
                      }} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none' }}>
                        <option value="">S\u00e9lectionner une entreprise...</option>
                        {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom} ({e.type})</option>)}
                      </select>
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>
                      L'association sera imm\u00e9diate. Le compte aura acc\u00e8s complet apr\u00e8s validation.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
\n"""

lines.insert(272, new_tab)

with open("src/components/modules/AdminClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
