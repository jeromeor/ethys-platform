with open('src/components/modules/ESGClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[109] = "          {[[pctRecycl\u00e9Global + '%', 'Recycl\u00e9'], [(Math.round(volumeRecycl\u00e9 * 1000)).toLocaleString('fr-FR') + ' kg', 'Vol. recycl\u00e9'], [String(certsValides), 'Certifications'], ['100%', 'Conformit\u00e9']].map(([v, l]) => (\n"

with open('src/components/modules/ESGClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
