with open('src/app/(auth)/register/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'",
    "minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0'"
)

with open('src/app/(auth)/register/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
