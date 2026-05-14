path = 'src/app/(auth)/forgot-password/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('<img src="/logo_ethys.png" alt="ETHYS"', '<a href="/login"><img src="/logo_ethys.png" alt="ETHYS"')
content = content.replace("display: 'block', cursor: 'pointer' } />", "display: 'block', cursor: 'pointer' } /></a>")
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
