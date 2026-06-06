'use client'

import { useLocale } from 'next-intl'

// Liste des langues : code + drapeau (image CDN) + libellé
const LANGS = [
  { code: 'fr', flag: 'https://flagcdn.com/w40/fr.png', label: 'Français' },
  { code: 'en', flag: 'https://flagcdn.com/w40/gb.png', label: 'English' },
]

// Enregistre la langue dans un cookie (lu côté serveur par next-intl), puis recharge la page
function setLocale(locale: string) {
  document.cookie = 'LOCALE=' + locale + '; path=/; max-age=31536000'
  window.location.reload()
}

export default function LanguageSwitcher() {
  const current = useLocale()

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {LANGS.map(l => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLocale(l.code)}
          title={l.label}
          aria-label={l.label}
          style={{
            width: 32, height: 32, borderRadius: '50%', padding: 0,
            border: current === l.code ? '2px solid #1a1a1a' : '2px solid #d4c5b0',
            cursor: 'pointer', overflow: 'hidden', background: 'none',
            opacity: current === l.code ? 1 : 0.6,
          }}
        >
          <img src={l.flag} alt={l.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </button>
      ))}
    </div>
  )
}
