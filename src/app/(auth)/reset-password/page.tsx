'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [ready, setReady] = useState(true)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8) { setError('8 caractères minimum.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError('Une erreur est survenue. Le lien a peut-être expiré.'); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo_ethys.png" alt="TEXTILE LOOP" style={{ width: 160, height: 'auto', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Plateforme ETHYS</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F3', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Mot de passe mis à jour</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>Redirection vers la connexion...</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 6 }}>Nouveau mot de passe</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>Choisissez un mot de passe différent du précédent.</div>
              <form onSubmit={handleReset}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Nouveau mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="8 caractères minimum" required
                      style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#1A202C', background: '#fff' }}
                      onFocus={e => e.target.style.borderColor = '#0A3D26'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#94A3B8' }}>
                      {showPassword ? (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Confirmer le mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répétez le mot de passe" required
                      style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#1A202C', background: '#fff' }}
                      onFocus={e => e.target.style.borderColor = '#0A3D26'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#94A3B8' }}>
                      {showConfirm ? (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
                    </button>
                  </div>
                </div>
                {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626', marginBottom: 16 }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: loading ? '#E2E8F0' : '#0A3D26', color: loading ? '#94A3B8' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
                  {loading ? 'Mise à jour...' : 'Définir le nouveau mot de passe'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
