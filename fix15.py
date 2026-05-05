with open('src/components/modules/ReportingClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[45] = "const TABS = ['Vue globale', 'Volumes', 'Finances', 'Partenaires']\n"
lines[106] = "          { label: '% Coton recycl\u00e9', value: `${pctRecycleGlobal}%`, delta: `${Math.round(totalRecycle * 1000).toLocaleString('fr-FR')} kg recycl\u00e9es` },\n"
lines[181] = "                <div style={{ fontSize: 18, fontWeight: 900, color: '#6EE7B7' }}>{Math.round(totalRecycle * 1000).toLocaleString('fr-FR')} kg</div>\n"
lines[182] = "                <div style={{ fontSize: 10, opacity: 0.7 }}>\u267b recycl\u00e9es</div>\n"
lines[209] = "                      {['Statut', 'Nb commandes', 'Volume total', '% recycl\u00e9 moy.'].map(h => (\n"
lines[254] = "              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>Recycl\u00e9 vs Vierge</div>\n"
lines[259] = "                    { name: '\u267b Recycl\u00e9es', value: Math.round(totalRecycle * 1000) },\n"
lines[289] = "{/* Finances */}\n"
lines[290] = "{activeTab === 'Finances' && (\n"

with open('src/components/modules/ReportingClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
