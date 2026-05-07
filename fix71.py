with open('src/components/modules/AdminClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[163] = "      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '6px 22px', flexShrink: 0 }}>\n"
lines[170] = "          <div key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #EEF0F3', padding: '8px 12px' }}>\n"
lines[171] = "            <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>{k.label}</div>\n"
lines[172] = "            <div style={{ fontSize: 16, fontWeight: 800, color: '#0A3D26' }}>{k.value}</div>\n"

with open('src/components/modules/AdminClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
