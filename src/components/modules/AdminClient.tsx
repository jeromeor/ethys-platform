'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Utilisateur {
  id: string
  email: string
  role: string
  statut: string
  entreprise_id: string | null
  created_at: string
  derniere_connexion: string | null
  entreprise: { nom: string; type: string } | null
}

interface AuditEntry {
  id: string
  user_email: string | null
  action: string
  cible: string | null
  ip_address: string | null
  niveau: string
  created_at: string
}

interface Entreprise {
  id: string
  nom: string
  type: string
  statut: string
}

interface Props {
  utilisateurs: Utilisateur[]
  audit: AuditEntry[]
  entreprises: Entreprise[]
  currentUserId: string
}

const ROLE_COLORS: Record<string, [string, string]> = {
  admin:       ['#F3E8FF', '#6B21A8'],
  marque:      ['#DBEAFE', '#1E40AF'],
  filature:    ['#D1FAE5', '#065F46'],
  fournisseur: ['#FEF3C7', '#92400E'],
}

const NIVEAU_STYLE: Record<string, { bg: string; tc: string; icon: string }> = {
  info:    { bg: '#EFF6FF', tc: '#2563EB', icon: 'ℹ' },
  warning: { bg: '#FFFBEB', tc: '#D97706', icon: '⚠' },
  alert:   { bg: '#FEF2F2', tc: '#DC2626', icon: '✕' },
}

const TABS = ['Utilisateurs', 'Rôles & Droits', 'Journal d\'audit', 'Sécurité']

const ROLES_DEF = [
  {
    role: 'admin', couleur: '#6B21A8', bg: '#F3E8FF',
    desc: 'Accès total à toutes les fonctionnalités.',
    permissions: ['Dashboard', 'Profil', 'Annuaire', 'Messagerie', 'Commandes', 'Production', 'QR Code', 'Facturation', 'Reporting', 'ESG', 'Administration'],
  },
  {
    role: 'marque', couleur: '#1E40AF', bg: '#DBEAFE',
    desc: 'Accès aux commandes, suivi et reporting ESG.',
    permissions: ['Dashboard', 'Profil', 'Annuaire', 'Messagerie', 'Commandes', 'Production (lecture)', 'QR Code (lecture)', 'Reporting ESG'],
  },
  {
    role: 'filature', couleur: '#065F46', bg: '#D1FAE5',
    desc: 'Accès aux commandes assignées et production.',
    permissions: ['Dashboard', 'Profil', 'Messagerie', 'Commandes (assignées)', 'Production', 'QR Code'],
  },
  {
    role: 'fournisseur', couleur: '#92400E', bg: '#FEF3C7',
    desc: 'Accès limité aux commandes et messagerie.',
    permissions: ['Dashboard', 'Profil', 'Messagerie', 'Commandes (validation)'],
  },
]

export default function AdminClient({ utilisateurs: initial = [], audit = [], entreprises = [], currentUserId }: Props) {
  const supabase = createClient()
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(initial ?? [])
  const [activeTab, setActiveTab] = useState('Utilisateurs')
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null)
  const [inviteModal, setInviteModal] = useState(false)
  const [params, setParams] = useState([
    { label: 'Authentification 2FA', actif: true, desc: 'Obligatoire pour les comptes Admin' },
    { label: 'Sessions auto-expirées (8h)', actif: true, desc: 'Déconnexion après inactivité' },
    { label: 'Chiffrement TLS 1.3', actif: true, desc: 'Toutes les communications API' },
    { label: 'IP Whitelist Admin', actif: false, desc: 'Restreindre l\'accès Admin par IP' },
    { label: 'Audit log complet', actif: true, desc: 'Toutes les actions journalisées' },
    { label: 'Backups chiffrés AES-256', actif: true, desc: 'Sauvegarde quotidienne' },
  ])

  'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (password.length < 8) { setError('8 caractères minimum'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F7F8FA',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#0A3D26', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 auto 12px' }}>T</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0A3D26' }}>TEXTILE LOOP</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F3', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0A3D26' }}>Mot de passe mis à jour</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>Redirection en cours…</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1A202C', marginBottom: 20 }}>Nouveau mot de passe</div>
              <form onSubmit={handleReset}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Nouveau mot de passe</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="8 caractères minimum" required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Confirmer le mot de passe</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626', marginBottom: 14 }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: loading ? '#E2E8F0' : '#0A3D26', color: loading ? '#94A3B8' : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
                  {loading ? 'Mise à jour…' : 'Définir le nouveau mot de passe'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}