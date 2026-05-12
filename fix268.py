with open('src/app/(dashboard)/profil/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Ajouter section suppression compte avant la fin du return
content = content.replace(
    "    </div>\n  )\n}",
    """    {/* Section suppression compte */}
    <div style={{ maxWidth: 1200, margin: '20px auto', padding: '0 24px' }}>
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #fde8e8', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#8b3a3a', marginBottom: 4 }}>Supprimer mon compte</div>
          <div style={{ fontSize: 12, color: '#8b7355' }}>Cette action est irréversible. Toutes vos données seront supprimées conformément au RGPD.</div>
        </div>
        <form action="/api/delete-account" method="POST" onSubmit={(e) => {
          if (!confirm('Êtes-vous certain de vouloir supprimer votre compte ? Cette action est irréversible.')) {
            e.preventDefault()
          }
        }}>
          <button type="submit" style={{ padding: '8px 16px', borderRadius: 4, border: '1.5px solid #8b3a3a', background: '#fff', color: '#8b3a3a', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Supprimer mon compte
          </button>
        </form>
      </div>
    </div>
    </div>
  )
}"""
)

with open('src/app/(dashboard)/profil/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
