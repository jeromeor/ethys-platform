with open('src/proxy.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/tracabilite', '/mentions-legales']",
    "const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/tracabilite', '/mentions-legales', '/auth']"
)

with open('src/proxy.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
