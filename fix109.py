with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "lot.type_coton === 'recycle' ? 'Recycl\u00e9' : 'Vierge'",
    "'Fil ETHYS'"
)
content = content.replace(
    "lot.type_coton === 'recycle' ? '\u267b recycl\u00e9' : '\U0001f33f Vierge'",
    "'Fil ETHYS'"
)
content = content.replace(
    "lot.type_coton === 'recycle' ? '\u267b' : '\U0001f33f'",
    "'\U0001f3c6'"
)
content = content.replace(
    "'\u267b recyclé'",
    "'Fil ETHYS'"
)
content = content.replace(
    "'\u267b Recycl\u00e9'",
    "'Fil ETHYS'"
)

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
