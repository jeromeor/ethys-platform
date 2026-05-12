with open('src/app/mentions-legales/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer le bouton retour par un lien simple
content = content.replace(
    "'use client'\n\nimport { useRouter } from 'next/navigation'\n\nexport default function MentionsLegalesPage() {\n  const router = useRouter()\n\n  return (",
    "export default function MentionsLegalesPage() {\n  return ("
)
content = content.replace(
    "onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#8b7355', fontSize: 13, marginBottom: 24, padding: 0 }}>",
    "href='/' style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8b7355', fontSize: 13, marginBottom: 24, textDecoration: 'none' }}>"
)
content = content.replace("<button ", "<a ")
content = content.replace("</button>", "</a>")

with open('src/app/mentions-legales/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
