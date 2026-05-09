with open("src/components/modules/CommandesClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("\u00e2\u009c\u0095", "\u2713")
content = content.replace("â\u009c\u0095", "\u2713")

with open("src/components/modules/CommandesClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
