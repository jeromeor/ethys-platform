'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SupprimerComptePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState('')

  const handleDelete = async () => {
    if (confirm !== 'SUPPRIMER') return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profils_utilisateurs').update({
        prenom: 'Compte', nom: 'Supprime',
        telephone: null, adresse_rue: null,
        adresse_ville: null, adresse_code_postal: null,
        statut: 'supprime'
      }).eq('id', user.id)
      await supabase.auth.signOut()
    }
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #fde8e8', padding: '32px 28px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#8b3a3a', marginBottom: 8 }}>Supprimer mon compte</div>
          <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.7, marginBottom: 20 }}>
            Cette action est <strong>irréversible</strong>. Vos données personnelles seront anonymisées conformément au RGPD. Les données liées à la traçabilité textile seront conservées pour des raisons légales.
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>
              Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :
            </label>
            <input
              type="text"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="SUPPRIMER"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 13, boxSizing: 'border-box' as const, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => router.back()}
              style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #d4c5b0', background: '#fff', color: '#4a5568', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={confirm !== 'SUPPRIMER' || loading}
              style={{ flex: 1, padding: '10px', borderRadius: 4, border: 'none', background: confirm === 'SUPPRIMER' ? '#8b3a3a' : '#e8e3d8', color: confirm === 'SUPPRIMER' ? '#fff' : '#8b7355', fontSize: 13, fontWeight: 600, cursor: confirm === 'SUPPRIMER' ? 'pointer' : 'default', fontFamily: 'inherit' }}
            >
              {loading ? 'Suppression...' : 'Confirmer la suppression'}
            </button>
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: '#8b7355', textAlign: 'center' }}>
            Pour toute question : <a href="mailto:contact@textile-loop.com" style={{ color: '#1a1a1a' }}>contact@textile-loop.com</a>
          </div>
        </div>
      </div>
    </div>
  )
}
