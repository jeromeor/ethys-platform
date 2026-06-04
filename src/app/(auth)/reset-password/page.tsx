'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const t = useTranslations('ResetPassword')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 8) { setError(t('errorMin')); return }
    if (password !== confirm) { setError(t('mismatch')); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setMessage(t('updated'))
    setTimeout(() => router.push('/dashboard'), 2000)
    setLoading(false)
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <LanguageSwitcher />
      </div>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 80, height: 'auto', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>PLATFORM</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{t('title')}</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>{t('subtitle')}</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>{t('newPasswordLabel')}</label>
              <div style={{ position: 'relative' }}>
                <input type={show1 ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('newPasswordPlaceholder')} required
                  style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#1a1a1a', background: '#fff' }} />
                <button type="button" onClick={() => setShow1(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#8b7355' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>{t('confirmLabel')}</label>
              <div style={{ position: 'relative' }}>
                <input type={show2 ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={t('confirmPlaceholder')} required
                  style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#1a1a1a', background: '#fff' }} />
                <button type="button" onClick={() => setShow2(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#8b7355' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>
            {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626', marginBottom: 16 }}>{error}</div>}
            {message && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f0f4ec', border: '1px solid #c8d8b8', fontSize: 12, color: '#2d5016', marginBottom: 16 }}>{message}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 4, border: 'none', background: loading ? '#e8e3d8' : '#1a1a1a', color: loading ? '#8b7355' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
              {loading ? t('updating') : t('submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
