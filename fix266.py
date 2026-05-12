with open('src/app/(auth)/register/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Ajouter useState pour le consentement
content = content.replace(
    "  const [error, setError] = useState('')",
    "  const [error, setError] = useState('')\n  const [consentement, setConsentement] = useState(false)"
)

# Bloquer la soumission sans consentement
content = content.replace(
    "    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }",
    "    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }\n    if (!consentement) { setError('Vous devez accepter la politique de confidentialité pour créer un compte.'); return }"
)

# Ajouter la case a cocher avant le bouton submit
content = content.replace(
    "            {error && <div style={{ padding: '8px 12px'",
    """            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14, padding: '12px', borderRadius: 4, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
              <input
                type="checkbox"
                id="consentement"
                checked={consentement}
                onChange={e => setConsentement(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#1a1a1a', flexShrink: 0, width: 14, height: 14, cursor: 'pointer' }}
              />
              <label htmlFor="consentement" style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5, cursor: 'pointer' }}>
                J'ai lu et j'accepte la{' '}
                <a href="/mentions-legales" target="_blank" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'underline' }}>
                  politique de confidentialité
                </a>
                {' '}et le traitement de mes données personnelles par TEXTILE LOOP conformément au RGPD.
              </label>
            </div>
            {error && <div style={{ padding: '8px 12px'"""
)

# Desactiver le bouton si pas de consentement
content = content.replace(
    "background: loading ? '#e8e3d8' : '#1a1a1a', color: loading ? '#8b7355' : '#fff', fontSize: 12, fontWeight: 600, cursor: loading ? 'default' : 'pointer'",
    "background: loading || !consentement ? '#e8e3d8' : '#1a1a1a', color: loading || !consentement ? '#8b7355' : '#fff', fontSize: 12, fontWeight: 600, cursor: loading || !consentement ? 'default' : 'pointer'"
)
content = content.replace(
    "disabled={loading}",
    "disabled={loading || !consentement}"
)

with open('src/app/(auth)/register/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
