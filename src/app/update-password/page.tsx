'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    setMessage('')
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setMessage('Mot de passe mis à jour. Redirection...')
    setTimeout(() => router.push('/dashboard'), 2000)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e3d8', padding: '40px 36px', width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src='/logo_ethys.png' alt='ETHYS' style={{ height: 48, marginBottom: 12 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Nouveau mot de passe</div>
          <div style={{ fontSize: 13, color: '#8b7355', marginTop: 4 }}>Choisissez un mot de passe sécurisé</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Nouveau mot de passe</label>
          <input type='password' value={password} onChange={e => setPassword(e.target.value)} placeholder='8 caractères minimum' style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#1a1a1a' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Confirmer le mot de passe</label>
          <input type='password' value={confirm} onChange={e => setConfirm(e.target.value)} placeholder='Répétez le mot de passe' style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#1a1a1a' }} />
        </div>
        {error && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: '#fdf0f0', border: '1px solid #c8a0a0', fontSize: 12, color: '#8b3a3a' }}>{error}</div>}
        {message && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: '#f0f4ec', border: '1px solid #c8d8b8', fontSize: 12, color: '#2d5016' }}>{message}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: loading ? '#d4c5b0' : '#1a1a1a', color: loading ? '#8b7355' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
        </button>
      </div>
    </div>
  )
}