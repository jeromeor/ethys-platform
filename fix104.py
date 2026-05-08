with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[321] = "          }}>+ Ajouter un lot</button>\n"
lines[330] = "                <option value='recycle'>Fil ETHYS (recycl\u00e9)</option>\n"
lines[331] = ""  # Supprimer option Vierge

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
