with open('src/components/modules/ReportingClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[63] = "      map[mois].volume += (c.volume_total_tonnes ?? 0)\n"

with open('src/components/modules/ReportingClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
