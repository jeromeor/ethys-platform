with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[132] = "                <div style={{ fontSize: 11, color: '#94A3B8' }}>{lot.volume_tonnes}T \u00b7 {lot.type_coton === 'recycle' ? 'Recycl\u00e9' : 'Vierge'}</div>\n"
lines[151] = "              ['Type coton', selected.type_coton === 'recycle' ? 'Recycl\u00e9' : 'Vierge'],\n"
lines[196] = "              ['Type coton', selected.type_coton === 'recycle' ? 'Recycl\u00e9' : 'Vierge'],\n"
lines[271] = "                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Coton recycl\u00e9</div>\n"
lines[289] = "              Ce fil est le r\u00e9sultat de la transformation de coton recycl\u00e9 et vierge par {selected.commande?.filature?.nom ?? 'la filature'}, certifi\u00e9 par la plateforme TEXTILE LOOP.\n"

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
