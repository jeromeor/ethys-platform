'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type StatutFacture = 'brouillon' | 'emise' | 'en_attente' | 'payee' | 'en_retard' | 'annulee'

interface LigneFacture {
  id: string
  description: string
  quantite: number
  unite: string
  prix_unitaire: number
  total_ht: number
}

interface Facture {
  id: string
  reference: string
  statut: StatutFacture
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  tva_pct: number
  date_emission: string
  date_echeance: string
  date_paiement: string | null
  notes: string | null
  lignes: LigneFacture[]
  commande: { reference: string; volume_total_tonnes: number } | null
  emetteur: { nom: string; adresse: string | null; email_contact: string | null } | null
  destinataire_id: string | null
  destinataire: { nom: string; adresse: string | null; email_contact: string | null } | null
}

interface Commande {
  id: string
  reference: string
  volume_total_tonnes: number
  pct_recycle: number
  marque: { id: string; nom: string } | null
  filature: { id: string; nom: string } | null
}

interface Entreprise { id: string; nom: string; type: string }

interface AccordCommercial {
  id: string
  entreprise_id: string
  prix_base_kg: number
  remise_volume_annuel_pct: number
  seuil_volume_annuel_tonnes: number
  date_debut: string
  date_fin: string | null
  notes: string | null
  entreprise: { nom: string } | null
}

interface Props {
  factures: Facture[]
  commandes: Commande[]
  entreprises: Entreprise[]
  accords: AccordCommercial[]
  profil: { role: string; entreprise_id: string }
  user: { id: string }
}

const STATUT_COLORS: Record<StatutFacture, [string, string, string]> = {
  brouillon:  ['#F1F5F9', '#475569', '#94A3B8'],
  emise:      ['#DBEAFE', '#1E40AF', '#3B82F6'],
  en_attente: ['#FEF3C7', '#92400E', '#F59E0B'],
  payee:      ['#D1FAE5', '#065F46', '#10B981'],
  en_retard:  ['#FEE2E2', '#991B1B', '#EF4444'],
  annulee:    ['#F1F5F9', '#475569', '#94A3B8'],
}

const STATUT_LABELS: Record<StatutFacture, string> = {
  brouillon:  'Brouillon',
  emise:      'Émises',
  en_attente: 'En attente',
  payee:      'Payée',
  en_retard:  'En retard',
  annulee:    'Annulée',
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function FacturationClient({ factures: initial, commandes, entreprises, accords: accordsInitial, profil, user }: Props) {
  const supabase = createClient()
  const [factures, setFactures] = useState<Facture[]>(initial)
  const [selected, setSelected] = useState<Facture | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterStatut, setFilterStatut] = useState('tous')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'factures' | 'accords'>('factures')
  const [accords, setAccords] = useState<AccordCommercial[]>(accordsInitial)
  const [showAccordForm, setShowAccordForm] = useState(false)
  const [accordForm, setAccordForm] = useState({
    entreprise_id: '',
    prix_base_kg: '0.60',
    remise_volume_annuel_pct: '0',
    seuil_volume_annuel_tonnes: '0',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    notes: ''
  })
  const isAdmin = profil.role === 'admin'

  const [form, setForm] = useState({
    commande_id: '',
    emetteur_id: '',
    destinataire_id: '',
    date_echeance: '',
    tva_pct: '20',
    notes: '',
    lignes: [{ description: '', quantite: '', prix_unitaire: '', unite: 'T' }]
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const updateLigne = (i: number, k: string, v: string) => {
    setForm(f => ({
      ...f,
      lignes: f.lignes.map((l, idx) => idx === i ? { ...l, [k]: v } : l)
    }))
  }

  const addLigne = () => setForm(f => ({
    ...f,
    lignes: [...f.lignes, { description: '', quantite: '', prix_unitaire: '', unite: 'T' }]
  }))

  const totalHT = form.lignes.reduce((s, l) => {
    return s + (parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0)
  }, 0)

  const filtrees = factures.filter(f =>
    filterStatut === 'tous' || f.statut === filterStatut
  )

  const totalCA = factures.filter(f => f.statut === 'payee').reduce((s, f) => s + f.montant_ttc, 0)
  const totalAttente = factures.filter(f => f.statut === 'en_attente').reduce((s, f) => s + f.montant_ttc, 0)
  const totalRetard = factures.filter(f => f.statut === 'en_retard').reduce((s, f) => s + f.montant_ttc, 0)

  const creerFacture = async () => {
    if (!form.commande_id || !form.emetteur_id || !form.destinataire_id || !form.date_echeance) return
    setLoading(true)

    const { data: facture, error } = await supabase
      .from('factures')
      .insert({
        commande_id: form.commande_id,
        emetteur_id: form.emetteur_id,
        destinataire_id: form.destinataire_id,
        montant_ht: totalHT,
        tva_pct: parseFloat(form.tva_pct),
        date_echeance: form.date_echeance,
        statut: 'emise',
        notes: form.notes || null,
      })
      .select('id')
      .single()

    if (!error && facture) {
      // Insérer les lignes
      await supabase.from('lignes_facture').insert(
        form.lignes
          .filter(l => l.description && l.quantite && l.prix_unitaire)
          .map(l => ({
            facture_id: facture.id,
            description: l.description,
            quantite: parseFloat(l.quantite),
            unite: l.unite,
            prix_unitaire: parseFloat(l.prix_unitaire),
          }))
      )

      // Recharger
      const { data: newFacture } = await supabase
        .from('factures')
        .select(`
          *,
          lignes:lignes_facture(*),
          commande:commandes(reference, volume_total_tonnes),
          emetteur:entreprises!factures_emetteur_id_fkey(nom, adresse, email_contact),
          destinataire:entreprises!factures_destinataire_id_fkey(nom, adresse, email_contact)
        `)
        .eq('id', facture.id)
        .single()

      if (newFacture) setFactures(prev => [newFacture as Facture, ...prev])
      setShowForm(false)
    }
    setLoading(false)
  }

  const marquerPayee = async (id: string) => {
    await supabase.from('factures').update({
      statut: 'payee',
      date_paiement: new Date().toISOString().split('T')[0]
    }).eq('id', id)

    setFactures(prev => prev.map(f =>
      f.id === id ? { ...f, statut: 'payee', date_paiement: new Date().toISOString().split('T')[0] } : f
    ))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, statut: 'payee' } : null)
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1.5px solid #E2E8F0', fontSize: 12,
    boxSizing: 'border-box' as const, outline: 'none'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '16px 22px', background: '#F7F8FA', flexShrink: 0 }}>
        {[
          { label: 'Total facturé', value: fmt(factures.reduce((s, f) => s + f.montant_ttc, 0)), bg: '#fff', color: '#0A3D26' },
          { label: 'Encaissé', value: fmt(totalCA), bg: '#F0FDF4', color: '#065F46' },
          { label: 'En attente', value: fmt(totalAttente), bg: '#FFFBEB', color: '#92400E' },
          { label: 'En retard', value: fmt(totalRetard), bg: '#FEF2F2', color: '#991B1B' },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, borderRadius: 12, border: '1px solid #EEF0F3', padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Barre outils */}
      <div style={{
        padding: '10px 22px', background: '#fff', borderBottom: '1px solid #EEF0F3',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['tous', 'emise', 'en_attente', 'payee', 'en_retard'].map(s => (
            <button key={s} onClick={() => setFilterStatut(s)} style={{
              padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: filterStatut === s ? 700 : 500,
              background: filterStatut === s ? '#0A3D26' : '#F1F5F9',
              color: filterStatut === s ? '#fff' : '#64748B'
            }}>
              {s === 'tous' ? 'Toutes' : STATUT_LABELS[s as StatutFacture]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && (
            <button onClick={() => setActiveTab(activeTab === 'accords' ? 'factures' : 'accords')} style={{
              padding: '7px 14px', borderRadius: 8, border: '1.5px solid #0A3D26',
              background: activeTab === 'accords' ? '#0A3D26' : '#fff',
              color: activeTab === 'accords' ? '#fff' : '#0A3D26', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}>★ Accords commerciaux</button>
          )}
          <button onClick={() => setShowForm(true)} style={{
            padding: '7px 14px', borderRadius: 8, border: 'none',
            background: '#0A3D26', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer'
          }}>＋ Nouvelle facture</button>
        </div>
      </div>

      {/* Onglet Accords commerciaux */}
      {activeTab === 'accords' && isAdmin && (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0A3D26' }}>Accords commerciaux</div>
            <button onClick={() => setShowAccordForm(true)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nouvel accord</button>
          </div>
          {accords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8', fontSize: 13 }}>Aucun accord commercial. Cliquez sur "+ Nouvel accord" pour en créer un.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {accords.map(a => (
                <div key={a.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #EEF0F3', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>{a.entreprise?.nom ?? '-'}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                        Du {new Date(a.date_debut).toLocaleDateString('fr-FR')} 
                        {a.date_fin ? ` au ${new Date(a.date_fin).toLocaleDateString('fr-FR')}` : ' (illimité)'}
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#D1FAE5', color: '#065F46' }}>Actif</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F0FDF4' }}>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>Prix négocié/kg</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0A3D26' }}>{Number(a.prix_base_kg).toFixed(4)}€</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>Base: 0.60€</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#FEF3C7' }}>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>Remise volume annuel</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#92400E' }}>{a.remise_volume_annuel_pct}%</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>Dès {a.seuil_volume_annuel_tonnes}T/an</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F8FAFC' }}>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2 }}>Remise palier commande</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>1% ≥ 5T · 2% ≥ 10T</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>Standard ETHYS</div>
                    </div>
                  </div>
                  {a.notes && <div style={{ fontSize: 11, color: '#64748B', marginTop: 10, fontStyle: 'italic', padding: '8px 10px', borderRadius: 6, background: '#F8FAFC' }}>{a.notes}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Modal nouvel accord */}
          {showAccordForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowAccordForm(false)}>
              <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0A3D26' }}>Nouvel accord commercial</span>
                  <button onClick={() => setShowAccordForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#94A3B8' }}>x</button>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Marque *</label>
                  <select value={accordForm.entreprise_id} onChange={e => setAccordForm(f => ({ ...f, entreprise_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none' }}>
                    <option value="">Sélectionner une marque...</option>
                    {entreprises.filter(e => e.type === 'marque').map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Prix négocié (€/kg) *</label>
                    <input type="number" step="0.0001" value={accordForm.prix_base_kg} onChange={e => setAccordForm(f => ({ ...f, prix_base_kg: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Remise annuelle (%)</label>
                    <input type="number" step="0.01" value={accordForm.remise_volume_annuel_pct} onChange={e => setAccordForm(f => ({ ...f, remise_volume_annuel_pct: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Seuil volume annuel (T)</label>
                    <input type="number" value={accordForm.seuil_volume_annuel_tonnes} onChange={e => setAccordForm(f => ({ ...f, seuil_volume_annuel_tonnes: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Date fin (optionnel)</label>
                    <input type="date" value={accordForm.date_fin} onChange={e => setAccordForm(f => ({ ...f, date_fin: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Notes (optionnel)</label>
                  <textarea value={accordForm.notes} onChange={e => setAccordForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none', resize: 'none', boxSizing: 'border-box' as const }} />
                </div>
                <button onClick={async () => {
                  if (!accordForm.entreprise_id || !accordForm.prix_base_kg) return
                  const { data, error } = await supabase.from('accords_commerciaux').insert({
                    entreprise_id: accordForm.entreprise_id,
                    prix_base_kg: parseFloat(accordForm.prix_base_kg),
                    remise_volume_annuel_pct: parseFloat(accordForm.remise_volume_annuel_pct) || 0,
                    seuil_volume_annuel_tonnes: parseFloat(accordForm.seuil_volume_annuel_tonnes) || 0,
                    date_debut: new Date().toISOString().split('T')[0],
                    date_fin: accordForm.date_fin || null,
                    notes: accordForm.notes || null,
                    created_by: user.id
                  }).select('*, entreprise:entreprises(nom)').single()
                  if (!error && data) {
                    setAccords(prev => [data as AccordCommercial, ...prev])
                    setShowAccordForm(false)
                  }
                }} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Enregistrer l'accord
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {activeTab === 'factures' && <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>
        {filtrees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>◫</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune facture</div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Référence', 'Émetteur', 'Destinataire', 'Montant TTC', 'Émission', 'Échéance', 'Statut', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrees.map((f, i) => {
                  const [bg, tc, dot] = STATUT_COLORS[f.statut]
                  return (
                    <tr key={f.id}
                      onClick={() => setSelected(f)}
                      style={{ borderTop: '1px solid #F1F5F9', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFC'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#0A3D26' }}>{f.reference}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#475569' }}>{f.emetteur?.nom ?? '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#475569' }}>{f.destinataire?.nom ?? '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#1A202C' }}>{fmt(f.montant_ttc)}</td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: '#94A3B8' }}>{new Date(f.date_emission).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: f.statut === 'en_retard' ? '#DC2626' : '#94A3B8', fontWeight: f.statut === 'en_retard' ? 700 : 400 }}>
                        {new Date(f.date_echeance).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: bg, color: tc, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot }} />
                          {STATUT_LABELS[f.statut]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button onClick={e => { e.stopPropagation(); setSelected(f) }} style={{
                          padding: '4px 10px', borderRadius: 7, border: '1.5px solid #EEF0F3',
                          background: '#F8FAFC', fontSize: 11, cursor: 'pointer'
                        }}>Voir →</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>}

      {/* Modal détail facture */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 20
        }} onClick={() => setSelected(null)}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620,
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>

            {/* En-tête */}
            <div style={{
              background: 'linear-gradient(135deg,#0A3D26,#0D5C3A)',
              borderRadius: '20px 20px 0 0', padding: '24px 28px', color: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#6EE7B7', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>FACTURE ETHYS</div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{selected.reference}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>Réf. commande : {selected.commande?.reference}</div>
                  {/* Decomposition prix - visible admin et marque uniquement */}
                  {(isAdmin || accords.some(a => a.entreprise_id === selected.destinataire_id)) && (() => {
                    const accord = accords.find(a => a.entreprise_id === selected.destinataire_id)
                    const vol = selected.commande?.volume_total_tonnes ?? 0
                    const prixBase = accord ? accord.prix_base_kg : 0.60
                    const remisePalier = vol >= 10 ? 2 : vol >= 5 ? 1 : 0
                    const remiseAnnuelle = accord?.remise_volume_annuel_pct ?? 0
                    const prixFinal = prixBase * (1 - remisePalier/100) * (1 - remiseAnnuelle/100)
                    return (
                      <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #A7F3D0' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#065F46', marginBottom: 8, textTransform: 'uppercase' }}>
                          {accord ? '★ Prix accord commercial' : 'Décomposition du prix'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          <div style={{ fontSize: 11, color: '#475569' }}>Prix de base</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#0A3D26', textAlign: 'right' }}>{prixBase.toFixed(4)}€/kg</div>
                          {remisePalier > 0 && <>
                            <div style={{ fontSize: 11, color: '#475569' }}>Remise volume commande</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#065F46', textAlign: 'right' }}>-{remisePalier}%</div>
                          </>}
                          {remiseAnnuelle > 0 && <>
                            <div style={{ fontSize: 11, color: '#475569' }}>Remise volume annuel</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#065F46', textAlign: 'right' }}>-{remiseAnnuelle}%</div>
                          </>}
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0A3D26', borderTop: '1px solid #A7F3D0', paddingTop: 6 }}>Prix applicable</div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#0A3D26', textAlign: 'right', borderTop: '1px solid #A7F3D0', paddingTop: 6 }}>{prixFinal.toFixed(4)}€/kg</div>
                        </div>
                        {accord?.notes && <div style={{ fontSize: 10, color: '#64748B', marginTop: 8, fontStyle: 'italic' }}>{accord.notes}</div>}
                      </div>
                    )
                  })()}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#6EE7B7' }}>{fmt(selected.montant_ttc)}</div>
                  <div style={{ fontSize: 10, opacity: 0.65 }}>TTC</div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: STATUT_COLORS[selected.statut][0],
                      color: STATUT_COLORS[selected.statut][1]
                    }}>{STATUT_LABELS[selected.statut]}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '22px 28px' }}>
              {/* Parties */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                {[
                  { titre: 'Émetteur', data: selected.emetteur },
                  { titre: 'Destinataire', data: selected.destinataire },
                ].map(({ titre, data }) => (
                  <div key={titre} style={{ padding: '12px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #EEF0F3' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' }}>{titre}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>{data?.nom ?? '—'}</div>
                    {data?.email_contact && <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{data.email_contact}</div>}
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  ["Date d'émission", new Date(selected.date_emission).toLocaleDateString('fr-FR')],
                  ["Date d'échéance", new Date(selected.date_echeance).toLocaleDateString('fr-FR')],
                  ["Date de paiement", selected.date_paiement ? new Date(selected.date_paiement).toLocaleDateString('fr-FR') : '—'],
                ].map(([l, v]) => (
                  <div key={l} style={{ padding: '10px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #EEF0F3' }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Lignes */}
              {selected.lignes?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0A3D26', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Détail des prestations
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #EEF0F3', borderRadius: 8, overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        {['Description', 'Qté', 'Unité', 'PU (€)', 'Total HT'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: '#94A3B8', textAlign: h === 'Description' ? 'left' : 'right', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.lignes.map((l, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>{l.description}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'right' }}>{l.quantite}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'right' }}>{l.unite}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'right' }}>{fmt(l.prix_unitaire)}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, textAlign: 'right', color: '#0A3D26' }}>{fmt(l.total_ht)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totaux */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <div style={{ width: 240 }}>
                  {[
                    ['Sous-total HT', fmt(selected.montant_ht)],
                    [`TVA ${selected.tva_pct}%`, fmt(selected.montant_tva)],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9', fontSize: 12 }}>
                      <span style={{ color: '#64748B' }}>{l}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
                    <span style={{ fontWeight: 700, color: '#0A3D26' }}>Total TTC</span>
                    <span style={{ fontWeight: 900, color: '#0A3D26', fontSize: 16 }}>{fmt(selected.montant_ttc)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                {selected.statut !== 'payee' && selected.statut !== 'annulee' && (
                  <button onClick={() => marquerPayee(selected.id)} style={{
                    flex: 2, padding: '10px', borderRadius: 10, border: 'none',
                    background: '#0A3D26', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}>✓ Marquer comme payée</button>
                )}
                <button onClick={() => setSelected(null)} style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: '1.5px solid #EEF0F3', background: '#F8FAFC',
                  color: '#94A3B8', fontSize: 13, cursor: 'pointer'
                }}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nouvelle facture */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0A3D26' }}>Nouvelle facture</span>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, color: '#94A3B8', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Commande *</label>
                <select value={form.commande_id} onChange={e => set('commande_id', e.target.value)} style={inputStyle}>
                  <option value="">Sélectionner…</option>
                  {commandes.map(c => <option key={c.id} value={c.id}>{c.reference} — {c.marque?.nom}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Émetteur *</label>
                  <select value={form.emetteur_id} onChange={e => set('emetteur_id', e.target.value)} style={inputStyle}>
                    <option value="">Sélectionner…</option>
                    {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Destinataire *</label>
                  <select value={form.destinataire_id} onChange={e => set('destinataire_id', e.target.value)} style={inputStyle}>
                    <option value="">Sélectionner…</option>
                    {entreprises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Date d'échéance *</label>
                  <input type="date" value={form.date_echeance} onChange={e => set('date_echeance', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>TVA (%)</label>
                  <input type="number" value={form.tva_pct} onChange={e => set('tva_pct', e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Lignes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 8 }}>Lignes de facturation</label>
                {form.lignes.map((l, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input value={l.description} onChange={e => updateLigne(i, 'description', e.target.value)}
                      placeholder="Description" style={inputStyle} />
                    <input type="number" value={l.quantite} onChange={e => updateLigne(i, 'quantite', e.target.value)}
                      placeholder="Qté" style={inputStyle} />
                    <input type="number" value={l.prix_unitaire} onChange={e => updateLigne(i, 'prix_unitaire', e.target.value)}
                      placeholder="PU €" style={inputStyle} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 12, fontWeight: 700, color: '#0A3D26' }}>
                      {((parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0)).toLocaleString('fr-FR')} €
                    </div>
                  </div>
                ))}
                <button onClick={addLigne} style={{
                  width: '100%', padding: '7px', borderRadius: 8,
                  border: '2px dashed #D1FAE5', background: '#F0FDF4',
                  color: '#0A3D26', fontSize: 12, cursor: 'pointer'
                }}>＋ Ajouter une ligne</button>
              </div>

              {/* Total */}
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #EEF0F3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#64748B' }}>Total HT</span>
                  <span style={{ fontWeight: 700 }}>{fmt(totalHT)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#64748B' }}>TVA {form.tva_pct}%</span>
                  <span style={{ fontWeight: 700 }}>{fmt(totalHT * parseFloat(form.tva_pct) / 100)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ fontWeight: 700, color: '#0A3D26' }}>Total TTC</span>
                  <span style={{ fontWeight: 900, color: '#0A3D26' }}>{fmt(totalHT * (1 + parseFloat(form.tva_pct) / 100))}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowForm(false)} style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: '1.5px solid #EEF0F3', background: '#F8FAFC',
                  color: '#94A3B8', fontSize: 13, cursor: 'pointer'
                }}>Annuler</button>
                <button onClick={creerFacture} disabled={loading} style={{
                  flex: 2, padding: '10px', borderRadius: 10, border: 'none',
                  background: loading ? '#E2E8F0' : '#0A3D26',
                  color: loading ? '#94A3B8' : '#fff',
                  fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer'
                }}>
                  {loading ? 'Création…' : '✓ Créer la facture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}