with open("src/components/modules/QRCodeClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Modifier la modale pour qu elle ne scrolle pas
content = content.replace(
    "background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, maxHeight: '90vh', overflow: 'auto'",
    "background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'"
)

# Reduire les paddings pour tout faire tenir
content = content.replace(
    "background: 'linear-gradient(135deg,#0A3D26,#0D5C3A)', borderRadius: '20px 20px 0 0', padding: '24px'",
    "background: 'linear-gradient(135deg,#0A3D26,#0D5C3A)', borderRadius: '20px 20px 0 0', padding: '16px'"
)

with open("src/components/modules/QRCodeClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
