with open("src/components/modules/FacturationClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Ajouter le calcul du prix apres la reference commande (ligne 333, index 332)
prix_block = """                  {/* Decomposition prix - visible admin et marque uniquement */}
                  {(isAdmin || accords.some(a => a.entreprise_id === selected.destinataire_id)) && (() => {
                    const accord = accords.find(a => a.entreprise_id === selected.destinataire_id)
                    const vol = selected.commande?.volume_total_tonnes ?? 0
                    const prixBase = accord ? accord.prix_base_kg : 0.60
                    const remisePalier = vol >= 10 ? 2 : vol >= 5 ? 1 : 0
                    const remiseAnnuelle = accord?.remise_volume_annuel_pct ?? 0
                    const prixFinal = prixBase * (1 - remisePalier/100) * (1 - remiseAnnuelle/100)
                    return (
                      <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #A7F3D0' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#065F46', marginBottom: 8, textTransform: 'uppercase' }}>
                          {accord ? '\u2605 Prix accord commercial' : 'D\u00e9composition du prix'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          <div style={{ fontSize: 11, color: '#475569' }}>Prix de base</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#0A3D26', textAlign: 'right' }}>{prixBase.toFixed(4)}\u20ac/kg</div>
                          {remisePalier > 0 && <>
                            <div style={{ fontSize: 11, color: '#475569' }}>Remise volume commande</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#065F46', textAlign: 'right' }}>-{remisePalier}%</div>
                          </>}
                          {remiseAnnuelle > 0 && <>
                            <div style={{ fontSize: 11, color: '#475569' }}>Remise volume annuel</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#065F46', textAlign: 'right' }}>-{remiseAnnuelle}%</div>
                          </>}
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0A3D26', borderTop: '1px solid #A7F3D0', paddingTop: 6 }}>Prix applicable</div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#0A3D26', textAlign: 'right', borderTop: '1px solid #A7F3D0', paddingTop: 6 }}>{prixFinal.toFixed(4)}\u20ac/kg</div>
                        </div>
                        {accord?.notes && <div style={{ fontSize: 10, color: '#64748B', marginTop: 8, fontStyle: 'italic' }}>{accord.notes}</div>}
                      </div>
                    )
                  })()}
"""

lines.insert(333, prix_block)

with open("src/components/modules/FacturationClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
