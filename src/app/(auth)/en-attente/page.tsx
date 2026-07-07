'use client'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { getProfilUtilisateur } from '@/lib/data/profils'
import { useRouter } from 'next/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'
export default function EnAttentePage() {
  const supabase = createClient()
  const router = useRouter()
  const t = useTranslations('EnAttente')
  const [email, setEmail] = useState('')
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')
     const { data: profil } = await getProfilUtilisateur(supabase, user.id)
      if (profil?.entreprise_id) router.push('/dashboard')
    }
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <LanguageSwitcher />
      </div>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <a href="/dashboard">
          <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 80, height: 'auto', margin: '0 auto 8px', display: 'block', cursor: 'pointer' }} />
        </a>
        <div style={{ fontSize: 11, color: '#8b7355', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>PLATFORM</div>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #d4c5b0', padding: '24px 28px', boxShadow: '0 2px 12px rgba(26,26,26,0.06)' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>{t('title')}</div>
          <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
            {t('desc1')}<br />
            {t('desc2')}<br />
            {t('desc3')}<br /><br />
            {t('desc4')} <strong>{email}</strong><br />
            {t('desc5')}
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 6, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 16 }}>
            {t('notice24h')}
          </div>
          <div style={{ fontSize: 12, color: '#8b7355', marginBottom: 12 }}>
            {t('autoCheck')}
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 20px', borderRadius: 4, border: '1.5px solid #d4c5b0', background: '#f5f3ef', color: '#4a5568', fontSize: 12, cursor: 'pointer' }}>
            {t('logout')}
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#d4c5b0' }}>
          <a href="/mentions-legales" style={{ color: '#8b7355', textDecoration: 'none' }}>{t('legal')}</a>
          {' — '} TEXTILE LOOP © 2026
        </div>
      </div>
    </div>
  )
}
