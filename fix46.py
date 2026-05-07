with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

cert_panel = """
      {selectedCert && !selected && (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0A3D26', marginBottom: 4 }}>
                  {selectedCert.declaration?.type_produit === 'fil' ? 'Fil ETHYS' : selectedCert.declaration?.type_produit === 'tissu' ? 'Tissu ETHYS' : 'Produit fini ETHYS'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>{selectedCert.numero}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                  Valid\u00e9 jusqu'au {new Date(selectedCert.date_validite).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#D1FAE5', color: '#065F46' }}>\u2713 Certifi\u00e9</span>
            </div>

            <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0A3D26', marginBottom: 10, textTransform: 'uppercase' }}>Composition</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: selectedCert.declaration?.pct_recycle ?? 51, background: '#10B981', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{selectedCert.declaration?.pct_recycle ?? 0}%</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>\u267b Recycl\u00e9</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{(selectedCert.declaration?.volume_recycle_kg ?? 0).toLocaleString('fr-FR')} kg</div>
                </div>
                <div style={{ flex: 100 - (selectedCert.declaration?.pct_recycle ?? 51), background: '#E2E8F0', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#475569' }}>{100 - (selectedCert.declaration?.pct_recycle ?? 0)}%</div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>\U0001f33f Vierge</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{(selectedCert.declaration?.volume_vierge_kg ?? 0).toLocaleString('fr-FR')} kg</div>
                </div>
              </div>
            </div>

            {[
              ['Entreprise', selectedCert.declaration?.entreprise?.nom ?? '-'],
              ['Filature', selectedCert.declaration?.filature_nom ?? '-'],
              ['Pays filature', selectedCert.declaration?.filature_pays ?? '-'],
              ['Provenance coton', selectedCert.declaration?.provenance_pays ?? '-'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 12, color: '#94A3B8', width: 130, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{val}</span>
              </div>
            ))}

            <div style={{ marginTop: 20 }}>
              {selectedCert.qr_codes?.length > 0 ? (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: '#D1FAE5', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>\u2713 QR Code actif</div>
                  <div style={{ fontSize: 11, color: '#065F46', marginTop: 4 }}>{selectedCert.qr_codes[0].reference}</div>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    const { createClient } = await import('@/lib/supabase/client')
                    const sb = createClient()
                    const reference = `ETHYS-CERT-${selectedCert.numero.replace(/\//g, '-')}`
                    const urlPublique = `${window.location.origin}/tracabilite/${reference}`
                    const { data } = await sb.from('qr_codes').insert({
                      certification_id: selectedCert.id,
                      reference,
                      url_publique: urlPublique,
                      data_encodee: {
                        certification_id: selectedCert.id,
                        numero: selectedCert.numero,
                        type_produit: selectedCert.declaration?.type_produit,
                        entreprise: selectedCert.declaration?.entreprise?.nom,
                        filature: selectedCert.declaration?.filature_nom,
                        pct_recycle: selectedCert.declaration?.pct_recycle,
                        volume_recycle_kg: selectedCert.declaration?.volume_recycle_kg,
                        volume_vierge_kg: selectedCert.declaration?.volume_vierge_kg,
                      },
                      actif: true,
                      nb_scans: 0,
                    }).select().single()
                    if (data) window.location.reload()
                  }}
                  style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  G\u00e9n\u00e9rer le QR Code consommateur
                </button>
              )}
            </div>
          </div>
        </div>
      )}
"""

content = content.replace(
    "    </div>\n  )\n}",
    cert_panel + "    </div>\n  )\n}"
)

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
