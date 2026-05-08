with open("src/components/modules/AdminClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remplacer le select avec action immediate par un select + bouton confirmer
old = """<select onChange={async (e) => {
                        if (!e.target.value) return
                        const { createClient } = await import('@/lib/supabase/client')
                        const sb = createClient()
                        await sb.from('profils_utilisateurs').update({ entreprise_id: e.target.value }).eq('id', u.id)
                        window.location.reload()
                      }} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none' }}>
                        <option value="">S\u00e9lectionner une entreprise...</option>
                        {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom} ({e.type})</option>)}
                      </select>"""

new = """<div style={{ display: 'flex', gap: 8 }}>
                      <select id={`select-${u.id}`} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none' }}>
                        <option value="">S\u00e9lectionner une entreprise...</option>
                        {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom} ({e.type})</option>)}
                      </select>
                      <button onClick={async () => {
                        const sel = document.getElementById(`select-${u.id}`) as HTMLSelectElement
                        if (!sel?.value) return
                        const entreprise = entreprises.find(e => e.id === sel.value)
                        if (!window.confirm(`Confirmer l'association de ${u.email} avec ${entreprise?.nom} ?`)) return
                        const { createClient } = await import('@/lib/supabase/client')
                        const sb = createClient()
                        await sb.from('profils_utilisateurs').update({ entreprise_id: sel.value }).eq('id', u.id)
                        window.location.reload()
                      }} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                        Valider
                      </button>
                    </div>"""

content = content.replace(old, new)

with open("src/components/modules/AdminClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
