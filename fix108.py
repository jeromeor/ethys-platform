with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[124] = "        volume_tonnes: parseFloat(newLot.volume_tonnes) / 1000,\n"

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
