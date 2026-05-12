with open('src/components/modules/CertificationClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
# Remplacer tous les new Date() sans verification null
content = re.sub(
    r"new Date\(([^)]+)\)\.toLocaleDateString\('fr-FR'\)",
    r"(\1 ? new Date(\1).toLocaleDateString('fr-FR') : '-')",
    content
)

with open('src/components/modules/CertificationClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
