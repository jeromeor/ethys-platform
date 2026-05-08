with open('src/components/modules/CommandesClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[239] = "                        <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#0A3D26', whiteSpace: 'nowrap' }}>{c.reference}</td>\n"
lines[240] = "                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#475569' }}>{c.marque?.nom ?? '-'}</td>\n"
lines[241] = "                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#475569' }}>{c.filature?.nom ?? '-'}</td>\n"

with open('src/components/modules/CommandesClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
