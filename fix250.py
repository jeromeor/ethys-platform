with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[260] = "                            }}>{fait ? 'v' : i + 1}</div>\n"

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
