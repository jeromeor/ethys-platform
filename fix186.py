with open("src/components/modules/QRCodeClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Remplacer le bloc QR actif pour ajouter les boutons
lines[429] = """              {selectedCert.qr_codes?.length > 0 ? (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: '#D1FAE5', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>\u2713 QR Code actif</div>
                  <div style={{ fontSize: 11, color: '#065F46', marginTop: 4 }}>{selectedCert.qr_codes[0].reference}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => window.open(selectedCert.qr_codes[0].url_publique, '_blank')}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Voir page publique
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCert.qr_codes[0].url_publique)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid #0A3D26', background: '#fff', color: '#0A3D26', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {copied ? 'Copiée !' : 'Copier URL'}
                    </button>
                  </div>
                </div>
"""
del lines[430]
del lines[430]
del lines[430]

with open("src/components/modules/QRCodeClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
