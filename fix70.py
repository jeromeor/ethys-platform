with open('src/components/modules/AdminClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[163] = "      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '8px 22px', flexShrink: 0 }}>\n"

for i, line in enumerate(lines):
    if "padding: '14px 18px'" in line and i > 163 and i < 180:
        lines[i] = line.replace("padding: '14px 18px'", "padding: '8px 14px'")
    if "marginBottom: 6" in line and i > 163 and i < 185:
        lines[i] = line.replace("marginBottom: 6", "marginBottom: 2")
    if "fontSize: 22, fontWeight: 800, color: '#0A3D26'" in line and i > 163 and i < 185:
        lines[i] = line.replace("fontSize: 22", "fontSize: 18")

with open('src/components/modules/AdminClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
