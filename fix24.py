with open('src/components/modules/ReportingClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[148] = '                <YAxis tick={{ fontSize: 11, fill: \'#94A3B8\' }} axisLine={false} tickLine={false} tickFormatter={v => `${Math.round(v * 1000 / 1000)} k`} />\n'

with open('src/components/modules/ReportingClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
