with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\u00e2\u009c\u0094', 'v')
content = content.replace('\u00e2\u0080\u0094', '-')
content = content.replace('\u00e2\u00ac\u00a1', 'section')
content = content.replace('\u00e2\u009c\u0095', 'x')

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
