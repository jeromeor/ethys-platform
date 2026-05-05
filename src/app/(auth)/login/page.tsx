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
      setError(error.message.includes('Invalid') ? 'Email ou mot de passe incorrect. Verifiez votre saisie.' : 'Cet email nest pas enregistre. Verifiez la saisie ou creez un compte.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F7F8FA',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif"
    }}>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="TEXTILE LOOP" style={{ width: 160, height: 'auto', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Plateforme ETHYS</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F3', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 6 }}>Connexion</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>Accedez a votre espace ETHYS</div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Email professionnel</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vous@entreprise.fr" required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#1A202C', background: '#fff' }}
                onFocus={e => e.target.style.borderColor = '#0A3D26'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#1A202C', background: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#0A3D26'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#94A3B8', fontSize: 18, lineHeight: 1 }}
                >
                  {showPassword ? (<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24'/><line x1='1' y1='1' x2='23' y2='23'/></svg>) : (<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/><circle cx='12' cy='12' r='3'/></svg>)}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626', marginBottom: 16 }}>{error}</div>
            )}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: loading ? '#E2E8F0' : '#0A3D26', color: loading ? '#94A3B8' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
<div style={{ textAlign: 'center', marginBottom: 12 }}>
  <a href="/forgot-password" style={{ fontSize: 12, color: '#64748B', textDecoration: 'none' }}>
    Mot de passe oublie ?
  </a>
</div>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#94A3B8' }}>
            Mot de passe oublie ?{' '}<a href="/forgot-password" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13 }}>Reinitialiser</a><br/>Pas encore de compte ?{' '}
            <a href="/register" style={{ color: '#0A3D26', fontWeight: 600, textDecoration: 'none' }}>Creer un compte</a>
          </div>
        </div>
      </div>
    </div>
  )
}



