'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ROLES = [
  { value: 'marque', label: 'Marque', desc: 'Donneur d\'ordre, commande du fil' },
  { value: 'filature', label: 'Filature', desc: 'Transforme le coton en fil' },
  { value: 'fournisseur', label: 'Fournisseur coton', desc: 'Fournit la matière première' },
]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('marque')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } }
    })
    if (error) {
      setError(error.message)
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
      <div style={{ width: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: '#0A3D26',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 auto 12px'
          }}>T</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0A3D26' }}>TEXTILE LOOP</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Créer votre compte ETHYS</div>
        </div>
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #EEF0F3',
          padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
        }}>
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>
                Email professionnel
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@entreprise.fr"
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1.5px solid #E2E8F0', fontSize: 13,
                  boxSizing: 'border-box', outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = '#0A3D26'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                required
                minLength={8}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1.5px solid #E2E8F0', fontSize: 13,
                  boxSizing: 'border-box', outline: 'none'
                }}
                onFocus={e => e.target.style.borderColor = '#0A3D26'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 10 }}>
                Votre rôle sur la plateforme
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ROLES.map(r => (
                  <div
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    style={{
                      padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${role === r.value ? '#0A3D26' : '#EEF0F3'}`,
                      background: role === r.value ? '#F0FDF4' : '#FAFAFA',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: role === r.value ? '#0A3D26' : '#1A202C' }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, background: '#FEF2F2',
                border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626', marginBottom: 16
              }}>{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                background: loading ? '#E2E8F0' : '#0A3D26',
                color: loading ? '#94A3B8' : '#fff',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer'
              }}
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#94A3B8' }}>
            Déjà un compte ?{' '}
            <a href="/login" style={{ color: '#0A3D26', fontWeight: 600, textDecoration: 'none' }}>
              Se connecter
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}