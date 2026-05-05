with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixes = {
    252: "                            }}>{fait ? 'v' : i + 1}</div>\n",
    341: '                          <option value="">-</option>\n',
    350: '                      }}>v Ajouter</button>\n',
    366: "                    Aucun lot - ajoutez-en un depuis l'onglet Avancement\n",
    438: "                                }}>{cq.conforme ? 'v Conforme' : 'x Non conforme'}</span>\n",
}

for line_num, new_line in fixes.items():
    lines[line_num] = new_line

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
