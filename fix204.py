with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("src='/logo_ethys.jpg'", "src='/logo_ethys.png'")
content = content.replace('src="/logo_ethys.jpg"', 'src="/logo_ethys.png"')

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done sidebar")

with open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("src='/logo_ethys.jpg'", "src='/logo_ethys.png'")
content = content.replace('src="/logo_ethys.jpg"', 'src="/logo_ethys.png"')

with open('src/app/(auth)/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done login")
