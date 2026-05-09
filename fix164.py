with open("src/components/modules/FacturationClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "  payee:      'Pay\u00e9es',",
    "  payee:      'Pay\u00e9e',"
)

with open("src/components/modules/FacturationClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
