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
      setError('Email ou mot de passe incorrect')
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
          <img
            src="/logo.png"
            alt="TEXTILE LOOP"
            style={{ width: 160, height: 'auto', margin: '0 auto 12px', display: 'block' }}
          />
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Plateforme ETHYS</div>
        </div>
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #EEF0F3',
          padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 6 }}>Connexion</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>Accedez a votre espace ETHYS</div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Email professionnel</label>
              <input
  type="email"
  value={email}
  onChange={e => setEmail(e.target.value)}
  placeholder="vous@entreprise.fr"
  required
  style={{
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #E2E8F0', fontSize: 13,
    boxSizing: 'border-box', outline: 'none',
    color: '#1A202C', background: '#fff'
  }}
  onFocus={e => e.target.style.borderColor = '#0A3D26'}
  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Mot de passe</label>
             <div style={{ marginBottom: 20 }}>
  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>
    Mot de passe
  </label>
  <div style={{ position: 'relative' }}>
    <input
      type={showPassword ? 'text' : 'password'}
      value={password}
      onChange={e => setPassword(e.target.value)}
      placeholder="••••••••"
      required
      style={{
        width: '100%', padding: '10px 40px 10px 14px', borderRadius: 8,
        border: '1.5px solid #E2E8F0', fontSize: 13,
        boxSizing: 'border-box', outline: 'none',
        color: '#1A202C', background: '#fff'
      }}
      onFocus={e => e.target.style.borderColor = '#0A3D26'}
      onBlur={e => e.target.style.borderColor = '#E2E8F0'}
    />
    <button
      type="button"
      onClick={() => setShowPassword(v => !v)}
      style={{
        position: 'absolute', right: 12, top: '50%',
        transform: 'translateY(-50%)', border: 'none',
        background: 'none', cursor: 'pointer', padding: 0,
        color: '#94A3B8', fontSize: 16
      }}
    >
      {showPassword ? '🙈' : '👁'}
    </button>
  </div>
</div>
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626', marginBottom: 16 }}>{error}</div>
            )}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px', borderRadius: 10, border: 'none',
              background: loading ? '#E2E8F0' : '#0A3D26',
              color: loading ? '#94A3B8' : '#fff',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer'
            }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#94A3B8' }}>
            Pas encore de compte ?{' '}
            <a href="/register" style={{ color: '#0A3D26', fontWeight: 600, textDecoration: 'none' }}>Creer un compte</a>
          </div>
        </div>
      </div>
    </div>
  )
}
