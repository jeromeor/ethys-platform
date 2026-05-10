with open("src/components/modules/QRCodeClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "setCopied(true)\n                        setTimeout(() => setCopied(false), 2000)",
    "setUrlCopied(true)\n                        setTimeout(() => setUrlCopied(false), 2000)"
)
content = content.replace(
    "{copied ? 'Copiée !' : 'Copier URL'}",
    "{urlCopied ? 'Copiée !' : 'Copier URL'}"
)

with open("src/components/modules/QRCodeClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
