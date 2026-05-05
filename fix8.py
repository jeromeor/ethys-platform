with open('src/components/modules/CommandesClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Corriger le diamant corrompu
content = content.replace('\u00e2\u2014\u02c6', '\u25c8')
content = content.replace('\u00e2\u25cb\u02c6', '\u25c8')

# Corriger les labels de filtre
content = content.replace("'Soumise'", "'soumise'")
content = content.replace('"Soumise"', '"Soumise"')
content = content.replace("value: 'Soumises'", "value: 'Soumise'")
content = content.replace("label: 'Livrees'", "label: 'Livree'")
content = content.replace("label: 'Livrées'", "label: 'Livrée'")

with open('src/components/modules/CommandesClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
