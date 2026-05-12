content = """'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SupprimerComptePage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [delai, setDelai] = useState<'immediat' | '7jours'>('7jours')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleDemande = async () => {
    setError('')
    setLoading(true)

    // Verifier le mot de passe
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setError('Session expir\u00e9e, veuillez vous reconnecter.'); setLoading(false); return }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password
    })
    if (authError) { setError('Mot de passe incorrect.'); setLoading(false); return }

    // Generer un token unique
    const token = crypto.randomUUID()
    const now = new Date()
    const suppressionAt = delai === 'immediat' ? now.toISOString() : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // Stocker la demande
    const { error: updateError } = await supabase
      .from('profils_utilisateurs')
      .update({
        suppression_demandee_at: suppressionAt,
        suppression_token: token,
        suppression_type: delai
      })
      .eq('id', user.id)

    if (updateError) { setError('Erreur lors de la demande. Veuillez r\u00e9essayer.'); setLoading(false); return }

    // Envoyer email via Supabase (lien de confirmation)
    const baseUrl = window.location.origin
    const lienConfirmation = `${baseUrl}/profil/confirmer-suppression?token=${token}&uid=${user.id}`

    // Email via Supabase Edge Function ou API
    await fetch('/api/send-deletion-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        lien: lienConfirmation,
        delai: delai,
        token: token
      })
    })

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0f4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2d5016" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Email envoy\u00e9</div>
            <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.7, marginBottom: 20 }}>
              Un email de confirmation a \u00e9t\u00e9 envoy\u00e9 \u00e0 votre adresse.<br />
              Cliquez sur le lien dans l'email pour {delai === 'immediat' ? 'supprimer imm\u00e9diatement' : 'programmer la suppression dans 7 jours'} votre compte.
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 4, background: '#fdf8ec', border: '1px solid #b8860b', fontSize: 12, color: '#b8860b', marginBottom: 20 }}>
              Le lien est valable 24 heures.
            </div>
            <button onClick={() => router.push('/dashboard')} style={{ width: '100%', padding: '10px', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #fde8e8', padding: '32px 28px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#8b3a3a', marginBottom: 8 }}>Supprimer mon compte</div>
          <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.7, marginBottom: 20 }}>
            Cette action supprimera vos donn\u00e9es personnelles conform\u00e9ment au RGPD.<br />
            Les donn\u00e9es de tra\u00e7abilit\u00e9 textile seront conserv\u00e9es pour des raisons l\u00e9gales.
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Confirmez votre mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 13, boxSizing: 'border-box' as const, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              D\u00e9lai de suppression
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div onClick={() => setDelai('7jours')} style={{ padding: '10px 14px', borderRadius: 4, border: `1.5px solid ${delai === '7jours' ? '#1a1a1a' : '#d4c5b0'}`, background: delai === '7jours' ? '#f5f3ef' : '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Dans 7 jours</div>
                  <div style={{ fontSize: 11, color: '#8b7355' }}>Vous pouvez annuler pendant ce d\u00e9lai</div>
                </div>
                {delai === '7jours' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a1a1a' }} />}
              </div>
              <div onClick={() => setDelai('immediat')} style={{ padding: '10px 14px', borderRadius: 4, border: `1.5px solid ${delai === 'immediat' ? '#8b3a3a' : '#d4c5b0'}`, background: delai === 'immediat' ? '#fdf0f0' : '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#8b3a3a' }}>Imm\u00e9diat</div>
                  <div style={{ fontSize: 11, color: '#8b7355' }}>Irr\u00e9versible — suppression d\u00e8s confirmation par email</div>
                </div>
                {delai === 'immediat' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b3a3a' }} />}
              </div>
            </div>
          </div>

          {error && <div style={{ padding: '10px 14px', borderRadius: 4, background: '#fdf0f0', border: '1px solid #8b3a3a', fontSize: 12, color: '#8b3a3a', marginBottom: 16 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.back()} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #d4c5b0', background: '#fff', color: '#4a5568', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Annuler
            </button>
            <button
              onClick={handleDemande}
              disabled={!password || loading}
              style={{ flex: 1, padding: '10px', borderRadius: 4, border: 'none', background: !password || loading ? '#e8e3d8' : '#8b3a3a', color: !password || loading ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 600, cursor: !password || loading ? 'default' : 'pointer', fontFamily: 'inherit' }}
            >
              {loading ? 'Envoi...' : 'Envoyer le lien de confirmation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
"""
open('src/app/(dashboard)/profil/supprimer/page.tsx', 'w', encoding='utf-8').write(content)
print("Done")
