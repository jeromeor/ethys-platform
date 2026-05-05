with open('src/components/modules/ReportingClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[63] = "      map[mois].volume += Math.round((c.volume_total_tonnes ?? 0) * 1000)\n"
lines[139] = "                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>Volumes mensuels (milliers de kg)</div>\n"

with open('src/components/modules/ReportingClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
