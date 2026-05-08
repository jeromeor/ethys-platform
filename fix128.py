with open("src/components/modules/CommandesClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("type_coton: 'mixte'", "type_coton: 'mixte'")

with open("src/components/modules/CommandesClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
