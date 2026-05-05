with open('src/components/modules/ReportingClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[300] = '                  <Bar dataKey="ca" name="CA (\u20ac)" fill="#0A3D26" radius={[6, 6, 0, 0]} />\n'
lines[139] = '                <div style={{ fontSize: 13, fontWeight: 700, color: \'#0A3D26\', marginBottom: 16 }}>Volumes mensuels (kg)</div>\n'

for i, line in enumerate(lines):
    if 'recycl\u00e9es' in line or 'Recycl\u00e9es' in line:
        lines[i] = line.replace('recycl\u00e9es', 'recycl\u00e9s').replace('Recycl\u00e9es', 'Recycl\u00e9s')

with open('src/components/modules/ReportingClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
