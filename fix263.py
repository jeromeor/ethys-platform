with open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#d4c5b0' }}>",
    "      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#d4c5b0', width: '100%' }}>"
)

with open('src/app/(auth)/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
