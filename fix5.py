with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixes = {
    252: "                            }}>{fait ? '\u2713' : i + 1}</div>\n",
    350: "                      }}>\u2713 Ajouter</button>\n",
    438: "                                }}>{cq.conforme ? '\u2713 Conforme' : '\u2715 Non conforme'}</span>\n",
}

for line_num, new_line in fixes.items():
    lines[line_num] = new_line

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
