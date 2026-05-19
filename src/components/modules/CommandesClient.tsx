'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type StatutCommande =
  | 'brouillon' | 'soumise' | 'validation_fournisseur'
  | 'validation_filature' | 'validation_finale' | 'en_production'
  | 'controle_qualite' | 'qr_genere' | 'expediee' | 'livree' | 'annulee'

interface Entreprise { id: string; nom: string; type: string }

interface Commande {
  id: string
  reference: string
  titre: string | null
  statut: StatutCommande
  type_coton: string
  grammage: string | null
  volume_total_tonnes: number
  pct_recycle: number
  priorite: string
  date_livraison_souhaitee: string
  created_at: string
  marque: { nom: string } | null
  filature: { nom: string } | null
  fournisseur: { nom: string } | null
  lots: { id: string; avancement_pct: number }[] | null
}

interface Props {
  user: { id: string; email?: string }
  profil: { role?: string; entreprise_id?: string } | null
  commandes: Commande[]
  entreprises: Entreprise[]
}

const STATUT_LABELS: Record<StatutCommande, string> = {
  brouillon:              'Brouillon',
  soumise:                'Transmise',
  validation_fournisseur: 'Val. fournisseur',
  validation_filature:    'Val. filature',
  validation_finale:      'Val. finale',
  en_production:          'En production',
  controle_qualite:       'Controle qualite',
  qr_genere:              'QR genere',
  expediee:               'Expediee',
  livree:                 'Livrée',
  annulee:                'Annulée',
}

const STATUT_COLORS: Record<string, [string, string, string]> = {
  brouillon:              ['#f5f3ef', '#4a5568', '#8b7355'],
  soumise:                ['#DBEAFE', '#1E40AF', '#3B82F6'],
  validation_fournisseur: ['#fdf8ec', '#b8860b', '#F59E0B'],
  validation_filature:    ['#fdf8ec', '#b8860b', '#F59E0B'],
  validation_finale:      ['#fdf8ec', '#b8860b', '#F59E0B'],
  en_production:          ['#D1ECF1', '#0C5460', '#06B6D4'],
  controle_qualite:       ['#fdf8ec', '#b8860b', '#F59E0B'],
  qr_genere:              ['#f0f4ec', '#2d5016', '#2d5016'],
  expediee:               ['#f0f4ec', '#2d5016', '#2d5016'],
  livree:                 ['#f0f4ec', '#2d5016', '#2d5016'],
  annulee:                ['#FEE2E2', '#991B1B', '#EF4444'],
}

const ETAPES = [
  'soumise', 'validation_fournisseur', 'validation_filature',
  'validation_finale', 'en_production', 'qr_genere', 'livree'
]

const GRAMMAGES = ['Ne 10/1','Ne 20/1','Ne 30/1','Ne 40/1','Ne 50/1','Ne 20/2','Ne 30/2']

function extractGrammageNumber(g: string): number | null {
  const match = g.match(/Ne\s*(\d+)/)
  return match ? parseInt(match[1]) : null
}

export default function CommandesClient({ user, profil, commandes: initial, entreprises }: Props) {
  const supabase = createClient()
  const [commandes, setCommandes] = useState<Commande[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Commande | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [filterMarque, setFilterMarque] = useState('')
  const [filterFilature, setFilterFilature] = useState('')
  const [filterDateDebut, setFilterDateDebut] = useState('')
  const [filterDateFin, setFilterDateFin] = useState('')

  const [form, setForm] = useState({
    titre: '',
    marque_id: '',
    filature_id: '',
    fournisseur_id: '',
    volume_recycle_kg: '',
    grammage: '',
    date_livraison_souhaitee: '',
    priorite: 'normale',
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const marques      = entreprises.filter(e => e.type === 'marque')
  const filatures    = entreprises.filter(e => e.type === 'filature')
  const fournisseurs = entreprises.filter(e => e.type === 'fournisseur_coton')

  const filtrees = commandes.filter(c => {
    if (filterStatut !== 'tous' && c.statut !== filterStatut) return false
    if (filterMarque && c.marque?.nom !== filterMarque) return false
    if (filterFilature && c.filature?.nom !== filterFilature) return false
    if (filterDateDebut && new Date(c.created_at) < new Date(filterDateDebut)) return false
    if (filterDateFin && new Date(c.created_at) > new Date(filterDateFin)) return false
    return true
  })

  const etapeIndex = (statut: string) => ETAPES.indexOf(statut)

  const volumeRecycle = parseFloat(form.volume_recycle_kg) || 0
  const volumeVierge  = Math.round(volumeRecycle * 49 / 51 * 100) / 100
  const volumeTotal   = Math.round((volumeRecycle + volumeVierge) * 100) / 100

  const creerCommande = async () => {
    if (!form.marque_id || !form.filature_id || !form.fournisseur_id || !form.date_livraison_souhaitee) {
      setError('Veuillez remplir tous les champs obligatoires : Marque, Filature, Fournisseur et Date de livraison.')
      return
    }
    if (!form.volume_recycle_kg || volumeRecycle <= 0) {
      setError('Veuillez indiquer un volume de coton recycle superieur a 0.')
      return
    }
    setError('')
    setLoading(true)

    const grammageNum = form.grammage ? extractGrammageNumber(form.grammage) : null

    const { data: refData } = await supabase.rpc('generate_commande_reference')

    if (!refData) {
      setError('Erreur lors de la generation de la reference.')
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('commandes')
      .insert({
        reference: refData,
        titre: form.titre || null,
        marque_id: form.marque_id,
        filature_id: form.filature_id,
        fournisseur_id: form.fournisseur_id,
        type_coton: 'mixte',
        volume_recycle_tonnes: volumeRecycle / 1000,
        volume_vierge_tonnes: volumeVierge / 1000,
        volume_total_tonnes: (volumeRecycle + volumeVierge) / 1000,
        grammage: grammageNum,
        date_livraison_souhaitee: form.date_livraison_souhaitee,
        priorite: form.priorite,
        notes: form.notes || null,
        statut: 'en_production',
        created_by: user.id,
      })
      .select(`*,marque:entreprises!commandes_marque_id_fkey(nom),filature:entreprises!commandes_filature_id_fkey(nom),fournisseur:entreprises!commandes_fournisseur_id_fkey(nom)`)
      .single()

  if (insertError) {
      console.error('INSERT ERROR:', insertError)
      setError('Erreur lors de la creation : ' + insertError.message)
      setLoading(false)
      return
    }
    console.log('INSERT SUCCESS:', data)
    setCommandes(prev => [data as Commande, ...prev])
    setShowForm(false)
    setForm({
      titre: '', marque_id: '', filature_id: '', fournisseur_id: '',
      volume_recycle_kg: '', grammage: '',
      date_livraison_souhaitee: '', priorite: 'normale', notes: '',
    })
    setLoading(false)
  }

  const labelInput = (label: string) => (
    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>
      {label}
    </label>
  )

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1.5px solid #d4c5b0', fontSize: 13,
    boxSizing: 'border-box' as const, outline: 'none', background: '#fff'
  }

  const selectStyle = { ...inputStyle }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{
          padding: '14px 22px', background: '#fff', borderBottom: '1px solid #e8e3d8',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexShrink: 0
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {['tous', 'soumise', 'en_production', 'livree'].map(s => (
              <button key={s} onClick={() => setFilterStatut(s)} style={{
                padding: '5px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: filterStatut === s ? 700 : 500,
                background: filterStatut === s ? '#1a1a1a' : '#f5f3ef',
                color: filterStatut === s ? '#fff' : '#4a5568'
              }}>
                {s === 'tous' ? 'Toutes' : s === 'soumise' ? 'Transmises' : STATUT_LABELS[s as StatutCommande]}
              </button>
            ))}
            <select value={filterMarque} onChange={e => setFilterMarque(e.target.value)} style={{ padding: '5px 10px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 11, outline: 'none', background: filterMarque ? '#1a1a1a' : '#f5f3ef', color: filterMarque ? '#fff' : '#4a5568' }}>
              <option value="">Toutes marques</option>
              {marques.map(m => <option key={m.id} value={m.nom}>{m.nom}</option>)}
            </select>
            <select value={filterFilature} onChange={e => setFilterFilature(e.target.value)} style={{ padding: '5px 10px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 11, outline: 'none', background: filterFilature ? '#1a1a1a' : '#f5f3ef', color: filterFilature ? '#fff' : '#4a5568' }}>
              <option value="">Toutes filatures</option>
              {filatures.map(f => <option key={f.id} value={f.nom}>{f.nom}</option>)}
            </select>
            <input type="date" value={filterDateDebut} onChange={e => setFilterDateDebut(e.target.value)} style={{ padding: '5px 8px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 11, outline: 'none' }} />
            <input type="date" value={filterDateFin} onChange={e => setFilterDateFin(e.target.value)} style={{ padding: '5px 8px', borderRadius: 4, border: '1.5px solid #d4c5b0', fontSize: 11, outline: 'none' }} />
            {(filterMarque || filterFilature || filterDateDebut || filterDateFin) && (
              <button onClick={() => { setFilterMarque(''); setFilterFilature(''); setFilterDateDebut(''); setFilterDateFin('') }} style={{ padding: '5px 10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#fff', fontSize: 11, color: '#8b7355', cursor: 'pointer' }}>
                Reinitialiser
              </button>
            )}
          </div>
          {(profil?.role === 'admin' || profil?.role === 'marque' || profil?.role === 'filature') && (
            <button onClick={() => setShowForm(true)} style={{
              padding: '8px 16px', borderRadius: 4, border: 'none',
              background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0
            }}>+ Nouvelle commande</button>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>
          {filtrees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b7355' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>◈</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune commande</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Cliquez sur "+ Nouvelle commande" pour commencer</div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f3ef' }}>
                    {['Reference', 'Marque', 'Filature', 'Volume', 'Composition', 'Statut', 'Livraison'].concat(selected ? [] : ['Avancement']).map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#8b7355', textAlign: 'left', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrees.map((c) => {
                    const [bg, tc, dot] = STATUT_COLORS[c.statut] ?? ['#f5f3ef', '#4a5568', '#8b7355']
                    const etape = etapeIndex(c.statut)
                    return (
                      <tr key={c.id}
                        onClick={() => setSelected(c)}
                        style={{ borderTop: '1px solid #f5f3ef', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f5f3ef'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{c.reference}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#4a5568' }}>{c.marque?.nom ?? '-'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#4a5568' }}>{c.filature?.nom ?? '-'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 600 }}>{Math.round((c.volume_total_tonnes ?? 0) * 1000).toLocaleString('fr-FR')} kg</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>
                            {Math.round(c.pct_recycle ?? 0)}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                            background: bg, color: tc, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot }} />
                            {STATUT_LABELS[c.statut]}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 11, color: '#8b7355', whiteSpace: 'nowrap' }}>
                          {new Date(c.date_livraison_souhaitee).toLocaleDateString('fr-FR')}
                        </td>
                        {!selected && (
                          <td style={{ padding: '12px 14px', minWidth: 120 }}>
                            <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                              {ETAPES.map((_, idx) => (
                                <div key={idx} style={{
                                  width: 14, height: 4, borderRadius: 2,
                                  background: idx <= etape ? '#1a1a1a' : '#d4c5b0'
                                }} />
                              ))}
                            </div>
                            {c.lots && c.lots.length > 0 && (() => {
                              const avProd = Math.round(c.lots!.reduce((s, l) => s + l.avancement_pct, 0) / c.lots!.length)
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                  <div style={{ flex: 1, height: 3, background: '#d4c5b0', borderRadius: 2 }}>
                                    <div style={{ height: '100%', width: avProd + '%', background: avProd === 100 ? '#2d5016' : '#c2956e', borderRadius: 2 }} />
                                  </div>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: avProd === 100 ? '#2d5016' : '#c2956e', flexShrink: 0 }}>{avProd + '%'}</span>
                                </div>
                              )
                            })()}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div style={{
          width: 320, minWidth: 320, background: '#fff',
          borderLeft: '1px solid #e8e3d8', display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid #f5f3ef',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>{selected.reference}</span>
            <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'none', fontSize: 16, color: '#8b7355', cursor: 'pointer' }}>x</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '18px' }}>
            <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)', borderRadius: 6, padding: '16px', color: '#fff', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{selected.reference}</div>
              {selected.titre && <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 10 }}>{selected.titre}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['Volume', String(Math.round((selected.volume_total_tonnes ?? 0) * 1000).toLocaleString('fr-FR')) + ' kg'],
                  ['Recycle', String(Math.round(selected.pct_recycle ?? 0)) + '%'],
                  ['Priorite', selected.priorite],
                  ['Livraison', new Date(selected.date_livraison_souhaitee).toLocaleDateString('fr-FR')],
                ].map(([l, v]) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#c2956e' }}>{v}</div>
                    <div style={{ fontSize: 9, opacity: 0.65 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {[
              ['Marque', selected.marque?.nom],
              ['Filature', selected.filature?.nom],
              ['Fournisseur', selected.fournisseur?.nom],
              ['Type coton', 'Fil ETHYS (51% recycle / 49% vierge)'],
              ['Grammage', selected.grammage ? 'Ne ' + selected.grammage + '/1' : '-'],
              ['Statut', STATUT_LABELS[selected.statut]],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#8b7355', width: 100, flexShrink: 0 }}>{l}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{v ?? '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '22px 28px', borderBottom: '1px solid #f5f3ef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Nouvelle commande ETHYS</span>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, color: '#8b7355', cursor: 'pointer' }}>x</button>
            </div>
            <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                {labelInput('Titre / reference interne')}
                <input value={form.titre} onChange={e => set('titre', e.target.value)}
                  placeholder="Ex : Collection Printemps 2024" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  {labelInput('Marque *')}
                  <select value={form.marque_id} onChange={e => set('marque_id', e.target.value)} style={selectStyle}>
                    <option value="">Selectionner...</option>
                    {marques.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                  </select>
                </div>
                <div>
                  {labelInput('Filature *')}
                  <select value={form.filature_id} onChange={e => set('filature_id', e.target.value)} style={selectStyle}>
                    <option value="">Selectionner...</option>
                    {filatures.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  </select>
                </div>
                <div>
                  {labelInput('Fournisseur *')}
                  <select value={form.fournisseur_id} onChange={e => set('fournisseur_id', e.target.value)} style={selectStyle}>
                    <option value="">Selectionner...</option>
                    {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>Composition Fil ETHYS</div>
                <div style={{ fontSize: 11, color: '#4a5568' }}>51% coton recycle + 49% coton vierge</div>
              </div>

              <div>
                {labelInput('Volume de coton recycle (kg) *')}
                <input type="number" min="0" value={form.volume_recycle_kg}
                  onChange={e => set('volume_recycle_kg', e.target.value)}
                  placeholder="Ex : 510" style={inputStyle} />
                {volumeRecycle > 0 && (
                  <div style={{ marginTop: 8, padding: '10px 12px', background: '#f5f3ef', borderRadius: 6, fontSize: 12, color: '#4a5568' }}>
                    Volume vierge calcule : <strong>{volumeVierge.toLocaleString('fr-FR')} kg</strong>
                    {' — '}Volume total : <strong>{volumeTotal.toLocaleString('fr-FR')} kg</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  {labelInput('Grammage')}
                  <select value={form.grammage} onChange={e => set('grammage', e.target.value)} style={selectStyle}>
                    <option value="">-</option>
                    {GRAMMAGES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  {labelInput('Livraison souhaitee *')}
                  <input type="date" value={form.date_livraison_souhaitee}
                    onChange={e => set('date_livraison_souhaitee', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  {labelInput('Priorite')}
                  <select value={form.priorite} onChange={e => set('priorite', e.target.value)} style={selectStyle}>
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                {labelInput('Notes')}
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="Instructions particulieres..." rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fdf0f0', border: '1px solid #c8a0a0', fontSize: 12, color: '#8b3a3a' }}>{error}</div>
              )}

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setShowForm(false)} style={{
                  flex: 1, padding: '10px', borderRadius: 4,
                  border: '1.5px solid #e8e3d8', background: '#f5f3ef',
                  color: '#8b7355', fontSize: 13, cursor: 'pointer'
                }}>Annuler</button>
                <button onClick={creerCommande} disabled={loading} style={{
                  flex: 2, padding: '10px', borderRadius: 4, border: 'none',
                  background: loading ? '#d4c5b0' : '#1a1a1a',
                  color: loading ? '#8b7355' : '#fff',
                  fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer'
                }}>
                  {loading ? 'Creation...' : 'Creer la commande ETHYS'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
