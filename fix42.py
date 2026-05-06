with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[82] = "  const genererQR = async () => {\n"
lines[82] = "  const genererQR = async () => {\n    if (!selected) return\n    setGenerating(true)\n    const reference = `ETHYS-QR-${selected.commande?.reference ?? 'CMD'}-${selected.reference.split('-').pop()}`\n    const { data: existing } = await supabase.from('qr_codes').select('*').eq('reference', reference).single()\n    if (existing) {\n      const updatedLot = { ...selected, qr_codes: [existing as QRCodeData] }\n      setLots(prev => prev.map(l => l.id === selected.id ? updatedLot : l))\n      setSelected(updatedLot)\n      setGenerating(false)\n      return\n    }\n"

lines[264] = "                <button onClick={genererQR} disabled={generating} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: generating ? '#E2E8F0' : '#0A3D26', color: generating ? '#94A3B8' : '#fff', fontSize: 13, fontWeight: 700, cursor: generating ? 'default' : 'pointer' }}>\n"

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
