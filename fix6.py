with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\u25cf', '\u2022')
content = content.replace('\u25cf haute', '\u25cf haute')

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/modules/CommandesClient.tsx', 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace('\u25cf', '\u2022')

with open('src/components/modules/CommandesClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content2)

print('Done')
