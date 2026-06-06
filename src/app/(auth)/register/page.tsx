'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import LanguageSwitcher from '@/components/LanguageSwitcher'

// Les libellés/descriptions des rôles sont traduits via les clés "role_..."
const ROLES = [
  { value: 'marque' },
  { value: 'filature' },
  { value: 'fournisseur_coton' },
]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('Register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('marque')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [consentement, setConsentement] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { setError(t('mismatch')); return }
    if (!consentement) { setError(t('errorConsent')); return }
    setLoading(true)
    setError('')
    const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: 'https://www.ethys-textileloop.com/auth/callback?next=/en-attente' } })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    await new Promise(r => setTimeout(r, 1000))
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('messages').insert({
        expediteur_id: user.id,
        destinataire_id: '1e48a840-8329-4595-be9b-f04d9ef1562a',
        sujet: 'Nouvelle inscription',
        contenu: 'Nouvel utilisateur inscrit : ' + user.email + '. Pensez a associer son entreprise dans Admin.',
        lu: false,
        private: false
      })
      await supabase.from('profils_utilisateurs').upsert({ id: user.id, email: user.email, role, statut: 'actif', email_valide: true }, { onConflict: 'id' })
    }
    router.push('/dashboard')
    router.refresh()
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 4,
    border: '1.5px solid #d4c5b0', fontSize: 13,
    boxSizing: 'border-box' as const, outline: 'none',
    color: '#1a1a1a', background: '#fff', fontFamily: 'inherit'
  }

  const EyeIcon = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#8b7355' }}>
      {show
        ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative' }}>
      {/* Sélecteur de langue (pastilles drapeaux) en haut a droite */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <LanguageSwitcher />
      </div>

      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <a href="/login"><img src="/logo_ethys.png" alt="ETHYS" style={{ width: 65, height: 'auto', margin: '0 auto 6px', display: 'block' }} /></a>
          <div style={{ fontSize: 10, color: '#8b7355', letterSpacing: 2, textTransform: 'uppercase' }}>Platform</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #d4c5b0', padding: '22px 26px', boxShadow: '0 2px 12px rgba(26,26,26,0.06)' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 3 }}>{t('title')}</div>
          <div style={{ fontSize: 12, color: '#8b7355', marginBottom: 14 }}>{t('subtitle')}</div>
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('emailLabel')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('emailPlaceholder')} required style={inputStyle} onFocus={e => e.target.style.borderColor='#1a1a1a'} onBlur={e => e.target.style.borderColor='#d4c5b0'} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('passwordLabel')}</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('passwordPlaceholder')} required minLength={8} style={{ ...inputStyle, paddingRight: 40 }} onFocus={e => e.target.style.borderColor='#1a1a1a'} onBlur={e => e.target.style.borderColor='#d4c5b0'} />
                <EyeIcon show={showPassword} toggle={() => setShowPassword(v => !v)} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('confirmLabel')}</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t('confirmPlaceholder')} onPaste={e => e.preventDefault()} onCopy={e => e.preventDefault()} required minLength={8} style={{ ...inputStyle, paddingRight: 40, borderColor: confirmPassword && password !== confirmPassword ? '#8b3a3a' : '#d4c5b0' }} onFocus={e => e.target.style.borderColor='#1a1a1a'} onBlur={e => e.target.style.borderColor= confirmPassword && password !== confirmPassword ? '#8b3a3a' : '#d4c5b0'} />
                <EyeIcon show={showConfirm} toggle={() => setShowConfirm(v => !v)} />
              </div>
              {confirmPassword && password !== confirmPassword && <div style={{ fontSize: 11, color: '#8b3a3a', marginTop: 3 }}>{t('mismatch')}</div>}
              {confirmPassword && password === confirmPassword && <div style={{ fontSize: 11, color: '#2d5016', marginTop: 3 }}>{t('match')}</div>}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('roleLabel')}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ROLES.map(r => (
                  <div key={r.value} onClick={() => setRole(r.value)} style={{ padding: '9px 12px', borderRadius: 4, border: `1.5px solid ${role === r.value ? '#1a1a1a' : '#d4c5b0'}`, background: role === r.value ? '#f5f3ef' : '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{t('role_' + r.value)}</div>
                      <div style={{ fontSize: 11, color: '#8b7355' }}>{t('role_' + r.value + '_desc')}</div>
                    </div>
                    {role === r.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a1a1a' }} />}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14, padding: '12px', borderRadius: 4, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
              <input
                type="checkbox"
                id="consentement"
                checked={consentement}
                onChange={e => setConsentement(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#1a1a1a', flexShrink: 0, width: 14, height: 14, cursor: 'pointer' }}
              />
              <label htmlFor="consentement" style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5, cursor: 'pointer' }}>
                {t.rich('consent', {
                  link: (chunks) => <a href="/mentions-legales" target="_blank" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'underline' }}>{chunks}</a>
                })}
              </label>
            </div>
            {error && <div style={{ padding: '8px 12px', borderRadius: 4, background: '#fdf0f0', border: '1px solid #8b3a3a', fontSize: 12, color: '#8b3a3a', marginBottom: 10 }}>{error}</div>}
            <button type="submit" disabled={loading || !consentement} style={{ width: '100%', padding: '11px', borderRadius: 4, border: 'none', background: loading || !consentement ? '#e8e3d8' : '#1a1a1a', color: loading || !consentement ? '#8b7355' : '#fff', fontSize: 12, fontWeight: 600, cursor: loading || !consentement ? 'default' : 'pointer', letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'inherit' }}>
              {loading ? t('creating') : t('submit')}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#8b7355' }}>
            {t('hasAccount')}{' '}
            <a href="/login" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>{t('signIn')}</a>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#d4c5b0' }}>
          <a href='/mentions-legales' style={{ color: '#8b7355', textDecoration: 'none' }}>{t('legal')}</a>
          {' — '} TEXTILE LOOP © 2026
        </div>
      </div>
    </div>
  )
}
