with open("src/components/modules/CommandesClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Corriger les validations
content = content.replace("form.type_coton === 'recycl\u00e9'", "form.type_coton === 'recycle'")
content = content.replace("form.type_coton === 'recycl\u00e9' &&", "form.type_coton === 'recycle' &&")
content = content.replace("form.type_coton !== 'recycl\u00e9'", "form.type_coton !== 'recycle'")
content = content.replace("type_coton: 'mixte', volume_recycl\u00e9_tonnes:", "type_coton: 'mixte', volume_recycle_tonnes:")
content = content.replace("volume_recycl\u00e9_tonnes", "volume_recycle_tonnes")

with open("src/components/modules/CommandesClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
