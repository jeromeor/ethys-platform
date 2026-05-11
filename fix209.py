with open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Trouver et remplacer le div avec fond noir autour du logo
import re
content = re.sub(
    r"<div style=\{\{[^}]*background: '#1a1a1a'[^}]*\}\}>\s*<img src=\"/logo_ethys\.png\"[^/]*/>\s*</div>",
    '<img src="/logo_ethys.png" alt="ETHYS" style={{ width: 100, height: \'auto\', margin: \'0 auto 12px\', display: \'block\' }} />',
    content
)

with open('src/app/(auth)/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
