'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
export default function EnAttentePage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setEmail(user.email ?? '')
      const { data: profil } = await supabase
        .from('profils_utilisateurs')
        .select('entreprise_id')
        .eq('id', user.id)
        .single()
      if (profil?.entreprise_id) router.push('/dashboard')
    }
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <a href="/dashboard">
          <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 80, height: 'auto', margin: '0 auto 8px', display: 'block', cursor: 'pointer' }} />
        </a>
        <div style={{ fontSize: 11, color: '#8b7355', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>PLATFORM</div>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #d4c5b0', padding: '24px 28px', boxShadow: '0 2px 12px rgba(26,26,26,0.06)' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Profil en cours de validation</div>
          <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
            Votre profil a été transmis avec succès.<br />
            L&apos;équipe TEXTILE LOOP vérifie vos informations.<br />
            Votre compte sera associé prochainement à votre entreprise.<br /><br />
            Vous recevrez un email à <strong>{email}</strong><br />
            dès que votre accès sera activé.
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 6, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 16 }}>
            Cette vérification prend généralement moins de 24 heures ouvrées.
          </div>
          <div style={{ fontSize: 12, color: '#8b7355', marginBottom: 12 }}>
            Vérification automatique toutes les 10 secondes...
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 20px', borderRadius: 4, border: '1.5px solid #d4c5b0', background: '#f5f3ef', color: '#4a5568', fontSize: 12, cursor: 'pointer' }}>
            Se déconnecter
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#d4c5b0' }}>
          <a href="/mentions-legales" style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions légales &amp; RGPD</a>
          {' — '} TEXTILE LOOP © 2026
        </div>
      </div>
    </div>
  )
}



