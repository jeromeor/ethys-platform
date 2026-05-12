with open('src/components/modules/QRCodeClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("background: '#2d5016'", "background: '#8b7355'")
content = content.replace("background: '#10B981'", "background: '#8b7355'")
content = content.replace("background: '#0A3D26'", "background: '#1a1a1a'")
content = content.replace("color: '#0A3D26'", "color: '#1a1a1a'")
content = content.replace("color: '#065F46'", "color: '#2d5016'")
content = content.replace("background: '#D1FAE5'", "background: '#f0f4ec'")
content = content.replace("'v Fil Certifi", "'\u2713 Fil Certifi")
content = content.replace('"v Fil Certifi', '"\u2713 Fil Certifi')

with open('src/components/modules/QRCodeClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
