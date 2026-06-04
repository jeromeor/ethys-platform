'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const t = useTranslations('ForgotPassword')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.ethys-textileloop.com/auth/callback?next=/reset-password',
    })
    if (error) { setError(t('error')); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <LanguageSwitcher />
      </div>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo_ethys.png" alt="TEXTILE LOOP" style={{ width: 80, height: 'auto', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>PLATFORM</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0f4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>{t('sentTitle')}</div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
                {t('sentTo')} <strong>{email}</strong>.<br/>
                {t('sentLine2')}<br/>
                {t('sentLine3')}
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 20 }}>
                {t('spamWarning')}
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 20 }}>
                {t('linkValidity')}
              </div>
              <a href="/login" style={{ display: 'block', textAlign: 'center', fontSize: 13, color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>{t('backToLogin')}</a>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{t('title')}</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24, lineHeight: 1.6 }}>
                {t('subtitle1')}<br/>
                {t('subtitle2')}
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>{t('emailLabel')}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('emailPlaceholder')} required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#1a1a1a', background: '#fff' }}
                    onFocus={e => e.target.style.borderColor = '#0A3D26'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                </div>
                {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626', marginBottom: 16 }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 4, border: 'none', background: loading ? '#e8e3d8' : '#1a1a1a', color: loading ? '#8b7355' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
                  {loading ? t('sending') : t('submit')}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#94A3B8' }}>
                <a href="/login" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>{t('backToLogin')}</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
