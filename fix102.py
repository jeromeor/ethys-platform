with open('src/components/modules/ProductionClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Corriger le caractere corrompu du bouton
content = content.replace('\uff0b Ajouter un lot', '+ Ajouter un lot')
content = content.replace('+ Ajouter un lot', '+ Ajouter un lot')

# Supprimer option Vierge et remplacer recycle par ETHYS dans le formulaire
content = content.replace(
    "<option value='recycle'>\\u267b 100% Recycle</option>",
    "<option value='recycle'>Fil ETHYS (100% recycl\u00e9)</option>"
)
content = content.replace(
    "<option value='vierge'>\\U0001f33f 100% Vierge</option>",
    ""
)

with open('src/components/modules/ProductionClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
