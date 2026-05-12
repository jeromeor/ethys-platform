content = open('src/app/(auth)/reset-password/page.tsx', 'r', encoding='utf-8').read()

content = content.replace(
    "      <div style={{ width: 400 }}>",
    """      <div style={{ width: 400 }}>
        {!ready && (
          <div style={{ background: '#fdf8ec', border: '1px solid #b8860b', borderRadius: 8, padding: '16px', textAlign: 'center', marginBottom: 16, fontSize: 13, color: '#b8860b' }}>
            Chargement du lien de réinitialisation...
          </div>
        )}"""
)

open('src/app/(auth)/reset-password/page.tsx', 'w', encoding='utf-8').write(content)
print("Done")
