with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'const sb = supabase' in line and i > 430:
        # Remplacer tout le bloc d insertion par un fetch vers l API
        lines[i] = """                    const reference = `ETHYS-CERT-${selectedCert.numero.replace(/\\//g, '-')}`
                    const res = await fetch('/api/qr-certification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        certification_id: selectedCert.id,
                        numero: selectedCert.numero,
                        data_encodee: {
                          certification_id: selectedCert.id,
                          numero: selectedCert.numero,
                          type_produit: selectedCert.declaration?.type_produit,
                          entreprise: selectedCert.declaration?.entreprise?.nom,
                          filature: selectedCert.declaration?.filature_nom,
                          pct_recycle: selectedCert.declaration?.pct_recycle,
                          volume_recycle_kg: selectedCert.declaration?.volume_recycle_kg,
                          volume_vierge_kg: selectedCert.declaration?.volume_vierge_kg,
                        }
                      })
                    })
                    const result = await res.json()
                    console.log('API result:', result)
                    if (result.data) window.location.reload()
                    else console.error('Error:', result.error)
"""
    if 'const reference = `ETHYS-CERT-' in line and i > 430:
        lines[i] = ''
    if 'const urlPublique' in line and i > 430:
        lines[i] = ''
    if 'const { data: qrData, error: qrError }' in line and i > 430:
        lines[i] = ''
    if 'certification_id: selectedCert.id,' in line and i > 430:
        lines[i] = ''
    if 'reference,' in line and i > 430 and 'reference`' not in line:
        lines[i] = ''
    if 'url_publique: urlPublique,' in line and i > 430:
        lines[i] = ''
    if 'data_encodee: {' in line and i > 430:
        lines[i] = ''
    if 'numero: selectedCert.numero,' in line and i > 430:
        lines[i] = ''
    if 'type_produit: selectedCert' in line and i > 430:
        lines[i] = ''
    if 'entreprise: selectedCert' in line and i > 430:
        lines[i] = ''
    if 'filature: selectedCert' in line and i > 430:
        lines[i] = ''
    if 'pct_recycle: selectedCert' in line and i > 430:
        lines[i] = ''
    if 'volume_recycle_kg: selectedCert' in line and i > 430:
        lines[i] = ''
    if 'volume_vierge_kg: selectedCert' in line and i > 430:
        lines[i] = ''
    if 'actif: true,' in line and i > 430:
        lines[i] = ''
    if 'nb_scans: 0,' in line and i > 430:
        lines[i] = ''
    if '}).select().single()' in line and i > 430:
        lines[i] = ''
    if "console.log('QR result':" in line:
        lines[i] = ''
    if 'if (qrData) window.location.reload()' in line:
        lines[i] = ''
    if "else console.error('Insert failed':" in line:
        lines[i] = ''

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
