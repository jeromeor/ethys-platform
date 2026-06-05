'use client'

import { useTranslations } from 'next-intl'

export default function LienRetour() {
  const t = useTranslations('mentionsLegales')

  const style = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#8b7355',
    fontSize: 13,
    marginBottom: 24,
    textDecoration: 'none',
    cursor: 'pointer',
  }

  return (
    <a href="#" onClick={(e) => { e.preventDefault(); window.history.back() }} style={style}>
      &larr; {t('retour')}
    </a>
  )
}