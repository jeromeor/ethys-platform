with open("src/components/modules/CertificationClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "<div style={{ fontSize: 48, marginBottom: 16 }}>\U0001f3c6</div>",
    "<div style={{ fontSize: 48, marginBottom: 16 }}></div>"
)

with open("src/components/modules/CertificationClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
