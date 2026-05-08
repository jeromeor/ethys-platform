with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'controle qualite'", "'contr\u00f4le qualit\u00e9'")
content = content.replace('"controle qualite"', '"contr\u00f4le qualit\u00e9"')

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
