'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Badge from "@/components/ui/Badge";
import AccordsCommerciaux from './AccordsCommerciaux'
import Button from "@/components/ui/Button";
import NouvelleFactureModal from './NouvelleFactureModal'

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
  mention_tva: string | null
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

interface Entreprise { id: string; nom: string; type: string; pays?: string | null }

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
  brouillon:  ['#f5f3ef', '#4a5568', '#8b7355'],
  emise:      ['#DBEAFE', '#1E40AF', '#3B82F6'],
  en_attente: ['#fdf8ec', '#b8860b', '#F59E0B'],
  payee:      ['#f0f4ec', '#2d5016', '#2d5016'],
  en_retard:  ['#FEE2E2', '#991B1B', '#EF4444'],
  annulee:    ['#f5f3ef', '#4a5568', '#8b7355'],
}

function fmt(n: number | null | undefined) {
  if (n == null || isNaN(n)) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function FacturationClient({ factures: initial, commandes, entreprises, accords: accordsInitial, profil, user }: Props) {
  const t = useTranslations('facturation')
  const supabase = createClient()

  // Libellés de statut traduits (remplace l'ancienne constante STATUT_LABELS)
  const STATUT_LABELS: Record<StatutFacture, string> = {
    brouillon:  t('statuts.brouillon'),
    emise:      t('statuts.emise'),
    en_attente: t('statuts.en_attente'),
    payee:      t('statuts.payee'),
    en_retard:  t('statuts.en_retard'),
    annulee:    t('statuts.annulee'),
  }

  const [factures, setFactures] = useState<Facture[]>(initial)
  const [selected, setSelected] = useState<Facture | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterStatut, setFilterStatut] = useState('tous')

  // Filtres recherche
  const [searchFacture, setSearchFacture] = useState('')
  const [searchCommande, setSearchCommande] = useState('')
  const [filterDestinataire, setFilterDestinataire] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTab, setActiveTab] = useState<'factures' | 'accords'>('factures')
  const [accords, setAccords] = useState<AccordCommercial[]>(accordsInitial)
  const isAdmin = profil.role === 'admin'

  // Pré-filtre pour calculer les options des dropdowns N° facture et N° commande
  // (on applique destinataire + dates, mais pas N° facture / N° commande eux-mêmes)
  const facturesPourOptions = factures.filter(f => {
    if (filterDestinataire && f.destinataire?.nom !== filterDestinataire) return false
    if (dateFrom && f.date_emission && f.date_emission < dateFrom) return false
    if (dateTo && f.date_emission && f.date_emission > dateTo) return false
    return true
  })

  // Listes uniques pour les dropdowns
  const destinatairesUniques = Array.from(
    new Set(factures.map(f => f.destinataire?.nom).filter(Boolean) as string[])
  ).sort()
  const referencesFacturesOptions = Array.from(
    new Set(facturesPourOptions.map(f => f.reference).filter(Boolean) as string[])
  ).sort()
  const referencesCommandesOptions = Array.from(
    new Set(facturesPourOptions.map(f => f.commande?.reference).filter(Boolean) as string[])
  ).sort()

  // Filtre combiné : statut + N° facture + N° commande + destinataire + dates
  const filtrees = factures.filter(f => {
    if (filterStatut !== 'tous' && f.statut !== filterStatut) return false
    if (searchFacture && f.reference !== searchFacture) return false
    if (searchCommande && (f.commande?.reference ?? '') !== searchCommande) return false
    if (filterDestinataire && f.destinataire?.nom !== filterDestinataire) return false
    if (dateFrom && f.date_emission && f.date_emission < dateFrom) return false
    if (dateTo && f.date_emission && f.date_emission > dateTo) return false
    return true
  })

  const totalCA = factures.filter(f => f.statut === 'payee').reduce((s, f) => s + f.montant_ttc, 0)
  const totalAttente = factures.filter(f => f.statut === 'en_attente').reduce((s, f) => s + f.montant_ttc, 0)
  const totalRetard = factures.filter(f => f.statut === 'en_retard').reduce((s, f) => s + f.montant_ttc, 0)

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '16px 22px', background: '#f5f3ef', flexShrink: 0 }}>
        {[
          { label: t('kpi.totalFacture'), value: fmt(factures.reduce((s, f) => s + f.montant_ttc, 0)), bg: '#fff', color: '#1a1a1a' },
          { label: t('kpi.encaisse'), value: fmt(totalCA), bg: '#F0FDF4', color: '#2d5016' },
          { label: t('kpi.enAttente'), value: fmt(totalAttente), bg: '#FFFBEB', color: '#b8860b' },
          { label: t('kpi.enRetard'), value: fmt(totalRetard), bg: '#fdf0f0', color: '#991B1B' },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, borderRadius: 6, border: '1px solid #e8e3d8', padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Barre outils */}
      <div style={{
        padding: '10px 22px', background: '#fff', borderBottom: '1px solid #e8e3d8',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['tous', 'emise', 'en_attente', 'payee', 'en_retard'].map(s => (
            <button key={s} onClick={() => setFilterStatut(s)} style={{
              padding: '5px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: filterStatut === s ? 700 : 500,
              background: filterStatut === s ? '#1a1a1a' : '#f5f3ef',
              color: filterStatut === s ? '#fff' : '#4a5568'
            }}>
              {s === 'tous' ? t('filtres.toutes') : STATUT_LABELS[s as StatutFacture]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
        {isAdmin && (
            <Button
              label={t('boutons.accordsCommerciaux')}
              variant="toggle"
              active={activeTab === 'accords'}
              onClick={() => setActiveTab(activeTab === 'accords' ? 'factures' : 'accords')}
            />
          )}
         {isAdmin && (
            <Button label={'＋ ' + t('boutons.nouvelleFacture')} onClick={() => setShowForm(true)} />
          )}
        </div>
      </div>

      {/* Barre filtres recherche */}
      {activeTab === 'factures' && (
        <div style={{
          padding: '10px 22px', background: '#fff', borderBottom: '1px solid #e8e3d8',
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0
        }}>
          <select
            value={searchFacture}
            onChange={e => setSearchFacture(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0',
              fontSize: 11, outline: 'none', minWidth: 160, background: '#fff', cursor: 'pointer'
            }}
          >
            <option value="">N° facture (tous)</option>
            {referencesFacturesOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={searchCommande}
            onChange={e => setSearchCommande(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0',
              fontSize: 11, outline: 'none', minWidth: 160, background: '#fff', cursor: 'pointer'
            }}
          >
            <option value="">N° commande (tous)</option>
            {referencesCommandesOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={filterDestinataire}
            onChange={e => setFilterDestinataire(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0',
              fontSize: 11, outline: 'none', minWidth: 160, background: '#fff', cursor: 'pointer'
            }}
          >
            <option value="">Destinataire (tous)</option>
            {destinatairesUniques.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#8b7355' }}>Du</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{
                padding: '6px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0',
                fontSize: 11, outline: 'none'
              }}
            />
            <span style={{ fontSize: 11, color: '#8b7355' }}>au</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{
                padding: '6px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0',
                fontSize: 11, outline: 'none'
              }}
            />
          </div>
          {(searchFacture || searchCommande || filterDestinataire || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearchFacture(''); setSearchCommande(''); setFilterDestinataire('');
                setDateFrom(''); setDateTo('')
              }}
              style={{
                padding: '6px 12px', borderRadius: 6, border: '1.5px solid #d4c5b0',
                background: '#fff', color: '#8b3a3a', fontSize: 11, fontWeight: 600, cursor: 'pointer'
              }}
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* Onglet Accords commerciaux */}
      {activeTab === 'accords' && isAdmin && (
        <AccordsCommerciaux accords={accords} setAccords={setAccords} entreprises={entreprises} user={user} />
      )}

      {/* Table */}
      {activeTab === 'factures' && <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>
        {filtrees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b7355' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>◫</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t('table.aucuneFacture')}</div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f3ef' }}>
                  {[t('table.reference'), 'COMMANDE', t('table.emetteur'), t('table.destinataire'), t('table.montantTtc'), t('table.emission'), t('table.echeance'), t('table.statut'), ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#8b7355', textAlign: 'left', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrees.map((f, i) => {
                  const [bg, tc, dot] = STATUT_COLORS[f.statut]
                  return (
                    <tr key={f.id}
                      onClick={() => setSelected(f)}
                      style={{ borderTop: '1px solid #f5f3ef', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f5f3ef'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#1a1a1a' }}>{f.reference}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#2d5016' }}>{f.commande?.reference ?? '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#4a5568' }}>{f.emetteur?.nom ?? '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#4a5568' }}>{f.destinataire?.nom ?? '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#1A202C' }}>{fmt(f.montant_ttc)}</td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: '#8b7355' }}>{new Date(f.date_emission).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: f.statut === 'en_retard' ? '#8b3a3a' : '#8b7355', fontWeight: f.statut === 'en_retard' ? 700 : 400 }}>
                        {new Date(f.date_echeance).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: bg, color: tc, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot }} />
                          {STATUT_LABELS[f.statut]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button onClick={e => { e.stopPropagation(); setSelected(f) }} style={{
                          padding: '4px 10px', borderRadius: 7, border: '1.5px solid #e8e3d8',
                          background: '#f5f3ef', fontSize: 11, cursor: 'pointer'
                        }}>{t('boutons.voir')} →</button>
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
            background: '#fff', borderRadius: 4, width: '100%', maxWidth: 620,
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>

            {/* En-tête */}
            <div style={{
              background: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)',
              borderRadius: '20px 20px 0 0', padding: '24px 28px', color: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>{t('detail.factureEthys')}</div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{selected.reference}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{t('detail.refCommande', { ref: selected.commande?.reference ?? '' })}</div>
                  {/* Décomposition prix - visible admin et marque uniquement */}
                  {(isAdmin || accords.some(a => a.entreprise_id === selected.destinataire_id)) && (() => {
                    const accord = accords.find(a => a.entreprise_id === selected.destinataire_id)
                    const vol = selected.commande?.volume_total_tonnes ?? 0
                    const prixBase = accord ? accord.prix_base_kg : 0.60
                    const remisePalier = vol >= 10 ? 2 : vol >= 5 ? 1 : 0
                    const remiseAnnuelle = accord?.remise_volume_annuel_pct ?? 0
                    const prixFinal = prixBase * (1 - remisePalier/100) * (1 - remiseAnnuelle/100)
                    return (
                      <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 4, background: '#F0FDF4', border: '1px solid #c8d8b8' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#2d5016', marginBottom: 8, textTransform: 'uppercase' }}>
                          {accord ? t('detail.prixAccord') : t('detail.decompositionPrix')}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          <div style={{ fontSize: 11, color: '#4a5568' }}>{t('detail.prixBase')}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a', textAlign: 'right' }}>{prixBase.toFixed(4)}€/kg</div>
                          {remisePalier > 0 && <>
                            <div style={{ fontSize: 11, color: '#4a5568' }}>{t('detail.remiseVolumeCommande')}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#2d5016', textAlign: 'right' }}>-{remisePalier}%</div>
                          </>}
                          {remiseAnnuelle > 0 && <>
                            <div style={{ fontSize: 11, color: '#4a5568' }}>{t('detail.remiseVolumeAnnuel')}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#2d5016', textAlign: 'right' }}>-{remiseAnnuelle}%</div>
                          </>}
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', borderTop: '1px solid #c8d8b8', paddingTop: 6 }}>{t('detail.prixApplicable')}</div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#1a1a1a', textAlign: 'right', borderTop: '1px solid #c8d8b8', paddingTop: 6 }}>{prixFinal.toFixed(4)}€/kg</div>
                        </div>
                        {accord?.notes && <div style={{ fontSize: 10, color: '#4a5568', marginTop: 8, fontStyle: 'italic' }}>{accord.notes}</div>}
                      </div>
                    )
                  })()}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#c2956e' }}>{fmt(selected.montant_ttc)}</div>
                  <div style={{ fontSize: 10, opacity: 0.65 }}>{t('detail.ttc')}</div>
                  <div style={{ marginTop: 6 }}>
                    <Badge
                      label={STATUT_LABELS[selected.statut]}
                      background={STATUT_COLORS[selected.statut][0]}
                      color={STATUT_COLORS[selected.statut][1]}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '22px 28px' }}>
              {/* Parties */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                {[
                  { titre: t('detail.emetteur'), data: selected.emetteur },
                  { titre: t('detail.destinataire'), data: selected.destinataire },
                ].map(({ titre, data }) => (
                  <div key={titre} style={{ padding: '12px 14px', borderRadius: 4, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#8b7355', marginBottom: 6, textTransform: 'uppercase' }}>{titre}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{data?.nom ?? '—'}</div>
                    {data?.email_contact && <div style={{ fontSize: 11, color: '#4a5568', marginTop: 2 }}>{data.email_contact}</div>}
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  [t('detail.dateEmission'), new Date(selected.date_emission).toLocaleDateString('fr-FR')],
                  [t('detail.dateEcheance'), new Date(selected.date_echeance).toLocaleDateString('fr-FR')],
                  [t('detail.datePaiement'), selected.date_paiement ? new Date(selected.date_paiement).toLocaleDateString('fr-FR') : '—'],
                ].map(([l, v]) => (
                  <div key={l} style={{ padding: '10px 12px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                    <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Lignes */}
              {selected.lignes?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('detail.detailPrestations')}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e8e3d8', borderRadius: 8, overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: '#f5f3ef' }}>
                        {[t('detail.colDescription'), t('detail.colQte'), t('detail.colUnite'), t('detail.colPu'), t('detail.colTotalHt')].map((h, i) => (
                          <th key={i} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: '#8b7355', textAlign: i === 0 ? 'left' : 'right', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.lignes.map((l, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #f5f3ef' }}>
                          <td style={{ padding: '10px 12px', fontSize: 12 }}>{l.description}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'right' }}>{l.quantite}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'right' }}>{l.unite}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'right' }}>{fmt(l.prix_unitaire)}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, textAlign: 'right', color: '#1a1a1a' }}>{fmt(l.total_ht)}</td>
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
                    [t('detail.sousTotalHt'), fmt(selected.montant_ht)],
                    [t('detail.tva', { pct: selected.tva_pct }), fmt(selected.montant_tva)],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f5f3ef', fontSize: 12 }}>
                      <span style={{ color: '#4a5568' }}>{l}</span>
                      <span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
                    <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{t('detail.totalTtc')}</span>
                    <span style={{ fontWeight: 900, color: '#1a1a1a', fontSize: 16 }}>{fmt(selected.montant_ttc)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                {selected.statut !== 'payee' && selected.statut !== 'annulee' && (
                  <button onClick={() => marquerPayee(selected.id)} style={{
                    flex: 2, padding: '10px', borderRadius: 4, border: 'none',
                    background: '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}>{t('boutons.marquerPayee')}</button>
                )}
                <button onClick={() => setSelected(null)} style={{
                  flex: 1, padding: '10px', borderRadius: 4,
                  border: '1.5px solid #e8e3d8', background: '#f5f3ef',
                  color: '#8b7355', fontSize: 13, cursor: 'pointer'
                }}>{t('boutons.fermer')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nouvelle facture */}
      {showForm && (
        <NouvelleFactureModal
          onClose={() => setShowForm(false)}
          commandes={commandes}
          entreprises={entreprises}
          accords={accords}
          setFactures={setFactures}
        />
      )}
    </div>
  )
}
