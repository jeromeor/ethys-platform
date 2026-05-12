'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.ethys-textileloop.com/reset-password',
    })
    if (error) { setError('Une erreur est survenue. Vérifiez votre email.'); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo_ethys.png" alt="TEXTILE LOOP" style={{ width: 160, height: 'auto', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Plateforme ETHYS</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F3', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Email envoyé</div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
                Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.<br/>
                Votre mot de passe actuel a été désactivé.<br/>
                Vérifiez votre boîte mail et cliquez sur le lien pour définir un nouveau mot de passe.
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 20 }}>
                Le lien est valable 1 heure. Après ce délai, vous devrez faire une nouvelle demande.
              </div>
              <a href="/login" style={{ display: 'block', textAlign: 'center', fontSize: 13, color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>Retour à la connexion</a>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 6 }}>Mot de passe oublié</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24, lineHeight: 1.6 }}>
                Saisissez votre email. Vous recevrez un lien pour créer un nouveau mot de passe.<br/>
                Votre mot de passe actuel sera désactivé immédiatement.
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Email professionnel</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@entreprise.fr" required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#1A202C', background: '#fff' }}
                    onFocus={e => e.target.style.borderColor = '#0A3D26'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                </div>
                {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626', marginBottom: 16 }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: loading ? '#E2E8F0' : '#0A3D26', color: loading ? '#94A3B8' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
                  {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#94A3B8' }}>
                <a href="/login" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>Retour à la connexion</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
