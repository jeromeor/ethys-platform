with open('src/app/(dashboard)/profil/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer le form avec onSubmit par un lien simple
content = content.replace(
    """        <form action="/api/delete-account" method="POST" onSubmit={(e) => {
          if (!confirm('Êtes-vous certain de vouloir supprimer votre compte ? Cette action est irréversible.')) {
            e.preventDefault()
          }
        }}>
          <button type="submit" style={{ padding: '8px 16px', borderRadius: 4, border: '1.5px solid #8b3a3a', background: '#fff', color: '#8b3a3a', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Supprimer mon compte
          </button>
        </form>""",
    """        <a href="/profil/supprimer" style={{ padding: '8px 16px', borderRadius: 4, border: '1.5px solid #8b3a3a', background: '#fff', color: '#8b3a3a', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' }}>
          Supprimer mon compte
        </a>"""
)

with open('src/app/(dashboard)/profil/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
