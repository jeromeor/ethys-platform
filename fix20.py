with open('src/components/modules/ReportingClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[293] = "              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>CA mensuel</div>\n"

with open('src/components/modules/ReportingClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
