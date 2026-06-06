'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import LanguageSwitcher from '@/components/LanguageSwitcher'

const INDICATIFS = [
  '+33 France', '+32 Belgique', '+41 Suisse', '+352 Luxembourg',
  '+44 Royaume-Uni', '+49 Allemagne', '+34 Espagne', '+39 Italie',
  '+351 Portugal', '+90 Turquie', '+212 Maroc', '+216 Tunisie',
]

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const t = useTranslations('Onboarding')
  const [step, setStep] = useState(searchParams.get('step') === 'email' ? 0 : 1)
  const isRedirected = searchParams.get('redirect') === '1'
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
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
    const newErrors: Record<string, boolean> = {}
    if (!form.prenom) newErrors.prenom = true
    if (!form.nom) newErrors.nom = true
    if (!form.telephone) newErrors.telephone = true
    if (!form.adresse_rue) newErrors.adresse_rue = true
    if (!form.adresse_ville) newErrors.adresse_ville = true
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setMessage(t('errorRequired'))
      return
    }
    setErrors({})
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
        statut: 'actif',
      })
      .eq('id', user!.id)
    if (!error) {
      router.push('/en-attente')
    } else {
      setMessage(t('errorPrefix') + error.message)
    }
    setSaving(false)
  }

  const renvoyerEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      await supabase.auth.resend({ type: 'signup', email: user.email })
      setMessage(t('emailResent'))
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 4,
    border: '1.5px solid #d4c5b0', fontSize: 13,
    boxSizing: 'border-box' as const, outline: 'none', color: '#1A202C', background: '#fff'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <LanguageSwitcher />
      </div>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo_ethys.png" alt="TEXTILE LOOP" style={{ width: 80, height: 'auto', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 13, color: '#8b7355' }}>PLATFORM</div>
        </div>

        {step === 0 ? (
          <div style={{ background: '#fff', borderRadius: 4, border: '1px solid #d4c5b0', padding: '32px', boxShadow: '0 2px 12px rgba(26,26,26,0.06)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fdf8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>✉</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 8 }}>{t('step0Title')}</div>
              <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.6 }}>
                {t('step0Desc1')}<br />
                {t('step0Desc2')}
              </div>
            </div>
            <div style={{ padding: '14px', borderRadius: 4, background: '#fdf8ec', border: '1px solid #b8860b', fontSize: 12, color: '#b8860b', marginBottom: 20, textAlign: 'center' }}>
              {t('step0Warning')}
            </div>
            <button onClick={renvoyerEmail} style={{ width: '100%', padding: '10px', borderRadius: 4, border: '1.5px solid #d4c5b0', background: '#F8FAFC', color: '#4a5568', fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
              {t('resendEmail')}
            </button>
            <button onClick={() => setStep(1)} style={{ width: '100%', padding: '10px', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('continueToProfile')}
            </button>
            {message && <div style={{ marginTop: 12, fontSize: 12, color: '#2d5016', textAlign: 'center' }}>{message}</div>}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 4, border: '1px solid #d4c5b0', padding: '32px', boxShadow: '0 2px 12px rgba(26,26,26,0.06)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>{t('step1Title')}</div>
            <div style={{ fontSize: 13, color: '#8b7355', marginBottom: 16, lineHeight: 1.6 }}>
              {t('step1Desc')}
            </div>
            {isRedirected && (
              <div style={{ padding: '12px 14px', borderRadius: 4, background: '#fdf8ec', border: '1px solid #b8860b', fontSize: 12, color: '#b8860b', marginBottom: 16 }}>
                {t('redirectWarning')}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('firstNameLabel')}</label>
                <input value={form.prenom} onChange={e => { setForm(f => ({ ...f, prenom: e.target.value })); setErrors(e2 => ({ ...e2, prenom: false })) }}
                  style={{ ...inputStyle, borderColor: errors.prenom ? '#EF4444' : '#E2E8F0' }} placeholder={t('firstNamePlaceholder')}
                  onFocus={e => e.target.style.borderColor = '#1a1a1a'} onBlur={e => e.target.style.borderColor = '#d4c5b0'} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('lastNameLabel')}</label>
                <input value={form.nom} onChange={e => { setForm(f => ({ ...f, nom: e.target.value })); setErrors(e2 => ({ ...e2, nom: false })) }}
                  style={{ ...inputStyle, borderColor: errors.nom ? '#EF4444' : '#E2E8F0' }} placeholder={t('lastNamePlaceholder')}
                  onFocus={e => e.target.style.borderColor = '#1a1a1a'} onBlur={e => e.target.style.borderColor = '#d4c5b0'} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('phoneLabel')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={form.telephone_indicatif} onChange={e => setForm(f => ({ ...f, telephone_indicatif: e.target.value.split(' ')[0] }))} style={{ ...inputStyle, width: 160, flexShrink: 0 }}>
                  {INDICATIFS.map(i => <option key={i} value={i.split(' ')[0]}>{i}</option>)}
                </select>
                <input value={form.telephone} onChange={e => { setForm(f => ({ ...f, telephone: e.target.value })); setErrors(e2 => ({ ...e2, telephone: false })) }}
                  style={{ ...inputStyle, borderColor: errors.telephone ? '#EF4444' : '#E2E8F0' }} placeholder={t('phonePlaceholder')}
                  onFocus={e => e.target.style.borderColor = '#1a1a1a'} onBlur={e => e.target.style.borderColor = '#d4c5b0'} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('addressLabel')}</label>
              <input value={form.adresse_rue} onChange={e => { setForm(f => ({ ...f, adresse_rue: e.target.value })); setErrors(e2 => ({ ...e2, adresse_rue: false })) }}
                style={{ ...inputStyle, marginBottom: 8, borderColor: errors.adresse_rue ? '#EF4444' : '#E2E8F0' }} placeholder={t('addressPlaceholder')}
                onFocus={e => e.target.style.borderColor = '#1a1a1a'} onBlur={e => e.target.style.borderColor = '#d4c5b0'} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                <input value={form.adresse_code_postal} onChange={e => setForm(f => ({ ...f, adresse_code_postal: e.target.value }))} style={inputStyle} placeholder="75001"
                  onFocus={e => e.target.style.borderColor = '#1a1a1a'} onBlur={e => e.target.style.borderColor = '#d4c5b0'} />
                <input value={form.adresse_ville} onChange={e => { setForm(f => ({ ...f, adresse_ville: e.target.value })); setErrors(e2 => ({ ...e2, adresse_ville: false })) }}
                  style={{ ...inputStyle, borderColor: errors.adresse_ville ? '#EF4444' : '#E2E8F0' }} placeholder={t('cityPlaceholder')}
                  onFocus={e => e.target.style.borderColor = '#1a1a1a'} onBlur={e => e.target.style.borderColor = '#d4c5b0'} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('countryLabel')}</label>
              <input value={form.adresse_pays} onChange={e => setForm(f => ({ ...f, adresse_pays: e.target.value }))} style={inputStyle} placeholder={t('countryPlaceholder')}
                onFocus={e => e.target.style.borderColor = '#1a1a1a'} onBlur={e => e.target.style.borderColor = '#d4c5b0'} />
            </div>

            <div style={{ padding: '12px 14px', borderRadius: 4, background: '#f0f4ec', border: '1px solid #2d5016', fontSize: 12, color: '#2d5016', marginBottom: 20 }}>
              {t('verifyNotice')}
            </div>

            {message && (
              <div style={{ padding: '10px 14px', borderRadius: 4, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626', marginBottom: 16 }}>{message}</div>
            )}

            <button onClick={sauvegarder} disabled={saving} style={{ width: '100%', padding: '11px', borderRadius: 4, border: 'none', background: saving ? '#E2E8F0' : '#0A3D26', color: saving ? '#94A3B8' : '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
              {saving ? t('saving') : t('submit')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
