'use client'

import { useState, useMemo } from 'react'

const certColors: Record<string, [string, string]> = {
  GOTS:      ['#D1FAE5', '#065F46'],
  GRS:       ['#DBEAFE', '#1E40AF'],
  'OCS 100': ['#FEF3C7', '#92400E'],
  BCI:       ['#F3E8FF', '#6B21A8'],
  'ISO 14001':['#F1F5F9', '#475569'],
}

const typeColors: Record<string, [string, string]> = {
  marque:           ['#DBEAFE', '#1E40AF'],
  filature:         ['#D1FAE5', '#065F46'],
  fournisseur_coton:['#FEF3C7', '#92400E'],
}

interface Partenaire {
  id: string
  nom: string
  type: string
  statut: string
  pays: string
  ville: string
  description: string | null
  capacite_annuelle_tonnes: number | null
  email_contact: string | null
  certifications: { label: string; valide: boolean }[]
  notations: { note_moyenne: number }[]
}

interface Props {
  partenaires: Partenaire[]
  paysList: string[]
}

export default function AnnuaireClient({ partenaires, paysList }: Props) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('Tous')
  const [filterPays, setFilterPays] = useState('Tous')
  const [selected, setSelected] = useState<Partenaire | null>(null)

  const types = ['Tous', 'marque', 'filature', 'fournisseur_coton']

  const filtered = useMemo(() => {
    return partenaires.filter(p => {
      if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) &&
          !p.ville?.toLowerCase().includes(search.toLowerCase())) return false
      if (filterType !== 'Tous' && p.type !== filterType) return false
      if (filterPays !== 'Tous' && p.pays !== filterPays) return false
      return true
    })
  }, [partenaires, search, filterType, filterPays])

  const noteMoyenne = (p: Partenaire) => {
    if (!p.notations?.length) return null
    const sum = p.notations.reduce((s, n) => s + n.note_moyenne, 0)
    return (sum / p.notations.length).toFixed(1)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Filtres */}
      <div style={{
        width: 220, minWidth: 220, background: '#fff',
        borderRight: '1px solid #EEF0F3', padding: '16px 14px', overflowY: 'auto'
      }}>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 12 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nom, ville…"
            style={{
              width: '100%', padding: '7px 8px 7px 26px', borderRadius: 8,
              border: '1.5px solid #E2E8F0', fontSize: 12,
              boxSizing: 'border-box', outline: 'none'
            }}
          />
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' }}>Type</div>
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '7px 10px', borderRadius: 8, border: 'none',
            cursor: 'pointer', fontSize: 12, marginBottom: 2,
            background: filterType === t ? '#D1FAE5' : 'transparent',
            color: filterType === t ? '#065F46' : '#64748B',
            fontWeight: filterType === t ? 700 : 400
          }}>
            {t === 'Tous' ? 'Tous' :
             t === 'marque' ? 'Marques' :
             t === 'filature' ? 'Filatures' : 'Fournisseurs coton'}
          </button>
        ))}

        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', margin: '14px 0 6px', textTransform: 'uppercase' }}>Pays</div>
        <select
          value={filterPays}
          onChange={e => setFilterPays(e.target.value)}
          style={{
            width: '100%', padding: '7px 10px', borderRadius: 8,
            border: '1.5px solid #E2E8F0', fontSize: 12,
            background: '#F8FAFC', outline: 'none'
          }}
        >
          <option>Tous</option>
          {paysList.map(p => <option key={p}>{p}</option>)}
        </select>

        <div style={{ marginTop: 12, fontSize: 11, color: '#94A3B8' }}>
          <span style={{ fontWeight: 700, color: '#0A3D26' }}>{filtered.length}</span> résultat(s)
        </div>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 18px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun partenaire trouvé</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr' : '1fr 1fr', gap: 12 }}>
            {filtered.map(p => {
              const [tbg, ttc] = typeColors[p.type] ?? ['#F1F5F9', '#475569']
              const note = noteMoyenne(p)
              return (
                <div key={p.id} onClick={() => setSelected(p)} style={{
                  background: '#fff', borderRadius: 12,
                  border: `2px solid ${selected?.id === p.id ? '#0A3D26' : '#EEF0F3'}`,
                  padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: selected?.id === p.id ? '0 0 0 3px rgba(10,61,38,0.08)' : '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{p.nom}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>📍 {p.ville}, {p.pays}</div>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      background: p.statut === 'verifie' ? '#D1FAE5' : '#FEF3C7',
                      color: p.statut === 'verifie' ? '#065F46' : '#92400E',
                      height: 'fit-content'
                    }}>
                      {p.statut === 'verifie' ? '✓ Vérifié' : '⏳ En cours'}
                    </span>
                  </div>

                  {p.description && (
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8, lineHeight: 1.5 }}>
                      {p.description.slice(0, 100)}{p.description.length > 100 ? '…' : ''}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: tbg, color: ttc }}>
                      {p.type === 'fournisseur_coton' ? 'Fournisseur' : p.type.charAt(0).toUpperCase() + p.type.slice(1)}
                    </span>
                    {p.certifications?.filter(c => c.valide).slice(0, 3).map(c => {
                      const [bg, tc] = certColors[c.label] ?? ['#F1F5F9', '#475569']
                      return (
                        <span key={c.label} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: bg, color: tc }}>
                          {c.label}
                        </span>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    {note ? (
                      <span style={{ color: '#F59E0B', fontWeight: 700 }}>★ {note}</span>
                    ) : (
                      <span style={{ color: '#CBD5E1' }}>Pas encore noté</span>
                    )}
                    {p.capacite_annuelle_tonnes && (
                      <span style={{ color: '#64748B' }}>{p.capacite_annuelle_tonnes}T/an</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Panneau détail */}
      {selected && (
        <div style={{
          width: 300, minWidth: 300, background: '#fff',
          borderLeft: '1px solid #EEF0F3', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid #F1F5F9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#0A3D26' }}>Fiche partenaire</span>
            <button onClick={() => setSelected(null)} style={{
              border: 'none', background: 'none', fontSize: 16, color: '#94A3B8', cursor: 'pointer'
            }}>✕</button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '18px' }}>
            <div style={{
              background: 'linear-gradient(135deg,#0A3D26,#0D5C3A)',
              borderRadius: 12, padding: '18px', marginBottom: 14, color: '#fff'
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{selected.nom}</div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>{selected.type} · {selected.ville}, {selected.pays}</div>
              {selected.capacite_annuelle_tonnes && (
                <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#6EE7B7' }}>{selected.capacite_annuelle_tonnes}T</div>
                  <div style={{ fontSize: 10, opacity: 0.65 }}>Capacité annuelle</div>
                </div>
              )}
            </div>

            {selected.description && (
              <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 14 }}>
                {selected.description}
              </p>
            )}

            <div style={{ fontSize: 11, fontWeight: 700, color: '#0A3D26', marginBottom: 8, textTransform: 'uppercase' }}>
              Certifications
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {selected.certifications?.length === 0 ? (
                <span style={{ fontSize: 11, color: '#94A3B8' }}>Aucune certification</span>
              ) : selected.certifications?.filter(c => c.valide).map(c => {
                const [bg, tc] = certColors[c.label] ?? ['#F1F5F9', '#475569']
                return (
                  <span key={c.label} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color: tc }}>
                    ✓ {c.label}
                  </span>
                )
              })}
            </div>

            {selected.email_contact && (
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                📧 {selected.email_contact}
              </div>
            )}
          </div>

          <div style={{ padding: '12px 18px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8 }}>
            <button style={{
              flex: 1, padding: '9px', borderRadius: 10, border: 'none',
              background: '#0A3D26', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}>✉ Contacter</button>
          </div>
        </div>
      )}
    </div>
  )
}