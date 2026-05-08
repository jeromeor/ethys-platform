with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[334] = "                <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Volume (kg)</label>\n"

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
