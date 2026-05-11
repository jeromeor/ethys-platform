'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou mot de passe incorrect. Verifiez votre saisie.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#f5f3ef',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* Panneau gauche decoratif */}
      <div style={{
        display: 'none',
        width: '45%', background: '#1a1a1a',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px', position: 'relative', overflow: 'hidden'
      }} className="auth-panel">
        <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 80, filter: 'invert(1)' }} />
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', lineHeight: 1.3, marginBottom: 16 }}>
            La tracabilite textile<br />au service de l'ethique
          </div>
          <div style={{ fontSize: 14, color: '#8b7355', lineHeight: 1.6 }}>
            Plateforme de certification ETHYS par TEXTILE LOOP
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#4a5568' }}>Version Beta — Mai 2026</div>
      </div>

      {/* Panneau droit formulaire */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px 24px'
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 80, height: 'auto', margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: 11, color: '#8b7355', letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 }}>Platform</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #d4c5b0', padding: '36px 32px', boxShadow: '0 2px 12px rgba(26,26,26,0.06)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Connexion</div>
            <div style={{ fontSize: 13, color: '#8b7355', marginBottom: 28 }}>Accedez a votre espace ETHYS</div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email professionnel</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="vous@entreprise.fr" required
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 13, boxSizing: 'border-box' as const, outline: 'none', color: '#1a1a1a', background: '#fff', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                  onBlur={e => e.target.style.borderColor = '#d4c5b0'}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    style={{ width: '100%', padding: '11px 40px 11px 14px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 13, boxSizing: 'border-box' as const, outline: 'none', color: '#1a1a1a', background: '#fff', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                    onBlur={e => e.target.style.borderColor = '#d4c5b0'}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#8b7355' }}>
                    {showPassword ? (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: 22 }}>
                <a href="/forgot-password" style={{ fontSize: 12, color: '#8b7355', textDecoration: 'none' }}>Mot de passe oublie ?</a>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 4, background: '#fdf0f0', border: '1px solid #8b3a3a', fontSize: 12, color: '#8b3a3a', marginBottom: 16 }}>{error}</div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px', borderRadius: 4, border: 'none',
                background: loading ? '#e8e3d8' : '#1a1a1a',
                color: loading ? '#8b7355' : '#ffffff',
                fontSize: 13, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
                letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'inherit'
              }}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#8b7355' }}>
              Pas encore de compte ?{' '}
              <a href="/register" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>Creer un compte</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
