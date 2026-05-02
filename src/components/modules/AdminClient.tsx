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
  info:    { bg: '#EFF6FF', tc: '#2563EB', icon: 'i' },
  warning: { bg: '#FFFBEB', tc: '#D97706', icon: '!' },
  alert:   { bg: '#FEF2F2', tc: '#DC2626', icon: 'x' },
}

const TABS = ['Utilisateurs', 'Roles et Droits', "Journal d'audit", 'Securite']

const ROLES_DEF = [
  {
    role: 'admin', couleur: '#6B21A8', bg: '#F3E8FF',
    desc: 'Acces total a toutes les fonctionnalites.',
    permissions: ['Dashboard', 'Profil', 'Annuaire', 'Messagerie', 'Commandes', 'Production', 'QR Code', 'Facturation', 'Reporting', 'ESG', 'Administration'],
  },
  {
    role: 'marque', couleur: '#1E40AF', bg: '#DBEAFE',
    desc: 'Acces aux commandes, suivi et reporting ESG.',
    permissions: ['Dashboard', 'Profil', 'Annuaire', 'Messagerie', 'Commandes', 'Production lecture', 'QR Code lecture', 'Reporting ESG'],
  },
  {
    role: 'filature', couleur: '#065F46', bg: '#D1FAE5',
    desc: 'Acces aux commandes assignees et production.',
    permissions: ['Dashboard', 'Profil', 'Messagerie', 'Commandes assignees', 'Production', 'QR Code'],
  },
  {
    role: 'fournisseur', couleur: '#92400E', bg: '#FEF3C7',
    desc: 'Acces limite aux commandes et messagerie.',
    permissions: ['Dashboard', 'Profil', 'Messagerie', 'Commandes validation'],
  },
]

]export default function AdminClient({ utilisateurs: initial = [], audit = [], entreprises = [], currentUserId }: Props) {
  const supabase = createClient()
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(initial ?? [])
  const [activeTab, setActiveTab] = useState('Utilisateurs')
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null)
  const [inviteModal, setInviteModal] = useState(false)
  const [params, setParams] = useState([
    { label: 'Authentification 2FA', actif: true, desc: 'Obligatoire pour les comptes Admin' },
    { label: 'Sessions auto-expirees', actif: true, desc: 'Deconnexion apres inactivite' },
    { label: 'Chiffrement TLS 1.3', actif: true, desc: 'Toutes les communications API' },
    { label: 'IP Whitelist Admin', actif: false, desc: 'Restreindre acces Admin par IP' },
    { label: 'Audit log complet', actif: true, desc: 'Toutes les actions journalisees' },
    { label: 'Backups AES-256', actif: true, desc: 'Sauvegarde quotidienne' },
  ])

  const toggleStatut = async (id: string) => {
    const user = utilisateurs.find(u => u.id === id)
    if (!user || id === currentUserId) return
    const newStatut = user.statut === 'actif' ? 'inactif' : 'actif'
    await supabase.from('profils_utilisateurs').update({ statut: newStatut }).eq('id', id)
    setUtilisateurs(prev => prev.map(u => u.id === id ? { ...u, statut: newStatut } : u))
  }

  const updateRole = async (id: string, role: string) => {
    await supabase.from('profils_utilisateurs').update({ role }).eq('id', id)
    setUtilisateurs(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    if (selectedUser?.id === id) setSelectedUser(prev => prev ? { ...prev, role } : null)
  }

  const updateEntreprise = async (userId: string, entrepriseId: string) => {
    await supabase.from('profils_utilisateurs').update({ entreprise_id: entrepriseId || null }).eq('id', userId)
    const ent = entreprises.find(e => e.id === entrepriseId) ?? null
    setUtilisateurs(prev => prev.map(u => u.id === userId ? { ...u, entreprise_id: entrepriseId, entreprise: ent ? { nom: ent.nom, type: ent.type } : null } : u))
  }

  const secScore = Math.round(params.filter(p => p.actif).length / params.length * 100)
  const nbActifs = (utilisateurs ?? []).filter(u => u.statut === 'actif').length
  const nbAlertes = (audit ?? []).filter(a => a.niveau === 'alert').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '14px 22px', flexShrink: 0 }}>
        {[
          { label: 'Utilisateurs actifs', value: `${nbActifs}`, icon: 'o', bg: '#D1FAE5', tc: '#065F46' },
          { label: 'Alertes securite', value: `${nbAlertes}`, icon: '!', bg: nbAlertes > 0 ? '#FEE2E2' : '#F1F5F9', tc: nbAlertes > 0 ? '#991B1B' : '#475569' },
          { label: 'Conformite RGPD', value: '100%', icon: 'v', bg: '#F0FDF4', tc: '#065F46' },
          { label: 'Score securite', value: `${secScore}%`, icon: 's', bg: '#DBEAFE', tc: '#1E40AF' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #EEF0F3', padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0A3D26' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid #EEF0F3', padding: '0 22px', flexShrink: 0, background: '#fff' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === t ? 700 : 500,
            color: activeTab === t ? '#0A3D26' : '#94A3B8',
            borderBottom: activeTab === t ? '2px solid #0A3D26' : '2px solid transparent',
            marginBottom: -2
          }}>{t}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setInviteModal(true)} style={{ margin: '8px 0', padding: '6px 14px', borderRadius: 8, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Inviter</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>

        {activeTab === 'Utilisateurs' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Utilisateur', 'Role', 'Entreprise', 'Statut', 'Derniere connexion', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((u, i) => {
                  const [rbg, rtc] = ROLE_COLORS[u.role] ?? ['#F1F5F9', '#475569']
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: rbg, color: rtc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                            {u.email.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{u.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: rbg, color: rtc }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#475569' }}>{u.entreprise?.nom ?? '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: u.statut === 'actif' ? '#D1FAE5' : '#F1F5F9', color: u.statut === 'actif' ? '#065F46' : '#94A3B8' }}>
                          {u.statut}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: '#94A3B8' }}>
                        {u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setSelectedUser(u)} style={{ padding: '4px 10px', borderRadius: 7, border: '1.5px solid #EEF0F3', background: '#F8FAFC', fontSize: 11, cursor: 'pointer' }}>Droits</button>
                          {u.id !== currentUserId && (
                            <button onClick={() => toggleStatut(u.id)} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: u.statut === 'actif' ? '#FEE2E2' : '#D1FAE5', color: u.statut === 'actif' ? '#DC2626' : '#065F46', fontSize: 11, cursor: 'pointer' }}>
                              {u.statut === 'actif' ? 'Desactiver' : 'Activer'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Roles et Droits' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {ROLES_DEF.map((r, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: r.bg, color: r.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
                    {r.role[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1A202C', textTransform: 'capitalize' }}>{r.role}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{utilisateurs.filter(u => u.role === r.role).length} utilisateur(s)</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>{r.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {r.permissions.map((p, j) => (
                    <span key={j} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: r.bg, color: r.couleur }}>v {p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Journal d'audit" && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Niveau', 'Utilisateur', 'Action', 'Cible', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audit.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Aucune entree</td></tr>
                ) : audit.map((ev, i) => {
                  const ns = NIVEAU_STYLE[ev.niveau] ?? NIVEAU_STYLE.info
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ width: 24, height: 24, borderRadius: 6, background: ns.bg, color: ns.tc, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{ns.icon}</span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 11 }}>{ev.user_email ?? 'Systeme'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 11, color: '#475569' }}>{ev.action}</td>
                      <td style={{ padding: '11px 14px', fontSize: 11, color: '#64748B' }}>{ev.cible ?? '-'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 10, color: '#94A3B8' }}>
                        {new Date(ev.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Securite' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '20px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 14 }}>Parametres de securite</div>
              {params.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < params.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.desc}</div>
                  </div>
                  <div onClick={() => setParams(prev => prev.map((x, j) => j === i ? { ...x, actif: !x.actif } : x))} style={{ width: 38, height: 20, borderRadius: 10, cursor: 'pointer', background: p.actif ? '#0A3D26' : '#CBD5E1', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: p.actif ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: '#0A3D26' }}>Score securite</span>
                  <span style={{ fontWeight: 800 }}>{secScore}%</span>
                </div>
                <div style={{ height: 5, background: '#E2E8F0', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${secScore}%`, background: 'linear-gradient(90deg,#10B981,#0A3D26)', borderRadius: 3 }} />
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '20px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 14 }}>Conformite RGPD</div>
              {[
                ['Politique de confidentialite', 'A jour'],
                ['Registre des traitements', 'A jour'],
                ['Consentements utilisateurs', '100% collectes'],
                ['DPO designe', 'Oui'],
                ['Chiffrement donnees', 'AES-256 actif'],
                ['Duree conservation', '3 ans'],
                ['Droit a oubli', 'Documente'],
                ['Transferts hors UE', 'Clauses contractuelles'],
              ].map(([label, statut], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #A7F3D0', marginBottom: 6 }}>
                  <span style={{ color: '#10B981', fontSize: 12 }}>v</span>
                  <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 11, color: '#065F46' }}>{statut}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setSelectedUser(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '26px 30px', width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0A3D26' }}>Droits — {selectedUser.email}</span>
              <button onClick={() => setSelectedUser(null)} style={{ border: 'none', background: 'none', fontSize: 18, color: '#94A3B8', cursor: 'pointer' }}>x</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Role</label>
              <select value={selectedUser.role} onChange={e => updateRole(selectedUser.id, e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none' }}>
                {['admin', 'marque', 'filature', 'fournisseur'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Entreprise associee</label>
              <select value={selectedUser.entreprise_id ?? ''} onChange={e => updateEntreprise(selectedUser.id, e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none' }}>
                <option value="">Aucune</option>
                {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
            </div>
            <button onClick={() => setSelectedUser(null)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Sauvegarder
            </button>
          </div>
        </div>
      )}

      {inviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setInviteModal(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '26px 30px', width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0A3D26' }}>Inviter un utilisateur</span>
              <button onClick={() => setInviteModal(false)} style={{ border: 'none', background: 'none', fontSize: 18, color: '#94A3B8', cursor: 'pointer' }}>x</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" placeholder="julie@entreprise.fr" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Role</label>
              <select style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none' }}>
                {['marque', 'filature', 'fournisseur', 'admin'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setInviteModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #EEF0F3', background: '#F8FAFC', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => setInviteModal(false)} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Envoyer invitation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}