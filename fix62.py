with open('src/proxy.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'export async function middleware(',
    'export async function proxy('
)

with open('src/proxy.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
