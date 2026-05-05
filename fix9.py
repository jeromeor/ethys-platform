with open('src/components/modules/CommandesClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[319] = "              ['Grammage', selected.grammage ?? '-'],\n"
lines[324] = "                <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{v ?? '-'}</span>\n"
lines[399] = "                  {[['recycle', '\u267b 100% Recycle'], ['mixte', '\u2696 Mixte'], ['vierge', '\U0001f33f 100% Vierge']].map(([v, l]) => (\n"
lines[434] = "                    <option value=\"\">-</option>\n"
lines[479] = "                  {loading ? 'Creation...' : '\u2713 Creer la commande ETHYS'}\n"

with open('src/components/modules/CommandesClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
