'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Utilisateur {
  id: string
  email: string
  nom: string | null
  prenom: string | null
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

interface Royalty {
  id: string
  facture_id: string
  filature_id: string
  marque_id: string
  montant_ht_facture: number
  taux_royalty: number
  montant_royalty: number
  interets_retard: number
  montant_total_du: number
  statut: string
  date_facture: string
  date_encaissement: string | null
  date_echeance: string | null
  date_limite_contestation: string | null
  created_at: string
  filature: { nom: string } | null
  marque: { nom: string } | null
  facture: { reference: string } | null
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
  royalties: Royalty[]
  currentUserId: string
}

const ROLE_COLORS: Record<string, [string, string]> = {
  admin:       ['#F3E8FF', '#6B21A8'],
  marque:      ['#DBEAFE', '#1E40AF'],
  filature:    ['#f0f4ec', '#2d5016'],
  fournisseur: ['#fdf8ec', '#b8860b'],
}

const TABS = ['Utilisateurs', 'Comptes à valider', 'Demandes en attente', 'Export commandes', 'Royalties filatures', 'Sécurité']

export default function AdminClient({ utilisateurs: initial = [], audit = [], entreprises = [], royalties = [], currentUserId }: Props) {
  const supabase = createClient()
  const [filtreEntreprise, setFiltreEntreprise] = useState('')
  const [filtreDateDebut, setFiltreDateDebut] = useState('')
  const [filtreDateFin, setFiltreDateFin] = useState('')
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>((initial ?? []).slice().sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? '')))
  const [activeTab, setActiveTab] = useState('Utilisateurs')
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null)
  const [demandes, setDemandes] = useState<DemandeModification[]>([])
  const [demandeForm, setDemandeForm] = useState({ role: '', entreprise_id: '' })
  const [showInvite, setShowInvite] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState('')
  const [exportDateDebut, setExportDateDebut] = useState('')
  const [exportDateFin, setExportDateFin]     = useState('')
  const [exportClient, setExportClient]       = useState('')
  const [exportZone, setExportZone]           = useState('')
  const [exporting, setExporting]             = useState(false)
  const [royaltyFiltre, setRoyaltyFiltre] = useState('')
  const [royaltyDateDebut, setRoyaltyDateDebut] = useState('')
  const [royaltyDateFin, setRoyaltyDateFin] = useState('')
  const [exportingRoyalties, setExportingRoyalties] = useState(false)

  const exportRoyaltiesExcel = async () => {
    setExportingRoyalties(true)
    try {
      // Chargement dynamique de SheetJS
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs' as any)
      
      const royaltiesFiltrees = royalties.filter(r =>
        !royaltyFiltre || r.filature?.nom?.toLowerCase().includes(royaltyFiltre.toLowerCase())
      )

      // Lignes détail
      const lignes = royaltiesFiltrees.map(r => ({
        'Référence facture':     r.facture?.reference ?? '-',
        'Filature':              r.filature?.nom ?? '-',
        'Marque':                r.marque?.nom ?? '-',
        'Date facture':          r.date_facture ?? '-',
        'Date encaissement':     r.date_encaissement ?? '-',
        'Date échéance royalty': r.date_echeance ?? '-',
        'Montant HT facture':    Number(r.montant_ht_facture),
        'Taux royalty':          '1%',
        'Montant royalty (€)':   Number(r.montant_royalty),
        'Intérêts retard (€)':   Number(r.interets_retard),
        'Total dû (€)':          Number(r.montant_total_du),
        'Statut':                r.statut,
      }))

      // Ligne cumul par filature
      const cumuls = Object.values(
        royaltiesFiltrees.reduce((acc, r) => {
          const nom = r.filature?.nom ?? 'Inconnu'
          if (!acc[nom]) acc[nom] = { filature: nom, total_royalty: 0, total_du: 0, nb: 0 }
          acc[nom].total_royalty += Number(r.montant_royalty)
          acc[nom].total_du     += Number(r.montant_total_du)
          acc[nom].nb           += 1
          return acc
        }, {} as Record<string, { filature: string; total_royalty: number; total_du: number; nb: number }>)
      ).map(c => ({
        'Filature':              c.filature,
        'Nb relevés':            c.nb,
        'Total royalties (€)':   c.total_royalty,
        'Total dû avec intérêts (€)': c.total_du,
      }))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lignes),  'Détail')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cumuls), 'Cumul par filature')
      XLSX.writeFile(wb, `royalties_filatures_${new Date().toISOString().slice(0,10)}.xlsx`)
    } catch (e) {
      alert('Erreur export Excel')
    }
    setExportingRoyalties(false)
  }

  const marquerRoyaltyPayee = async (id: string) => {
    await supabase.from('royalties_filatures').update({ statut: 'payé' }).eq('id', id)
    window.location.reload()
  }

  // États pour la création de nouvelle entreprise dans "Comptes à valider"
  const [nouvelleEntrepriseNom, setNouvelleEntrepriseNom] = useState<Record<string, string>>({})
  const [nouvelleEntrepriseType, setNouvelleEntrepriseType] = useState<Record<string, string>>({})
  const [createMode, setCreateMode] = useState<Record<string, boolean>>({})

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
    const action = user.statut === 'actif' ? 'désactiver' : 'réactiver'
    const confirm = window.confirm(`Voulez-vous vraiment ${action} le compte ${user.email} ?`)
    if (!confirm) return
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

  const exportCommandes = async () => {
    setExporting(true)
    const p = new URLSearchParams()
    if (exportDateDebut) p.set('date_debut', exportDateDebut)
    if (exportDateFin)   p.set('date_fin',   exportDateFin)
    if (exportClient)    p.set('client',      exportClient)
    if (exportZone)      p.set('zone',        exportZone)
    const res = await fetch('/api/commandes?' + p.toString())
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `commandes_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const secScore = Math.round(params.filter(p => p.actif).length / params.length * 100)
  const nbActifs = (utilisateurs ?? []).filter(u => u.statut === 'actif').length
  const nbAlertes = (audit ?? []).filter(a => a.niveau === 'alert').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '6px 22px', flexShrink: 0 }}>
        {[
          { label: 'Utilisateurs actifs', value: String(nbActifs), bg: '#f0f4ec', tc: '#2d5016' },
          { label: 'Alertes Sécurité', value: String(nbAlertes), bg: nbAlertes > 0 ? '#FEE2E2' : '#f5f3ef', tc: nbAlertes > 0 ? '#991B1B' : '#4a5568' },
          { label: 'Conformité RGPD', value: '100%', bg: '#F0FDF4', tc: '#2d5016' },
          { label: 'Score Sécurité', value: secScore + '%', bg: '#DBEAFE', tc: '#1E40AF' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 4, border: '1px solid #e8e3d8', padding: '8px 12px' }}>
            <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 2 }}>{k.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>{k.value}</div>
          </div>
        ))}

        {showInvite && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowInvite(false)}>
            <div style={{ background: '#fff', borderRadius: 8, padding: '26px 30px', width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Inviter un utilisateur</span>
                <button onClick={() => setShowInvite(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer' }}>x</button>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Email</label>
                <input type="email" placeholder="julie@entreprise.fr" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, boxSizing: 'border-box', outline: 'none', color: '#1A202C' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Role</label>
                <select style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, outline: 'none' }}>
                  {['marque', 'filature', 'fournisseur', 'admin'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowInvite(false)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#8b7355', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => setShowInvite(false)} style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Envoyer invitation</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid #e8e3d8', padding: '0 22px', background: '#fff', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => { setActiveTab(t); if (t === 'Demandes en attente') chargerDemandes() }} style={{
            padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === t ? 700 : 500,
            color: activeTab === t ? '#1a1a1a' : '#8b7355',
            borderBottom: activeTab === t ? '2px solid #1a1a1a' : '2px solid transparent',
            marginBottom: -2
          }}>
            {t}
            {t === 'Comptes à valider' && utilisateurs.filter(u => !u.entreprise_id && u.role !== 'admin').length > 0 && (
              <span style={{ marginLeft: 6, background: '#EF4444', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {utilisateurs.filter(u => !u.entreprise_id && u.role !== 'admin').length}
              </span>
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowInvite(true)} style={{ margin: '4px 0', padding: '5px 12px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'center' }}>+ Inviter</button>
      </div>

      {message && (
        <div style={{ margin: '12px 22px 0', padding: '10px 14px', borderRadius: 8, background: message.includes('Erreur') ? '#fdf0f0' : '#F0FDF4', border: `1px solid ${message.includes('Erreur') ? '#c8a0a0' : '#c8d8b8'}`, fontSize: 12, color: message.includes('Erreur') ? '#8b3a3a' : '#2d5016' }}>
          {message}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>

        {activeTab === 'Utilisateurs' && (
          <>
            <div style={{ padding: '12px 22px', borderBottom: '1px solid #e8e3d8', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={filtreEntreprise} onChange={e => setFiltreEntreprise(e.target.value)} style={{ padding: '6px 12px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 12, color: '#1a1a1a', background: '#fff' }}>
                <option value=''>Toutes les entreprises</option>
                {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
              <input type="date" value={filtreDateDebut} onChange={e => setFiltreDateDebut(e.target.value)} style={{ padding: '6px 10px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }} />
              <span style={{ fontSize: 12, color: '#8b7355' }}>au</span>
              <input type="date" value={filtreDateFin} onChange={e => setFiltreDateFin(e.target.value)} style={{ padding: '6px 10px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }} />
              {(filtreDateDebut || filtreDateFin) && (
                <button onClick={() => { setFiltreDateDebut(''); setFiltreDateFin('') }} style={{ padding: '6px 10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', fontSize: 11, color: '#8b7355', cursor: 'pointer' }}>
                  Reinitialiser
                </button>
              )}
            </div>
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f3ef' }}>
                    {['Nom', 'Prénom', 'Email', 'Role', 'Entreprise', 'Statut', 'Dernière connexion', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#8b7355', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {utilisateurs.filter(u => {
                    if (filtreEntreprise && u.entreprise_id !== filtreEntreprise) return false
                    if (filtreDateDebut && new Date(u.created_at) < new Date(filtreDateDebut)) return false
                    if (filtreDateFin && new Date(u.created_at) > new Date(filtreDateFin)) return false
                    return true
                  }).map((u, i) => {
                    const [rbg, rtc] = ROLE_COLORS[u.role] ?? ['#f5f3ef', '#4a5568']
                    return (
                      <tr key={i} style={{ borderTop: '1px solid #f5f3ef' }}>
                        <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600 }}>{u.nom?.toUpperCase() ?? '-'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12 }}>{u.prenom ?? '-'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600 }}><a href={"mailto:" + u.email} style={{ color: '#1a1a1a', textDecoration: 'none' }}>{u.email}</a></td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: rbg, color: rtc }}>{u.role}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#4a5568' }}>{u.entreprise?.nom ?? '-'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: u.statut === 'actif' ? '#f0f4ec' : '#f5f3ef', color: u.statut === 'actif' ? '#2d5016' : '#8b7355' }}>{u.statut}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 11, color: '#8b7355' }}>
                          {u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR') + ' ' + new Date(u.derniere_connexion).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) : '-'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setSelectedUser(u); setDemandeForm({ role: u.role, entreprise_id: u.entreprise_id ?? '' }); setMessage('') }} style={{ padding: '4px 10px', borderRadius: 7, border: '1.5px solid #e8e3d8', background: '#f5f3ef', fontSize: 11, cursor: 'pointer' }}>
                              Modifier droits
                            </button>
                            {u.id !== currentUserId && (
                              <button onClick={() => toggleStatut(u.id)} style={{ padding: '4px 10px', borderRadius: 7, border: 'none', background: u.statut === 'actif' ? '#FEE2E2' : '#f0f4ec', color: u.statut === 'actif' ? '#8b3a3a' : '#2d5016', fontSize: 11, cursor: 'pointer' }}>
                                {u.statut === 'actif' ? 'Désactiver' : 'Activer'}
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
          </>
        )}

        {activeTab === 'Comptes à valider' && (
          <div>
            {utilisateurs.filter(u => !u.entreprise_id && u.role !== 'admin').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#8b7355' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}></div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun compte en attente</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Tous les comptes sont validés.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {utilisateurs.filter(u => !u.entreprise_id && u.role !== 'admin').map((u, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 8, border: '2px solid #b8860b', padding: '18px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>{u.email}</div>
                        <div style={{ fontSize: 11, color: '#8b7355' }}>Rôle : {u.role} · Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#fdf8ec', color: '#b8860b' }}>En attente</span>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>Associer à une entreprise :</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <select
                            id={`select-${u.id}`}
                            onChange={e => setCreateMode(prev => ({ ...prev, [u.id]: e.target.value === '__new__' }))}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }}
                          >
                            <option value="">Sélectionner une entreprise...</option>
                            {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom} ({e.type})</option>)}
                            <option value="__new__">+ Créer une nouvelle entreprise</option>
                          </select>
                          {createMode[u.id] && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                type="text"
                                placeholder="Nom de l'entreprise"
                                value={nouvelleEntrepriseNom[u.id] ?? ''}
                                onChange={e => setNouvelleEntrepriseNom(prev => ({ ...prev, [u.id]: e.target.value }))}
                                style={{ flex: 2, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }}
                              />
                              <select
                                value={nouvelleEntrepriseType[u.id] ?? 'filature'}
                                onChange={e => setNouvelleEntrepriseType(prev => ({ ...prev, [u.id]: e.target.value }))}
                                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }}
                              >
                                {['marque', 'filature', 'fournisseur_coton', 'fournisseur'].map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            const sel = document.getElementById(`select-${u.id}`) as HTMLSelectElement
                            let entrepriseId = sel?.value
                            if (!entrepriseId) return

                            // Créer une nouvelle entreprise si demandé
                            if (entrepriseId === '__new__') {
                              const nom = nouvelleEntrepriseNom[u.id]?.trim()
                              if (!nom) { alert("Veuillez saisir un nom d'entreprise."); return }
                              const type = nouvelleEntrepriseType[u.id] ?? 'filature'
                              const { data: newEnt, error } = await supabase
                                .from('entreprises')
                                .insert({ nom, type, statut: 'actif' })
                                .select('id')
                                .single()
                              if (error || !newEnt) { alert('Erreur création entreprise : ' + error?.message); return }
                              entrepriseId = newEnt.id
                            }

                            const entreprise = entreprises.find(e => e.id === entrepriseId)
                            const nomAffiche = entreprise?.nom ?? nouvelleEntrepriseNom[u.id] ?? entrepriseId
                            if (!window.confirm('Première confirmation : associer ' + u.email + ' avec ' + nomAffiche + ' ?')) return
                            if (!window.confirm('Deuxième confirmation : cette action est immédiate et donnera accès complet à ' + u.email + '. Continuer ?')) return
                            await supabase.from('profils_utilisateurs').update({ entreprise_id: entrepriseId }).eq('id', u.id)
                            window.location.reload()
                          }}
                          style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start' }}
                        >
                          Valider
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#8b7355' }}>
                      L'association sera immédiate. Le compte aura accès complet après validation.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Demandes en attente' && (
          <div>
            {demandes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#8b7355' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>v</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune demande en attente</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Toutes les modifications de droits ont été traitées.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {demandes.map((d, i) => {
                  const cible = utilisateurs.find(u => u.id === d.cible_user_id)
                  const demandeur = utilisateurs.find(u => u.id === d.demandeur_id)
                  const estMaDemande = d.demandeur_id === currentUserId
                  const [rbg, rtc] = ROLE_COLORS[d.nouveau_role] ?? ['#f5f3ef', '#4a5568']
                  return (
                    <div key={i} style={{ background: '#fff', borderRadius: 8, border: `2px solid ${estMaDemande ? '#e8e3d8' : '#f0f4ec'}`, padding: '18px 22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>
                            Modification droits — {cible?.email ?? d.cible_user_id}
                          </div>
                          <div style={{ fontSize: 11, color: '#8b7355' }}>
                            demandée par {demandeur?.email ?? 'Admin'} · {new Date(d.date_demande).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        {estMaDemande && (
                          <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#fdf8ec', color: '#b8860b' }}>
                            Votre demande
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                        <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                          <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 4 }}>Role actuel</div>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: ROLE_COLORS[cible?.role ?? 'marque']?.[0], color: ROLE_COLORS[cible?.role ?? 'marque']?.[1] }}>
                            {cible?.role ?? '-'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 18, color: '#8b7355' }}>→</div>
                        <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #c8d8b8' }}>
                          <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 4 }}>Nouveau role</div>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: rbg, color: rtc }}>
                            {d.nouveau_role}
                          </span>
                        </div>
                      </div>
                      {estMaDemande ? (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fdf8ec', border: '1px solid #b8860b', fontSize: 12, color: '#b8860b' }}>
                          En attente de validation par un autre administrateur. Vous ne pouvez pas valider votre propre demande.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => refuserDemande(d.id)} style={{ flex: 1, padding: '9px', borderRadius: 4, border: '1.5px solid #c8a0a0', background: '#fdf0f0', color: '#8b3a3a', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Refuser
                          </button>
                          <button onClick={() => validerDemande(d)} disabled={confirming} style={{ flex: 2, padding: '9px', borderRadius: 4, border: 'none', background: confirming ? '#d4c5b0' : '#1a1a1a', color: confirming ? '#8b7355' : '#fff', fontSize: 12, fontWeight: 700, cursor: confirming ? 'default' : 'pointer' }}>
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

        {activeTab === 'Export commandes' && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px 28px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>Filtres export</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#8b7355', display: 'block', marginBottom: 5 }}>Date début</label>
                  <input type="date" value={exportDateDebut} onChange={e => setExportDateDebut(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 12, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#8b7355', display: 'block', marginBottom: 5 }}>Date fin</label>
                  <input type="date" value={exportDateFin} onChange={e => setExportDateFin(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 12, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#8b7355', display: 'block', marginBottom: 5 }}>Client (marque)</label>
                <input type="text" placeholder="Nom de la marque..." value={exportClient} onChange={e => setExportClient(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 12, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#8b7355', display: 'block', marginBottom: 5 }}>Zone</label>
                <select value={exportZone} onChange={e => setExportZone(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 12 }}>
                  <option value=''>Toutes les zones</option>
                  <option value='Europe'>Europe</option>
                  <option value='Asie'>Asie</option>
                  <option value='Amérique du Nord'>Amérique du Nord</option>
                  <option value='Amérique du Sud'>Amérique du Sud</option>
                  <option value='Afrique'>Afrique</option>
                  <option value='Autre'>Autre</option>
                </select>
              </div>
              <button onClick={exportCommandes} disabled={exporting}
                style={{ width: '100%', padding: '12px', borderRadius: 4, border: 'none', background: exporting ? '#d4c5b0' : '#1a1a1a', color: exporting ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: exporting ? 'default' : 'pointer' }}>
                {exporting ? 'Génération...' : '⬇ Exporter CSV'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Royalties filatures' && (
          <div>
            {/* Barre filtre + export */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Filtrer par filature..."
                value={royaltyFiltre}
                onChange={e => setRoyaltyFiltre(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 12, width: 200, outline: 'none' }}
              />
              <input
                type="date"
                value={royaltyDateDebut}
                onChange={e => setRoyaltyDateDebut(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }}
              />
              <span style={{ fontSize: 12, color: '#8b7355' }}>→</span>
              <input
                type="date"
                value={royaltyDateFin}
                onChange={e => setRoyaltyDateFin(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }}
              />
              <button
                onClick={exportRoyaltiesExcel}
                disabled={exportingRoyalties}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: exportingRoyalties ? '#d4c5b0' : '#2d5016', color: '#fff', fontSize: 12, fontWeight: 700, cursor: exportingRoyalties ? 'default' : 'pointer' }}
              >
                {exportingRoyalties ? 'Export...' : '⬇ Export Excel'}
              </button>
              {/* Compteur total */}
              <span style={{ fontSize: 12, color: '#8b7355', marginLeft: 'auto' }}>
                {royalties.filter(r =>
                  (!royaltyFiltre || r.filature?.nom?.toLowerCase().includes(royaltyFiltre.toLowerCase())) &&
                  (!royaltyDateDebut || (r.date_facture ?? '') >= royaltyDateDebut) &&
                  (!royaltyDateFin   || (r.date_facture ?? '') <= royaltyDateFin)
                ).length} relevé(s)
              </span>
            </div>

            {/* Tableau */}
            {royalties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#8b7355' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune royalty enregistrée</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Les royalties apparaissent automatiquement à l'encaissement des factures.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {royalties
                  .filter(r =>
                    (!royaltyFiltre || r.filature?.nom?.toLowerCase().includes(royaltyFiltre.toLowerCase())) &&
                    (!royaltyDateDebut || (r.date_facture ?? '') >= royaltyDateDebut) &&
                    (!royaltyDateFin   || (r.date_facture ?? '') <= royaltyDateFin)
                  )
                  .map((r, i) => {
                    const statutColors: Record<string, [string, string]> = {
                      'en_attente': ['#fdf8ec', '#b8860b'],
                      'validé':     ['#DBEAFE', '#1E40AF'],
                      'contesté':   ['#FEE2E2', '#991B1B'],
                      'payé':       ['#f0f4ec', '#2d5016'],
                    }
                    const [sbg, stc] = statutColors[r.statut] ?? ['#f5f3ef', '#4a5568']
                    const enRetard = r.date_echeance && new Date(r.date_echeance) < new Date() && r.statut !== 'payé'
                    return (
                      <div key={i} style={{ background: '#fff', borderRadius: 8, border: `1.5px solid ${enRetard ? '#EF4444' : '#e8e3d8'}`, padding: '14px 18px', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 2 }}>Filature</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{r.filature?.nom ?? '-'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 2 }}>Marque · Facture</div>
                          <div style={{ fontSize: 12, color: '#4a5568' }}>{r.marque?.nom ?? '-'} · {r.facture?.reference ?? '-'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 2 }}>HT facture</div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{Number(r.montant_ht_facture).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 2 }}>Royalty 1%</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#2d5016' }}>{Number(r.montant_royalty).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 2 }}>Total dû</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: enRetard ? '#991B1B' : '#1a1a1a' }}>{Number(r.montant_total_du).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 2 }}>Échéance</div>
                          <div style={{ fontSize: 11, color: enRetard ? '#991B1B' : '#4a5568', fontWeight: enRetard ? 700 : 400 }}>
                            {r.date_echeance ? new Date(r.date_echeance).toLocaleDateString('fr-FR') : '-'}
                            {enRetard && ' ⚠'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: sbg, color: stc }}>{r.statut}</span>
                          {r.statut !== 'payé' && (
                            <button
                              onClick={() => marquerRoyaltyPayee(r.id)}
                              style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              Marquer payé
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'Sécurité' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '20px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>Paramètres</div>
              {params.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < params.length - 1 ? '1px solid #f5f3ef' : 'none' }}>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{p.label}</span>
                  <div onClick={() => setParams(prev => prev.map((x, j) => j === i ? { ...x, actif: !x.actif } : x))} style={{ width: 38, height: 20, borderRadius: 4, cursor: 'pointer', background: p.actif ? '#1a1a1a' : '#CBD5E1', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: p.actif ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '20px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>Journal d'audit récent</div>
              {audit.slice(0, 10).map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f3ef', fontSize: 11 }}>
                  <span style={{ color: ev.niveau === 'alert' ? '#8b3a3a' : '#8b7355', flexShrink: 0 }}>
                    {ev.niveau === 'alert' ? '!' : 'i'}
                  </span>
                  <span style={{ flex: 1, color: '#4a5568' }}>{ev.action}</span>
                  <span style={{ color: '#CBD5E1' }}>{new Date(ev.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              ))}
              {audit.length === 0 && <div style={{ fontSize: 12, color: '#8b7355', textAlign: 'center', padding: '20px' }}>Aucune entrée</div>}
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setSelectedUser(null)}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '26px 30px', width: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Modifier les droits</span>
              <button onClick={() => setSelectedUser(null)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer' }}>x</button>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fdf8ec', border: '1px solid #b8860b', fontSize: 12, color: '#b8860b', marginBottom: 16 }}>
              Cette modification nécessite la validation d'un second administrateur avant d'être appliquée.
            </div>
            <div style={{ fontSize: 12, color: '#4a5568', marginBottom: 16 }}>
              Utilisateur : <strong>{selectedUser.email}</strong>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Nouveau role</label>
              <select value={demandeForm.role} onChange={e => setDemandeForm(f => ({ ...f, role: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, outline: 'none' }}>
                {['admin', 'marque', 'filature', 'fournisseur'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Entreprise associee</label>
              <select value={demandeForm.entreprise_id} onChange={e => setDemandeForm(f => ({ ...f, entreprise_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, outline: 'none' }}>
                <option value="">Aucune</option>
                {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelectedUser(null)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#8b7355', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button onClick={soumettreDemandeModification} disabled={sending} style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: sending ? '#d4c5b0' : '#1a1a1a', color: sending ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: sending ? 'default' : 'pointer' }}>
                {sending ? 'Envoi...' : 'Soumettre la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
