with open('src/components/modules/CommandesClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("R\u00e9f\u00e9rence:", "reference:")
content = content.replace("R\u00e9f\u00e9rence':", "reference':")
content = content.replace("c.R\u00e9f\u00e9rence", "c.reference")
content = content.replace("selected.R\u00e9f\u00e9rence", "selected.reference")

with open('src/components/modules/CommandesClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
