'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const INDICATIFS = [
  '+33 France', '+32 Belgique', '+41 Suisse', '+352 Luxembourg',
  '+44 Royaume-Uni', '+49 Allemagne', '+34 Espagne', '+39 Italie',
  '+351 Portugal', '+90 Turquie', '+212 Maroc', '+216 Tunisie',
]

import { Suspense } from 'react'

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [step, setStep] = useState(searchParams.get('step') === 'email' ? 0 : 1)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    telephone_indicatif: '+33',
    adresse_rue: '',
    adresse_code_postal: '',
    adresse_ville: '',
    adresse_pays: 'France',
  })

  useEffect(() => {
    const chargerProfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profils_utilisateurs')
        .select('prenom, nom, telephone, adresse_rue, adresse_code_postal, adresse_ville, adresse_pays')
        .eq('id', user.id)
        .single()
      if (data) setForm(f => ({ ...f, ...data }))
    }
    chargerProfil()
  }, [])

  const sauvegarder = async () => {
    if (!form.prenom || !form.nom || !form.telephone || !form.adresse_rue || !form.adresse_ville) {
      setMessage('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profils_utilisateurs')
      .update({
        prenom: form.prenom,
        nom: form.nom,
        telephone: `${form.telephone_indicatif} ${form.telephone}`,
        adresse_rue: form.adresse_rue,
        adresse_code_postal: form.adresse_code_postal,
        adresse_ville: form.adresse_ville,
        adresse_pays: form.adresse_pays,
        profil_complete_at: new Date().toISOString(),
      })
      .eq('id', user!.id)
    if (!error) {
      router.push('/en-attente')
    } else {
      setMessage('Erreur lors de la sauvegarde.')
    }
    setSaving(false)
  }

  const renvoyerEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      await supabase.auth.resend({ type: 'signup', email: user.email })
      setMessage('Email de validation renvoyé.')
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #E2E8F0', fontSize: 13,
    boxSizing: 'border-box' as const, outline: 'none', color: '#1A202C', background: '#fff'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="TEXTILE LOOP" style={{ width: 140, height: 'auto', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 13, color: '#94A3B8' }}>Plateforme ETHYS</div>
        </div>

        {step === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F3', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>✉</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 8 }}>Validez votre email</div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                Un email de validation vous a été envoyé à votre adresse.<br />
                Cliquez sur le lien dans cet email pour activer votre compte.
              </div>
            </div>
            <div style={{ padding: '14px', borderRadius: 10, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 20, textAlign: 'center' }}>
              Vous avez 7 jours pour valider votre email et compléter votre profil.
            </div>
            <button onClick={renvoyerEmail} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #EEF0F3', background: '#F8FAFC', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
              Renvoyer l'email de validation
            </button>
            <button onClick={() => setStep(1)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Continuer vers mon profil
            </button>
            {message && <div style={{ marginTop: 12, fontSize: 12, color: '#065F46', textAlign: 'center' }}>{message}</div>}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F3', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>Complétez votre profil</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24, lineHeight: 1.6 }}>
              Ces informations sont nécessaires pour accéder à l'ensemble des fonctionnalités de la plateforme ETHYS.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Prénom *</label>
                <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} style={inputStyle} placeholder="Marie"
                  onFocus={e => e.target.style.borderColor = '#0A3D26'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Nom *</label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} placeholder="Dupont"
                  onFocus={e => e.target.style.borderColor = '#0A3D26'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Téléphone *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={form.telephone_indicatif} onChange={e => setForm(f => ({ ...f, telephone_indicatif: e.target.value.split(' ')[0] }))} style={{ ...inputStyle, width: 160, flexShrink: 0 }}>
                  {INDICATIFS.map(i => <option key={i} value={i.split(' ')[0]}>{i}</option>)}
                </select>
                <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} placeholder="06 12 34 56 78"
                  onFocus={e => e.target.style.borderColor = '#0A3D26'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Adresse *</label>
              <input value={form.adresse_rue} onChange={e => setForm(f => ({ ...f, adresse_rue: e.target.value }))} style={{ ...inputStyle, marginBottom: 8 }} placeholder="12 rue de la Paix"
                onFocus={e => e.target.style.borderColor = '#0A3D26'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                <input value={form.adresse_code_postal} onChange={e => setForm(f => ({ ...f, adresse_code_postal: e.target.value }))} style={inputStyle} placeholder="75001"
                  onFocus={e => e.target.style.borderColor = '#0A3D26'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                <input value={form.adresse_ville} onChange={e => setForm(f => ({ ...f, adresse_ville: e.target.value }))} style={inputStyle} placeholder="Paris"
                  onFocus={e => e.target.style.borderColor = '#0A3D26'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Pays</label>
              <input value={form.adresse_pays} onChange={e => setForm(f => ({ ...f, adresse_pays: e.target.value }))} style={inputStyle} placeholder="France"
                onFocus={e => e.target.style.borderColor = '#0A3D26'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
            </div>

            <div style={{ padding: '12px 14px', borderRadius: 10, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 12 }}>
              Vous avez tenté d'accéder à une page qui nécessite un profil complet. Veuillez renseigner vos coordonnées pour débloquer l'accès à tous les modules.
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #A7F3D0', fontSize: 12, color: '#065F46', marginBottom: 20 }}>
              Après validation de votre profil, votre entreprise sera vérifiée par TEXTILE LOOP avant que vous puissiez accéder à toutes les fonctionnalités.
            </div>

            {message && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626', marginBottom: 16 }}>{message}</div>
            )}

            <button onClick={sauvegarder} disabled={saving} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#E2E8F0' : '#0A3D26', color: saving ? '#94A3B8' : '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Sauvegarde...' : 'Valider mon profil'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
