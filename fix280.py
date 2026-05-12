import re

files = {
    'src/app/(auth)/login/page.tsx': None,
    'src/app/(auth)/register/page.tsx': None,
    'src/app/mentions-legales/page.tsx': None,
}

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Supprimer les <a> mal inseres
    content = re.sub(
        r'<a href="/login" style=\{\{ display: "block" \}\}><img src="/logo_ethys\.png"([^/]*)/></a>',
        r'<a href="/login"><img src="/logo_ethys.png"\1/></a>',
        content
    )
    # Cas ou </a> est absent
    content = re.sub(
        r'<a href="/login" style=\{\{ display: "block" \}\}>(<img src="/logo_ethys\.png"[^>]*/>)(?!</a>)',
        r'<a href="/login">\1</a>',
        content
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed: {filepath}")

print("Done")
