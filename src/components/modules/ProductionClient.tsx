'use client'

import { useState } from 'react'
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
  date_debut: string | null
  date_fin_prevue: string | null
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
  marque: { nom: string } | null
  filature: { nom: string } | null
  lots: Lot[]
}

interface Props {
  commandes: Commande[]
  user: { id: string }
}

const ETAPES_PROD = [
  'RÃ©ception matiÃ¨re', 'PrÃ©paration fibres', 'Filage',
  'Bobinage', 'ContrÃ´le qualitÃ©', 'Conditionnement', 'ExpÃ©dition'
]

const STATUT_LOT_COLORS: Record<string, [string, string]> = {
  en_attente:       ['#F1F5F9', '#475569'],
  en_production:    ['#D1ECF1', '#0C5460'],
  controle_qualite: ['#FEF3C7', '#92400E'],
  valide:           ['#D1FAE5', '#065F46'],
  livre:            ['#D1FAE5', '#065F46'],
}

export default function ProductionClient({ commandes: initial, user }: Props) {
  const supabase = createClient()
  const [commandes, setCommandes] = useState<Commande[]>(initial)
  const [selected, setSelected] = useState<Commande | null>(initial[0] ?? null)
  const [activeTab, setActiveTab] = useState<'avancement' | 'lots' | 'qualite'>('avancement')
  const [updatingLot, setUpdatingLot] = useState<string | null>(null)
  const [showAddLot, setShowAddLot] = useState(false)
  const [newLot, setNewLot] = useState({
    type_coton: 'recycle', volume_tonnes: '', origine: '', certification: ''
  })

  const updateAvancement = async (lotId: string, pct: number) => {
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
        volume_tonnes: parseFloat(newLot.volume_tonnes),
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

  const avancementGlobal = (cmd: Commande) => {
    if (!cmd.lots?.length) return 0
    return Math.round(cmd.lots.reduce((s, l) => s + l.avancement_pct, 0) / cmd.lots.length)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Liste commandes */}
      <div style={{
        width: 260, minWidth: 260, background: '#fff',
        borderRight: '1px solid #EEF0F3', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>
          Productions actives
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {commandes.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
              Aucune production active.<br />Soumettez d'abord une commande.
            </div>
          ) : commandes.map(cmd => {
            const av = avancementGlobal(cmd)
            const isActive = selected?.id === cmd.id
            return (
              <div key={cmd.id} onClick={() => setSelected(cmd)} style={{
                padding: '12px 14px', cursor: 'pointer',
                background: isActive ? '#F0FDF4' : 'transparent',
                borderLeft: `3px solid ${isActive ? '#0A3D26' : 'transparent'}`,
                borderBottom: '1px solid #F8FAFC'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0A3D26' }}>{cmd.reference}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: cmd.priorite === 'urgente' ? '#DC2626' : cmd.priorite === 'haute' ? '#D97706' : '#94A3B8'
                  }}>â— {cmd.priorite}</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>
                  {cmd.marque?.nom} Â· {cmd.volume_total_tonnes}T
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', marginBottom: 4 }}>
                  <span>{cmd.filature?.nom}</span>
                  <span style={{ fontWeight: 700, color: '#0A3D26' }}>{av}%</span>
                </div>
                <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${av}%`, background: av === 100 ? '#10B981' : '#0A3D26', borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* DÃ©tail production */}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Hero */}
          <div style={{ background: 'linear-gradient(135deg,#0A3D26,#0D5C3A)', padding: '18px 24px', color: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 2 }}>{selected.reference}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {selected.marque?.nom} Â· {selected.filature?.nom} Â· {selected.volume_total_tonnes}T Â· {Math.round(selected.pct_recycle)}% recyclÃ©
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#6EE7B7' }}>{avancementGlobal(selected)}%</div>
                <div style={{ fontSize: 10, opacity: 0.65 }}>avancement global</div>
              </div>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${avancementGlobal(selected)}%`, background: '#6EE7B7', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginTop: 14 }}>
              {[['avancement', 'Avancement'], ['lots', 'Lots'], ['qualite', 'ContrÃ´les qualitÃ©']].map(([val, label]) => (
                <button key={val} onClick={() => setActiveTab(val as typeof activeTab)} style={{
                  padding: '7px 16px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: activeTab === val ? 700 : 400,
                  color: activeTab === val ? '#fff' : 'rgba(255,255,255,0.5)',
                  borderBottom: activeTab === val ? '2px solid #6EE7B7' : '2px solid transparent',
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Contenu tabs */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

            {/* Tab Avancement */}
            {activeTab === 'avancement' && (
              <div>
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '20px 24px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 18 }}>
                    Ã‰tapes de production
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    {ETAPES_PROD.map((etape, i) => {
                      const av = avancementGlobal(selected)
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
                              background: fait ? '#0A3D26' : enCours ? '#10B981' : '#E2E8F0',
                              color: fait || enCours ? '#fff' : '#94A3B8',
                              boxShadow: enCours ? '0 0 0 3px rgba(16,185,129,0.25)' : 'none'
                            }}>{fait ? 'âœ“' : i + 1}</div>
                            <div style={{ fontSize: 9, color: fait ? '#0A3D26' : enCours ? '#10B981' : '#94A3B8', fontWeight: enCours ? 700 : 400, textAlign: 'center', marginTop: 4, lineHeight: 1.3 }}>
                              {etape}
                            </div>
                          </div>
                          {i < ETAPES_PROD.length - 1 && (
                            <div style={{ height: 2, flex: 1, background: fait ? '#0A3D26' : '#E2E8F0', marginTop: 14 }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Mise Ã  jour avancement par lot */}
                {selected.lots?.map(lot => (
                  <div key={lot.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #EEF0F3', padding: '16px 20px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>{lot.reference}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          {Math.round((lot.volume_tonnes ?? 0) * 1000).toLocaleString('fr-FR')} kg Â· {lot.type_coton === 'recycle' ? 'Recycle' : 'Vierge'} Â· {lot.type_coton === 'recycle' ? 'â™» RecyclÃ©' : 'ðŸŒ¿ Vierge'}
                          {lot.machine && ` Â· ${lot.machine}`}
                        </div>
                      </div>
                      <select
                        value={lot.statut}
                        onChange={e => updateStatutLot(lot.id, e.target.value)}
                        style={{
                          padding: '5px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0',
                          fontSize: 11, outline: 'none', cursor: 'pointer'
                        }}
                      >
                        {['en_attente', 'en_production', 'controle_qualite', 'valide', 'livre'].map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: '#64748B' }}>Avancement</span>
                          <span style={{ fontWeight: 700, color: '#0A3D26' }}>{lot.avancement_pct}%</span>
                        </div>
                        <input
                          type="range" min="0" max="100" step="5"
                          value={lot.avancement_pct}
                          onChange={e => updateAvancement(lot.id, parseInt(e.target.value))}
                          disabled={updatingLot === lot.id}
                          style={{ width: '100%', accentColor: '#0A3D26' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Ajouter lot */}
                {!showAddLot ? (
                  <button onClick={() => setShowAddLot(true)} style={{
                    width: '100%', padding: '10px', borderRadius: 10,
                    border: '2px dashed #D1FAE5', background: '#F0FDF4',
                    color: '#0A3D26', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}>ï¼‹ Ajouter un lot</button>
                ) : (
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #EEF0F3', padding: '16px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 12 }}>Nouveau lot</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Type coton</label>
                        <select value={newLot.type_coton} onChange={e => setNewLot(p => ({ ...p, type_coton: e.target.value }))}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none' }}>
                          <option value="recycle">â™» RecyclÃ©</option>
                          <option value="vierge">ðŸŒ¿ Vierge</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Volume (T)</label>
                        <input type="number" value={newLot.volume_tonnes} onChange={e => setNewLot(p => ({ ...p, volume_tonnes: e.target.value }))}
                          placeholder="Ex : 80" style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Origine</label>
                        <input value={newLot.origine} onChange={e => setNewLot(p => ({ ...p, origine: e.target.value }))}
                          placeholder="Ex : Beni Mellal, Maroc" style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, boxSizing: 'border-box', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Certification</label>
                        <select value={newLot.certification} onChange={e => setNewLot(p => ({ ...p, certification: e.target.value }))}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none' }}>
                          <option value="">â€”</option>
                          {['GRS', 'GOTS', 'OCS 100', 'BCI'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={ajouterLot} style={{
                        flex: 2, padding: '8px', borderRadius: 8, border: 'none',
                        background: '#0A3D26', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                      }}>âœ“ Ajouter</button>
                      <button onClick={() => setShowAddLot(false)} style={{
                        flex: 1, padding: '8px', borderRadius: 8,
                        border: '1.5px solid #EEF0F3', background: '#fff', fontSize: 12, cursor: 'pointer'
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
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: 12 }}>
                    Aucun lot â€” ajoutez-en un depuis l'onglet Avancement
                  </div>
                ) : selected.lots?.map(lot => {
                  const [bg, tc] = STATUT_LOT_COLORS[lot.statut] ?? ['#F1F5F9', '#475569']
                  return (
                    <div key={lot.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: lot.type_coton === 'recycle' ? '#D1FAE5' : '#DBEAFE',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                          }}>{lot.type_coton === 'recycle' ? 'â™»' : 'ðŸŒ¿'}</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0A3D26' }}>{lot.reference}</div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>{Math.round((lot.volume_tonnes ?? 0) * 1000).toLocaleString('fr-FR')} kg - {lot.origine ?? '-'}</div>
                          </div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color: tc }}>
                          {lot.statut.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: '#64748B' }}>Avancement</span>
                          <span style={{ fontWeight: 700, color: '#0A3D26' }}>{lot.avancement_pct}%</span>
                        </div>
                        <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${lot.avancement_pct}%`, background: lot.avancement_pct === 100 ? '#10B981' : '#0A3D26', borderRadius: 3 }} />
                        </div>
                      </div>
                      {lot.certification && (
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: '#DBEAFE', color: '#1E40AF' }}>
                          {lot.certification}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tab ContrÃ´les qualitÃ© */}
            {activeTab === 'qualite' && (
              <div>
                {selected.lots?.every(l => l.controles_qualite?.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: 12 }}>
                    Aucun contrÃ´le qualitÃ© enregistrÃ©
                  </div>
                ) : (
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          {['Lot', 'ParamÃ¨tre', 'Valeur', 'Seuil', 'RÃ©sultat', 'Date'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.lots?.flatMap(lot =>
                          lot.controles_qualite?.map(cq => (
                            <tr key={cq.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#0A3D26' }}>{lot.reference}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12 }}>{cq.type}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: cq.conforme ? '#0A3D26' : '#DC2626' }}>{cq.valeur}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: '#64748B' }}>{cq.seuil}</td>
                              <td style={{ padding: '11px 14px' }}>
                                <span style={{
                                  padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                                  background: cq.conforme ? '#D1FAE5' : '#FEE2E2',
                                  color: cq.conforme ? '#065F46' : '#991B1B'
                                }}>{cq.conforme ? 'âœ“ Conforme' : 'âœ• Non conforme'}</span>
                              </td>
                              <td style={{ padding: '11px 14px', fontSize: 11, color: '#94A3B8' }}>
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
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>â¬¡</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune production active</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Les commandes soumises apparaÃ®tront ici</div>
          </div>
        </div>
      )}
    </div>
  )
}
