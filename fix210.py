with open('src/proxy.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],",
    "matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|logo_ethys.png|logo_ethys.jpg).*)'],"
)

with open('src/proxy.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
