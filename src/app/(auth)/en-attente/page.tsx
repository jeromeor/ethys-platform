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
    <div style={{ minHeight: '100vh', background: '#F7F8FA', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <img src="/logo.png" alt="TEXTILE LOOP" style={{ width: 140, height: 'auto', margin: '0 auto 12px', display: 'block' }} />
        <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 32, textAlign: 'center' }}>Plateforme ETHYS</div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F3', padding: '40px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>⏳</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0A3D26', marginBottom: 12 }}>Profil en cours de validation</div>
          <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7, marginBottom: 24 }}>
            Votre profil a été soumis avec succès. L'équipe TEXTILE LOOP vérifie vos informations et associera votre compte à votre entreprise.<br /><br />
            Vous recevrez un email à <strong>{email}</strong> dès que votre accès sera activé.
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 24 }}>
            Cette vérification prend généralement moins de 24 heures ouvrées.
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>
            Vérification automatique toutes les 10 secondes...
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #EEF0F3', background: '#F8FAFC', color: '#64748B', fontSize: 12, cursor: 'pointer' }}>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}
