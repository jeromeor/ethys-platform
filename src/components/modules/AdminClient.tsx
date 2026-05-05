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

interface DemandeModification {
  id: string
  cible_user_id: string
  demandeur_id: string
  validateur_id: string | null
  nouveau_role: string
  nouveau_entreprise_id: string | null
  statut: string
  date_demande: string
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

const TABS = ['Utilisateurs', 'Demandes en attente', 'Securite']

export default function AdminClient({ utilisateurs: initial = [], audit = [], entreprises = [], currentUserId }: Props) {
  const supabase = createClient()
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(initial ?? [])
  const [activeTab, setActiveTab] = useState('Utilisateurs')
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null)
  const [demandes, setDemandes] = useState<DemandeModification[]>([])
  const [demandeForm, setDemandeForm] = useState({ role: '', entreprise_id: '' })
  const [showInvite, setShowInvite] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState('')
  const [params, setParams] = useState([
    { label: 'Authentification 2FA', actif: true },
    { label: 'Sessions auto-expirees', actif: true },
    { label: 'Chiffrement TLS 1.3', actif: true },
    { label: 'IP Whitelist Admin', actif: false },
    { label: 'Audit log complet', actif: true },
    { label: 'Backups AES-256', actif: true },
  ])

  const chargerDemandes = async () => {
    const { data } = await supabase
      .from('demandes_modification_droits')
      .select('*')
      .eq('statut', 'en_attente')
      .order('date_demande', { ascending: false })
    setDemandes(data ?? [])
    setActiveTab('Demandes en attente')
  }

  const toggleStatut = async (id: string) => {
    const user = utilisateurs.find(u => u.id === id)
    if (!user || id === currentUserId) return
    const newStatut = user.statut === 'actif' ? 'inactif' : 'actif'
    await supabase.from('profils_utilisateurs').update({ statut: newStatut }).eq('id', id)
    setUtilisateurs(prev => prev.map(u => u.id === id ? { ...u, statut: newStatut } : u))
  }

  const soumettreDemandeModification = async () => {
    if (!selectedUser || !demandeForm.role) return
    setSending(true)
    setMessage('')

    const { error } = await supabase
      .from('demandes_modification_droits')
      .insert({
        cible_user_id: selectedUser.id,
        demandeur_id: currentUserId,
        nouveau_role: demandeForm.role,
        nouveau_entreprise_id: demandeForm.entreprise_id || null,
        statut: 'en_attente',
      })

    if (!error) {
      setMessage('Demande soumise. Un second administrateur devra valider cette modification.')
      setSelectedUser(null)
    } else {
      setMessage('Erreur lors de la soumission.')
    }
    setSending(false)
  }

  const validerDemande = async (demande: DemandeModification) => {
    if (demande.demandeur_id === currentUserId) {
      setMessage('Vous ne pouvez pas valider votre propre demande.')
      return
    }
    setConfirming(true)

    await supabase.from('profils_utilisateurs').update({
      role: demande.nouveau_role,
      entreprise_id: demande.nouveau_entreprise_id,
    }).eq('id', demande.cible_user_id)

    await supabase.from('demandes_modification_droits').update({
      statut: 'valide',
      validateur_id: currentUserId,
      date_validation: new Date().toISOString(),
    }).eq('id', demande.id)

    setUtilisateurs(prev => prev.map(u =>
      u.id === demande.cible_user_id ? { ...u, role: demande.nouveau_role } : u
    ))
    setDemandes(prev => prev.filter(d => d.id !== demande.id))
    setConfirming(false)
  }

  const refuserDemande = async (demandeId: string) => {
    await supabase.from('demandes_modification_droits').update({
      statut: 'refuse',
      validateur_id: currentUserId,
      date_validation: new Date().toISOString(),
    }).eq('id', demandeId)
    setDemandes(prev => prev.filter(d => d.id !== demandeId))
  }

  const secScore = Math.round(params.filter(p => p.actif).length / params.length * 100)
  const nbActifs = (utilisateurs ?? []).filter(u => u.statut === 'actif').length
  const nbAlertes = (audit ?? []).filter(a => a.niveau === 'alert').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '14px 22px', flexShrink: 0 }}>
        {[
          { label: 'Utilisateurs actifs', value: String(nbActifs), bg: '#D1FAE5', tc: '#065F46' },
          { label: 'Alertes securite', value: String(nbAlertes), bg: nbAlertes > 0 ? '#FEE2E2' : '#F1F5F9', tc: nbAlertes > 0 ? '#991B1B' : '#475569' },
          { label: 'Conformite RGPD', value: '100%', bg: '#F0FDF4', tc: '#065F46' },
          { label: 'Score securite', value: secScore + '%', bg: '#DBEAFE', tc: '#1E40AF' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #EEF0F3', padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0A3D26' }}>{k.value}</div>
          </div>
        ))}
{showInvite && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowInvite(false)}>
    <div style={{ background: '#fff', borderRadius: 16, padding: '26px 30px', width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#0A3D26' }}>Inviter un utilisateur</span>
        <button onClick={() => setShowInvite(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer' }}>x</button>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Email</label>
        <input type="email" placeholder="julie@entreprise.fr" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#1A202C' }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Role</label>
        <select style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none' }}>
          {['marque', 'filature', 'fournisseur', 'admin'].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setShowInvite(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #EEF0F3', background: '#F8FAFC', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
        <button onClick={() => setShowInvite(false)} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Envoyer invitation</button>
      </div>
    </div>
  </div>
)}
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid #EEF0F3', padding: '0 22px', background: '#fff', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => { setActiveTab(t); if (t === 'Demandes en attente') chargerDemandes() }} style={{
            padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === t ? 700 : 500,
            color: activeTab === t ? '#0A3D26' : '#94A3B8',
            borderBottom: activeTab === t ? '2px solid #0A3D26' : '2px solid transparent',
            marginBottom: -2
          }}>{t}</button>
        ))}
      </div>
<div style={{ flex: 1 }} />
<button onClick={() => setShowInvite(true)} style={{ margin: '8px 0', padding: '6px 14px', borderRadius: 8, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Inviter</button>

      {message && (
        <div style={{ margin: '12px 22px 0', padding: '10px 14px', borderRadius: 8, background: message.includes('Erreur') ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${message.includes('Erreur') ? '#FCA5A5' : '#A7F3D0'}`, fontSize: 12, color: message.includes('Erreur') ? '#DC2626' : '#065F46' }}>
          {message}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>

        {activeTab === 'Utilisateurs' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Email', 'Role', 'Entreprise', 'Statut', 'Derniere connexion', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((u, i) => {
                  const [rbg, rtc] = ROLE_COLORS[u.role] ?? ['#F1F5F9', '#475569']
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600 }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: rbg, color: rtc }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#475569' }}>{u.entreprise?.nom ?? '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: u.statut === 'actif' ? '#D1FAE5' : '#F1F5F9', color: u.statut === 'actif' ? '#065F46' : '#94A3B8' }}>{u.statut}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: '#94A3B8' }}>
                        {u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setSelectedUser(u); setDemandeForm({ role: u.role, entreprise_id: u.entreprise_id ?? '' }); setMessage('') }} style={{ padding: '4px 10px', borderRadius: 7, border: '1.5px solid #EEF0F3', background: '#F8FAFC', fontSize: 11, cursor: 'pointer' }}>
                            Modifier droits
                          </button>
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

        {activeTab === 'Demandes en attente' && (
          <div>
            {demandes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>v</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune demande en attente</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Toutes les modifications de droits ont ete traitees.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {demandes.map((d, i) => {
                  const cible = utilisateurs.find(u => u.id === d.cible_user_id)
                  const demandeur = utilisateurs.find(u => u.id === d.demandeur_id)
                  const estMaDemande = d.demandeur_id === currentUserId
                  const [rbg, rtc] = ROLE_COLORS[d.nouveau_role] ?? ['#F1F5F9', '#475569']
                  return (
                    <div key={i} style={{ background: '#fff', borderRadius: 14, border: `2px solid ${estMaDemande ? '#EEF0F3' : '#D1FAE5'}`, padding: '18px 22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>
                            Modification droits — {cible?.email ?? d.cible_user_id}
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>
                            Demande par {demandeur?.email ?? 'Admin'} · {new Date(d.date_demande).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        {estMaDemande && (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: '#FEF3C7', color: '#92400E' }}>
                            Votre demande
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                        <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #EEF0F3' }}>
                          <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4 }}>Role actuel</div>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ROLE_COLORS[cible?.role ?? 'marque']?.[0], color: ROLE_COLORS[cible?.role ?? 'marque']?.[1] }}>
                            {cible?.role ?? '-'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 18, color: '#94A3B8' }}>→</div>
                        <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #A7F3D0' }}>
                          <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4 }}>Nouveau role</div>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: rbg, color: rtc }}>
                            {d.nouveau_role}
                          </span>
                        </div>
                      </div>
                      {estMaDemande ? (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E' }}>
                          En attente de validation par un autre administrateur. Vous ne pouvez pas valider votre propre demande.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => refuserDemande(d.id)} style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Refuser
                          </button>
                          <button onClick={() => validerDemande(d)} disabled={confirming} style={{ flex: 2, padding: '9px', borderRadius: 10, border: 'none', background: confirming ? '#E2E8F0' : '#0A3D26', color: confirming ? '#94A3B8' : '#fff', fontSize: 12, fontWeight: 700, cursor: confirming ? 'default' : 'pointer' }}>
                            {confirming ? 'Validation...' : 'Valider la modification'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Securite' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '20px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 14 }}>Parametres</div>
              {params.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < params.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{p.label}</span>
                  <div onClick={() => setParams(prev => prev.map((x, j) => j === i ? { ...x, actif: !x.actif } : x))} style={{ width: 38, height: 20, borderRadius: 10, cursor: 'pointer', background: p.actif ? '#0A3D26' : '#CBD5E1', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: p.actif ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '20px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 14 }}>Journal audit recent</div>
              {audit.slice(0, 10).map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #F8FAFC', fontSize: 11 }}>
                  <span style={{ color: ev.niveau === 'alert' ? '#DC2626' : '#94A3B8', flexShrink: 0 }}>
                    {ev.niveau === 'alert' ? '!' : 'i'}
                  </span>
                  <span style={{ flex: 1, color: '#475569' }}>{ev.action}</span>
                  <span style={{ color: '#CBD5E1' }}>{new Date(ev.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              ))}
              {audit.length === 0 && <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '20px' }}>Aucune entree</div>}
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setSelectedUser(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '26px 30px', width: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0A3D26' }}>Modifier les droits</span>
              <button onClick={() => setSelectedUser(null)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer' }}>x</button>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 16 }}>
              Cette modification necessite la validation d'un second administrateur avant d'etre appliquee.
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
              Utilisateur : <strong>{selectedUser.email}</strong>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Nouveau role</label>
              <select value={demandeForm.role} onChange={e => setDemandeForm(f => ({ ...f, role: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none' }}>
                {['admin', 'marque', 'filature', 'fournisseur'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Entreprise associee</label>
              <select value={demandeForm.entreprise_id} onChange={e => setDemandeForm(f => ({ ...f, entreprise_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none' }}>
                <option value="">Aucune</option>
                {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelectedUser(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #EEF0F3', background: '#F8FAFC', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button onClick={soumettreDemandeModification} disabled={sending} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: sending ? '#E2E8F0' : '#0A3D26', color: sending ? '#94A3B8' : '#fff', fontSize: 13, fontWeight: 700, cursor: sending ? 'default' : 'pointer' }}>
                {sending ? 'Envoi...' : 'Soumettre la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
