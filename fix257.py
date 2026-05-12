# Ajouter lien mentions legales dans login
with open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "  )\n}",
    """    <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#d4c5b0' }}>
      <a href="/mentions-legales" style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions légales & Politique de confidentialité</a>
      {' — '} TEXTILE LOOP © 2026
    </div>
  )
}"""
)

with open('src/app/(auth)/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done login")

# Ajouter lien dans register
with open('src/app/(auth)/register/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "  )\n}",
    """    <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#d4c5b0' }}>
      <a href="/mentions-legales" style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions légales & Politique de confidentialité</a>
      {' — '} TEXTILE LOOP © 2026
    </div>
  )
}"""
)

with open('src/app/(auth)/register/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done register")
