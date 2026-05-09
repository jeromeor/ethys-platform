with open("src/components/modules/FacturationClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Inserer l onglet accords avant la div Table (ligne 269, index 268)
accords_tab = """      {/* Onglet Accords commerciaux */}
      {activeTab === 'accords' && isAdmin && (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0A3D26' }}>Accords commerciaux</div>
            <button onClick={() => setShowAccordForm(true)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nouvel accord</button>
          </div>
          {accords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8', fontSize: 13 }}>Aucun accord commercial. Cliquez sur "+ Nouvel accord" pour en cr\u00e9er un.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {accords.map(a => (
                <div key={a.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #EEF0F3', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>{a.entreprise?.nom ?? '-'}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                        Du {new Date(a.date_debut).toLocaleDateString('fr-FR')} 
                        {a.date_fin ? ` au ${new Date(a.date_fin).toLocaleDateString('fr-FR')}` : ' (illimit\u00e9)'}
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#D1FAE5', color: '#065F46' }}>Actif</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F0FDF4' }}>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>Prix n\u00e9goci\u00e9/kg</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0A3D26' }}>{Number(a.prix_base_kg).toFixed(4)}\u20ac</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>Base: 0.60\u20ac</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#FEF3C7' }}>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>Remise volume annuel</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#92400E' }}>{a.remise_volume_annuel_pct}%</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>D\u00e8s {a.seuil_volume_annuel_tonnes}T/an</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F8FAFC' }}>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>Remise palier commande</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>1% \u2265 5T · 2% \u2265 10T</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>Standard ETHYS</div>
                    </div>
                  </div>
                  {a.notes && <div style={{ fontSize: 11, color: '#64748B', marginTop: 10, fontStyle: 'italic', padding: '8px 10px', borderRadius: 6, background: '#F8FAFC' }}>{a.notes}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Modal nouvel accord */}
          {showAccordForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowAccordForm(false)}>
              <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0A3D26' }}>Nouvel accord commercial</span>
                  <button onClick={() => setShowAccordForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#94A3B8' }}>x</button>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Marque *</label>
                  <select value={accordForm.entreprise_id} onChange={e => setAccordForm(f => ({ ...f, entreprise_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none' }}>
                    <option value="">S\u00e9lectionner une marque...</option>
                    {entreprises.filter(e => e.type === 'marque').map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Prix n\u00e9goci\u00e9 (€/kg) *</label>
                    <input type="number" step="0.0001" value={accordForm.prix_base_kg} onChange={e => setAccordForm(f => ({ ...f, prix_base_kg: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Remise annuelle (%)</label>
                    <input type="number" step="0.01" value={accordForm.remise_volume_annuel_pct} onChange={e => setAccordForm(f => ({ ...f, remise_volume_annuel_pct: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Seuil volume annuel (T)</label>
                    <input type="number" value={accordForm.seuil_volume_annuel_tonnes} onChange={e => setAccordForm(f => ({ ...f, seuil_volume_annuel_tonnes: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Date fin (optionnel)</label>
                    <input type="date" value={accordForm.date_fin} onChange={e => setAccordForm(f => ({ ...f, date_fin: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Notes (optionnel)</label>
                  <textarea value={accordForm.notes} onChange={e => setAccordForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none', resize: 'none', boxSizing: 'border-box' as const }} />
                </div>
                <button onClick={async () => {
                  if (!accordForm.entreprise_id || !accordForm.prix_base_kg) return
                  const { data, error } = await supabase.from('accords_commerciaux').insert({
                    entreprise_id: accordForm.entreprise_id,
                    prix_base_kg: parseFloat(accordForm.prix_base_kg),
                    remise_volume_annuel_pct: parseFloat(accordForm.remise_volume_annuel_pct) || 0,
                    seuil_volume_annuel_tonnes: parseFloat(accordForm.seuil_volume_annuel_tonnes) || 0,
                    date_debut: new Date().toISOString().split('T')[0],
                    date_fin: accordForm.date_fin || null,
                    notes: accordForm.notes || null,
                    created_by: user.id
                  }).select('*, entreprise:entreprises(nom)').single()
                  if (!error && data) {
                    setAccords(prev => [data as AccordCommercial, ...prev])
                    setShowAccordForm(false)
                  }
                }} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Enregistrer l'accord
                </button>
              </div>
            </div>
          )}
        </div>
      )}

"""

lines.insert(268, accords_tab)

with open("src/components/modules/FacturationClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
