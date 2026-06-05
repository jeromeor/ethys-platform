'use client'

import { useTranslations } from 'next-intl'

export default function LienRetour() {
  const t = useTranslations('mentionsLegales')
  return (
    
      href="#"
      onClick={(e) => { e.preventDefault(); window.history.back() }}
      style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8b7355', fontSize: 13, marginBottom: 24, textDecoration: 'none', cursor: 'pointer' }}
    >
      ← {t('retour')}
    </a>
  )
}
