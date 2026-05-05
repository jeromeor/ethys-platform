with open('src/components/modules/ESGClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[50] = "    { axe: 'Conformit\u00e9', score: scores.conformite },\n"
lines[100] = "          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>Calcul\u00e9 en temps r\u00e9el depuis vos donn\u00e9es</div>\n"
lines[109] = "          {[[pctRecycleGlobal + '%', 'Recycl\u00e9'], [(Math.round(volumeRecycle * 1000)).toLocaleString('fr-FR') + ' kg', 'Vol. recycl\u00e9'], [String(certsValides), 'Certifications'], ['100%', 'Conformit\u00e9']].map(([v, l]) => (\n"
lines[178] = "                { label: 'Partenaires v\u00e9rifi\u00e9s', val: '6/7', ok: false },\n"
lines[179] = "                { label: 'Pays \u00e0 risque', val: '0', ok: true },\n"
lines[183] = "                { label: 'Conformit\u00e9 RGPD', val: '100%', ok: true },\n"
lines[219] = "              G\u00e9n\u00e9rez votre rapport pour le t\u00e9l\u00e9charger\n"

with open('src/components/modules/ESGClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
