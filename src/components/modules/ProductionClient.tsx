'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ControleQualite {
  id: string
  type: string
  valeur: string
  seuil: string
  conforme: boolean
  date_controle: string
}

interface Lot {
  id: string
  reference: string
  type_coton: string
  volume_tonnes: number
  statut: string
  avancement_pct: number
  machine: string | null
  origine: string | null
  certification: string | null
  certif_ethys_id: string | null
  date_debut: string | null
  date_fin_prevue: string | null
  updated_at: string | null
  controles_qualite: ControleQualite[]
}

interface Commande {
  id: string
  reference: string
  statut: string
  priorite: string
  volume_total_tonnes: number
  pct_recycle: number
  date_livraison_souhaitee: string
  date_expedition_prevue: string | null
  date_livraison_prevue: string | null
  expedition_confirmee: boolean | null
  livraison_confirmee: boolean | null
  marque: { nom: string } | null
  filature: { nom: string } | null
  lots: Lot[]
}

interface Props {
  commandes: Commande[]
  user: { id: string }
  role: string
}

const ETAPES_PROD = [
  'Réception matière', 'Préparation fibres', 'Filage',
  'Bobinage', 'Contrôle qualité', 'Conditionnement', 'Expédition'
]

const STATUT_LOT_COLORS: Record<string, [string, string]> = {
  en_attente:       ['#f5f3ef', '#4a5568'],
  en_production:    ['#D1ECF1', '#0C5460'],
  controle_qualite: ['#fdf8ec', '#b8860b'],
  validé:           ['#f0f4ec', '#2d5016'],
  livré:            ['#f0f4ec', '#2d5016'],
}

export default function ProductionClient({ commandes: initial, user, role }: Props) {
  const supabase = createClient()
  const [commandes, setCommandes] = useState<Commande[]>(initial)
  const [selected, setSelected] = useState<Commande | null>(initial[0] ?? null)
  const [activeTab, setActiveTab] = useState<'Avancement' | 'lots' | 'qualite'>('Avancement')
  const [updatingLot, setUpdatingLot] = useState<string | null>(null)
  const [showAddLot, setShowAddLot] = useState(false)
  const [newLot, setNewLot] = useState({
    type_coton: 'recycle', volume_tonnes: '', origine: '', certification: ''
  })
  const [showAssocCertif, setShowAssocCertif] = useState<string | null>(null)
  const [showLogistique, setShowLogistique] = useState(false)
  const [logistiqueForm, setLogistiqueForm] = useState({ date_expedition_prevue: '', date_livraison_prevue: '' })

  const sauvegarderLogistique = async () => {
    if (!selected || !logistiqueForm.date_expedition_prevue) return
    await supabase.from('commandes').update({
      date_expedition_prevue: logistiqueForm.date_expedition_prevue,
      date_livraison_prevue: logistiqueForm.date_livraison_prevue || null,
    }).eq('id', selected.id)
    setCommandes(prev => prev.map(c => c.id === selected.id ? {
      ...c,
      date_expedition_prevue: logistiqueForm.date_expedition_prevue,
      date_livraison_prevue: logistiqueForm.date_livraison_prevue || null,
    } : c))
    setSelected(prev => prev ? {
      ...prev,
      date_expedition_prevue: logistiqueForm.date_expedition_prevue,
      date_livraison_prevue: logistiqueForm.date_livraison_prevue || null,
    } : null)
    setShowLogistique(false)
    await supabase.from('notifications').insert({
  utilisateur_id: '1e48a840-8329-4595-be9b-f04d9ef1562a',
  user_id: '1e48a840-8329-4595-be9b-f04d9ef1562a',
  type: 'logistique',
  titre: 'Dates logistiques saisies - ' + selected.reference,
  message: 'Expédition prévue le ' + new Date(logistiqueForm.date_expedition_prevue).toLocaleDateString('fr-FR') + (logistiqueForm.date_livraison_prevue ? ', livraison prévue le ' + new Date(logistiqueForm.date_livraison_prevue).toLocaleDateString('fr-FR') : ''),
  lien: '/production',
  lu: false,
})
  }
  const [certifications, setCertifications] = useState<{ id: string; numero: string; type_produit: string | null; statut: string }[]>([])
  const [selectedCertifId, setSelectedCertifId] = useState('')

  useEffect(() => {
    if (role !== 'admin') return
    const aujourdhui = new Date()
    const lotsAVerifier = initial.flatMap(c => c.lots).filter(l => {
      if (l.avancement_pct === 100 || l.statut === 'livre') return false
      const derniereMaj = new Date(l.updated_at ?? l.date_debut ?? '')
      if (isNaN(derniereMaj.getTime())) return false
      const jours = Math.floor((aujourdhui.getTime() - derniereMaj.getTime()) / (1000 * 60 * 60 * 24))
      return jours >= 14
    })
   if (lotsAVerifier.length === 0) return
    const aujourdhuiStr = new Date().toISOString().split('T')[0]
    Promise.all(lotsAVerifier.map(async lot => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'lot_bloque')
        .eq('user_id', '1e48a840-8329-4595-be9b-f04d9ef1562a')
        .ilike('titre', '%' + lot.reference + '%')
        .gte('created_at', aujourdhuiStr)
      if (!count || count === 0) {
        await supabase.from('notifications').insert({
  user_id: '1e48a840-8329-4595-be9b-f04d9ef1562a',
  type: 'lot_bloque',
  titre: 'Lot bloque : ' + lot.reference,
  contenu: 'Le lot ' + lot.reference + ' n\'a pas progresse depuis plus de 14 jours.',
  lien: '/production',
  lu: false,
})
      }
    })).catch(console.error)
  }, [])
  const chargerCertifications = async () => {
    const { data } = await supabase.from('certifications_ethys').select('id, numero, type_produit, statut').order('created_at', { ascending: false })
    setCertifications(data ?? [])
  }

  const associerCertification = async (lotId: string) => {
    if (!selectedCertifId) return
    await supabase.from('lots').update({ certif_ethys_id: selectedCertifId }).eq('id', lotId)
    await supabase.from('certifications_ethys').update({ lot_id: lotId }).eq('id', selectedCertifId)
    setCommandes(prev => prev.map(c => ({ ...c, lots: c.lots.map(l => l.id === lotId ? { ...l, certif_ethys_id: selectedCertifId } : l) })))
    if (selected) setSelected(prev => prev ? { ...prev, lots: prev.lots.map(l => l.id === lotId ? { ...l, certif_ethys_id: selectedCertifId } : l) } : null)
    setShowAssocCertif(null)
    setSelectedCertifId('')
  }

  const updateAvancement = async (lotId: string, pct: number) => {
    if (role === 'admin') {
      window.alert('En tant qu\'admin, vous ne pouvez pas modifier l\'avancement d\'un lot. Cette action revient à la filature ou à la marque.')
      return
    }
    const lot = selected?.lots.find(l => l.id === lotId)
    if (lot && pct < lot.avancement_pct) {
      const ok1 = window.confirm('Attention : vous réduisez l\'avancement du lot ' + lot.reference + '. Cette action va générer une alerte admin. Confirmer ?')
      if (!ok1) return
      // Notifier l'admin
      await supabase.from('notifications').insert({
        utilisateur_id: '1e48a840-8329-4595-be9b-f04d9ef1562a',
        user_id: '1e48a840-8329-4595-be9b-f04d9ef1562a',
        type: 'alerte_production',
        titre: 'Retour arriere sur lot ' + lot.reference,
        message: 'L\'avancement du lot ' + lot.reference + ' a ete reduit de ' + lot.avancement_pct + '% a ' + pct + '% par l\'utilisateur ' + user.id,
        lien: '/production',
        lu: false,
      })
    }
   if (pct === 100) {
      const ok1 = window.confirm('Confirmer la complétion à 100% du lot ' + (lot?.reference ?? '') + ' ?')
      if (!ok1) return
      const ok2 = window.confirm('Deuxième confirmation : le lot sera marqué comme terminé. Cette action est définitive. Continuer ?')
      if (!ok2) return
    }
    setUpdatingLot(lotId)
    const { error } = await supabase
      .from('lots')
      .update({ avancement_pct: pct })
      .eq('id', lotId)

    if (!error) {
      setCommandes(prev => prev.map(c => ({
        ...c,
        lots: c.lots.map(l => l.id === lotId ? { ...l, avancement_pct: pct } : l)
      })))
      if (selected) {
        setSelected(prev => prev ? {
          ...prev,
          lots: prev.lots.map(l => l.id === lotId ? { ...l, avancement_pct: pct } : l)
        } : null)
      }
    }
    setUpdatingLot(null)
  }
  const updateStatutLot = async (lotId: string, statut: string) => {
    await supabase.from('lots').update({ statut }).eq('id', lotId)
    setCommandes(prev => prev.map(c => ({
      ...c,
      lots: c.lots.map(l => l.id === lotId ? { ...l, statut } : l)
    })))
    if (selected) {
      setSelected(prev => prev ? {
        ...prev,
        lots: prev.lots.map(l => l.id === lotId ? { ...l, statut } : l)
      } : null)
    }
  }

  const ajouterLot = async () => {
    if (!selected || !newLot.volume_tonnes) return
    const reference = `${selected.reference.replace('CMD', 'LOT')}-${String.fromCharCode(65 + (selected.lots?.length ?? 0))}`

    const { data, error } = await supabase
      .from('lots')
      .insert({
        reference,
        commande_id: selected.id,
        type_coton: newLot.type_coton,
        volume_tonnes: parseFloat(newLot.volume_tonnes) / 1000,
        origine: newLot.origine || null,
        certification: newLot.certification || null,
        statut: 'en_attente',
        avancement_pct: 0,
      })
      .select('*, controles_qualite(*)')
      .single()

    if (!error && data) {
      const updatedLot = data as Lot
      setCommandes(prev => prev.map(c =>
        c.id === selected.id ? { ...c, lots: [...c.lots, updatedLot] } : c
      ))
      setSelected(prev => prev ? { ...prev, lots: [...prev.lots, updatedLot] } : null)
      setShowAddLot(false)
      setNewLot({ type_coton: 'recycle', volume_tonnes: '', origine: '', certification: '' })
    }
  }

  const AvancementGlobal = (cmd: Commande) => {
    if (!cmd.lots?.length) return 0
    return Math.round(cmd.lots.reduce((s, l) => s + l.avancement_pct, 0) / cmd.lots.length)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Liste commandes */}
      <div style={{
        width: 260, minWidth: 260, background: '#fff',
        borderRight: '1px solid #e8e3d8', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f5f3ef', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
          Productions actives
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {commandes.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#8b7355', fontSize: 12 }}>
              Aucune production active.<br />Soumettez d'abord une commande.
            </div>
          ) : commandes.map(cmd => {
            const av = AvancementGlobal(cmd)
            const isActive = selected?.id === cmd.id
            return (
              <div key={cmd.id} onClick={() => setSelected(cmd)} style={{
                padding: '12px 14px', cursor: 'pointer',
                background: isActive ? '#F0FDF4' : 'transparent',
                borderLeft: `3px solid ${isActive ? '#1a1a1a' : 'transparent'}`,
                borderBottom: '1px solid #f5f3ef'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a' }}>{cmd.reference}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: cmd.priorite === 'urgente' ? '#8b3a3a' : cmd.priorite === 'haute' ? '#D97706' : '#8b7355'
                  }}>{cmd.priorite}</span>
                </div>
                <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 6 }}>
                  {cmd.marque?.nom} · {Math.round((cmd.volume_total_tonnes ?? 0) * 1000).toLocaleString('fr-FR')} kg
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8b7355', marginBottom: 4 }}>
                  <span>{cmd.filature?.nom}</span>
                  <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{av}%</span>
                </div>
                <div style={{ height: 4, background: '#d4c5b0', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${av}%`, background: av === 100 ? '#2d5016' : '#1a1a1a', borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Détail production */}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Hero */}
          <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)', padding: '18px 24px', color: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 2 }}>{selected.reference}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {selected.marque?.nom} · {selected.filature?.nom} · {Math.round((selected.volume_total_tonnes ?? 0) * 1000).toLocaleString('fr-FR')} kg · Fil ETHYS
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#c2956e' }}>{AvancementGlobal(selected)}%</div>
                <div style={{ fontSize: 10, opacity: 0.65 }}>Avancement global</div>
              </div>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${AvancementGlobal(selected)}%`, background: '#c2956e', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>

            {/* Logistique si production 100% */}
            {AvancementGlobal(selected) === 100 && role !== 'admin' && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {selected.date_expedition_prevue ? (
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Expédition prévue</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#c2956e' }}>{new Date(selected.date_expedition_prevue).toLocaleDateString('fr-FR')}</div>
                    </div>
                    {selected.date_livraison_prevue && (
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Livraison prévue</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#c2956e' }}>{new Date(selected.date_livraison_prevue).toLocaleDateString('fr-FR')}</div>
                      </div>
                    )}
                    <button onClick={() => { setShowLogistique(true); setLogistiqueForm({ date_expedition_prevue: selected.date_expedition_prevue ?? '', date_livraison_prevue: selected.date_livraison_prevue ?? '' }) }} style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
                      Modifier
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Production terminée - saisir les dates logistiques</span>
                    <button onClick={() => { setShowLogistique(true); setLogistiqueForm({ date_expedition_prevue: '', date_livraison_prevue: '' }) }} style={{ padding: '5px 12px', borderRadius: 4, border: 'none', background: '#c2956e', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      Saisir les dates
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginTop: 14 }}>
              {[['Avancement', 'Avancement'], ['lots', 'Lots'], ['qualite', 'Contrôles qualité']].map(([val, label]) => (
                <button key={val} onClick={() => setActiveTab(val as typeof activeTab)} style={{
                  padding: '7px 16px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: activeTab === val ? 700 : 400,
                  color: activeTab === val ? '#fff' : 'rgba(255,255,255,0.5)',
                  borderBottom: activeTab === val ? '2px solid #c2956e' : '2px solid transparent',
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Contenu tabs */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

            {/* Tab Avancement */}
            {activeTab === 'Avancement' && (
              <div>
                <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '20px 24px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 18 }}>
                    Étapes de production
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    {ETAPES_PROD.map((etape, i) => {
                      const av = AvancementGlobal(selected)
                      const etapeIdx = Math.floor(av / (100 / ETAPES_PROD.length))
                      const fait = i < etapeIdx
                      const enCours = i === etapeIdx
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 800,
                              background: fait ? '#e8e3d8' : enCours ? '#c2956e' : '#d4c5b0',
                              color: fait ? '#1a1a1a' : enCours ? '#fff' : '#8b7355',
                              boxShadow: enCours ? '0 0 0 3px rgba(194,149,110,0.3)' : 'none'
                            }}>{fait ? <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#c2956e' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round'><polyline points='20 6 9 17 4 12'/></svg> : i + 1}</div>
                            <div style={{ fontSize: 9, color: fait ? '#4a5568' : enCours ? '#c2956e' : '#8b7355', fontWeight: enCours ? 700 : 400, textAlign: 'center', marginTop: 4, lineHeight: 1.3 }}>
                              {etape}
                            </div>
                          </div>
                          {i < ETAPES_PROD.length - 1 && (
                            <div style={{ height: 2, flex: 1, background: fait ? '#1a1a1a' : '#d4c5b0', marginTop: 14 }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Mise Ã  jour Avancement par lot */}
                {selected.lots?.map(lot => (
                  <div key={lot.id} style={{ background: '#fff', borderRadius: 6, border: '1px solid #e8e3d8', padding: '16px 20px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{lot.reference}</div>
                        <div style={{ fontSize: 11, color: '#4a5568' }}>
                          {Math.round((lot.volume_tonnes ?? 0) * 1000).toLocaleString('fr-FR')} kg · {'Fil ETHYS'} · {'Fil ETHYS'}
                          {lot.machine && ` · ${lot.machine}`}
                        </div>
                      </div>
                      <select
                        value={lot.statut}
                        onChange={e => updateStatutLot(lot.id, e.target.value)}
                        style={{
                          padding: '5px 10px', borderRadius: 8, border: '1.5px solid #d4c5b0',
                          fontSize: 11, outline: 'none', cursor: 'pointer'
                        }}
                      >
                        {['en_attente', 'En production', 'controle_qualite', 'validé', 'livré'].map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: '#4a5568' }}>Avancement</span>
                          <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{lot.avancement_pct}%</span>
                        </div>
                        <input
                          type="range" min="0" max="100" step="5"
                          value={lot.avancement_pct}
                          onChange={e => updateAvancement(lot.id, parseInt(e.target.value))}
                          disabled={updatingLot === lot.id}
                          style={{ width: '100%', accentColor: '#1a1a1a' }}
                        />
                      </div>
                    </div>
                   {lot.avancement_pct === 100 && (
                      <div style={{ marginTop: 10 }}>
                        {lot.certif_ethys_id ? (
                          <div style={{ fontSize: 11, color: '#2d5016', fontWeight: 600, padding: '6px 10px', borderRadius: 6, background: '#f0f4ec', display: 'inline-block' }}>
                            {'Certification ETHYS : ' + (certifications.find(c => c.id === lot.certif_ethys_id)?.numero ?? lot.certif_ethys_id)}
                          </div>
                        ) : (
                          <button onClick={() => { setShowAssocCertif(lot.id); chargerCertifications() }} style={{ padding: '6px 14px', borderRadius: 6, border: '1.5px solid #2d5016', background: '#f0f4ec', color: '#2d5016', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Associer une certification ETHYS
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Ajouter lot */}
                {!showAddLot ? (
                  <button onClick={() => setShowAddLot(true)} style={{
                    width: '100%', padding: '10px', borderRadius: 4,
                    border: '2px dashed #f0f4ec', background: '#F0FDF4',
                    color: '#1a1a1a', fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}>+ Ajouter un lot</button>
                ) : (
                  <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #e8e3d8', padding: '16px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Nouveau lot</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#4a5568', display: 'block', marginBottom: 4 }}>Type coton</label>
                        <select value={newLot.type_coton} onChange={e => setNewLot(p => ({ ...p, type_coton: e.target.value }))}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }}>
                <option value='recycle'>Fil ETHYS (recyclé)</option>
                        </select>
                      </div>
                      <div>
                <label style={{ fontSize: 11, color: '#4a5568', display: 'block', marginBottom: 4 }}>Volume (kg)</label>
                        <input type="number" value={newLot.volume_tonnes} onChange={e => setNewLot(p => ({ ...p, volume_tonnes: e.target.value }))}
                          placeholder="Ex : 80" style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#4a5568', display: 'block', marginBottom: 4 }}>Origine</label>
                        <input value={newLot.origine} onChange={e => setNewLot(p => ({ ...p, origine: e.target.value }))}
                          placeholder="Ex : Beni Mellal, Maroc" style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#4a5568', display: 'block', marginBottom: 4 }}>Certification</label>
                        <select value={newLot.certification} onChange={e => setNewLot(p => ({ ...p, certification: e.target.value }))}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }}>
                          <option value="">-</option>
                          {['GRS', 'GOTS', 'OCS 100', 'BCI'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={ajouterLot} style={{
                        flex: 2, padding: '8px', borderRadius: 8, border: 'none',
                        background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                      }}> Ajouter</button>
                      <button onClick={() => setShowAddLot(false)} style={{
                        flex: 1, padding: '8px', borderRadius: 8,
                        border: '1.5px solid #e8e3d8', background: '#fff', fontSize: 12, cursor: 'pointer'
                      }}>Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab Lots */}
            {activeTab === 'lots' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selected.lots?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#8b7355', fontSize: 12 }}>
                    Aucun lot - ajoutez-en un depuis l'onglet Avancement
                  </div>
                ) : selected.lots?.map(lot => {
                  const [bg, tc] = STATUT_LOT_COLORS[lot.statut] ?? ['#f5f3ef', '#4a5568']
                  return (
                    <div key={lot.id} style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 4,
                            background: lot.type_coton === 'recycle' ? '#f0f4ec' : '#DBEAFE',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                          }}>{''}</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>{lot.reference}</div>
                            <div style={{ fontSize: 11, color: '#4a5568' }}>{Math.round((lot.volume_tonnes ?? 0) * 1000).toLocaleString('fr-FR')} kg - {lot.origine ?? '-'}</div>
                          </div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: bg, color: tc }}>
                          {lot.statut.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: '#4a5568' }}>Avancement</span>
                          <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{lot.avancement_pct}%</span>
                        </div>
                        <div style={{ height: 6, background: '#d4c5b0', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${lot.avancement_pct}%`, background: lot.avancement_pct === 100 ? '#2d5016' : '#1a1a1a', borderRadius: 3 }} />
                        </div>
                      </div>
                      {lot.certification && (
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#DBEAFE', color: '#1E40AF' }}>
                          {lot.certification}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tab Contrôles qualité */}
            {activeTab === 'qualite' && (
              <div>
                {selected.lots?.every(l => l.controles_qualite?.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#8b7355', fontSize: 12 }}>
                    Aucun Contrôle qualité enregistré
                  </div>
                ) : (
                  <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f5f3ef' }}>
                          {['Lot', 'Paramètre', 'Valeur', 'Seuil', 'Résultat', 'Date'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#8b7355', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.lots?.flatMap(lot =>
                          lot.controles_qualite?.map(cq => (
                            <tr key={cq.id} style={{ borderTop: '1px solid #f5f3ef' }}>
                              <td style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#1a1a1a' }}>{lot.reference}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12 }}>{cq.type}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: cq.conforme ? '#1a1a1a' : '#8b3a3a' }}>{cq.valeur}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: '#4a5568' }}>{cq.seuil}</td>
                              <td style={{ padding: '11px 14px' }}>
                                <span style={{
                                  padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                                  background: cq.conforme ? '#f0f4ec' : '#FEE2E2',
                                  color: cq.conforme ? '#2d5016' : '#991B1B'
                                }}>{cq.conforme ? ' Conforme' : '✕ Non conforme'}</span>
                              </td>
                              <td style={{ padding: '11px 14px', fontSize: 11, color: '#8b7355' }}>
                                {new Date(cq.date_controle).toLocaleDateString('fr-FR')}
                              </td>
                            </tr>
                          )) ?? []
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b7355' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>section</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune production active</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Les commandes soumises apparaîtront ici</div>
          </div>
        </div>
      )}
   {showLogistique && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowLogistique(false)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', padding: '24px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Dates logistiques</span>
              <button onClick={() => setShowLogistique(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>x</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Date d'expédition prévue *</label>
              <input type="date" value={logistiqueForm.date_expedition_prevue} onChange={e => setLogistiqueForm(p => ({ ...p, date_expedition_prevue: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Date de livraison prévue (optionnel)</label>
              <input type="date" value={logistiqueForm.date_livraison_prevue} onChange={e => setLogistiqueForm(p => ({ ...p, date_livraison_prevue: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 6, background: '#fdf8ec', border: '1px solid #e8d5a0', fontSize: 11, color: '#8b6914', marginBottom: 16 }}>
              {"Par défaut : expédition 14 jours après validation, livraison confirmée 30 jours après expédition si aucune action."}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowLogistique(false)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#8b7355', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button onClick={sauvegarderLogistique} disabled={!logistiqueForm.date_expedition_prevue} style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: !logistiqueForm.date_expedition_prevue ? '#d4c5b0' : '#1a1a1a', color: !logistiqueForm.date_expedition_prevue ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: !logistiqueForm.date_expedition_prevue ? 'default' : 'pointer' }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssocCertif && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowAssocCertif(null)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', padding: '24px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Associer une certification</span>
              <button onClick={() => setShowAssocCertif(null)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>x</button>
            </div>
            {certifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#8b7355', fontSize: 13 }}>Aucune certification disponible</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {certifications.map(c => (
                  <div key={c.id} onClick={() => setSelectedCertifId(c.id)} style={{ padding: '12px 14px', borderRadius: 8, border: '1.5px solid ' + (selectedCertifId === c.id ? '#2d5016' : '#e8e3d8'), background: selectedCertifId === c.id ? '#f0f4ec' : '#fff', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{c.numero}</div>
                    <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>{(c.type_produit ?? '-') + ' - ' + c.statut}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowAssocCertif(null)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#8b7355', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => associerCertification(showAssocCertif)} disabled={!selectedCertifId} style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: !selectedCertifId ? '#d4c5b0' : '#1a1a1a', color: !selectedCertifId ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: !selectedCertifId ? 'default' : 'pointer' }}>
                Associer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}







