'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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

// Liste des pays de l'UE (orthographes courantes acceptées)
const PAYS_UE = [
  'allemagne','autriche','belgique','bulgarie','chypre','croatie','danemark',
  'espagne','estonie','finlande','grèce','grece','hongrie','irlande','italie',
  'lettonie','lituanie','luxembourg','malte','pays-bas','pologne','portugal',
  'république tchèque','republique tcheque','tchéquie','tchequie',
  'roumanie','slovaquie','slovénie','slovenie','suède','suede'
]

// Détermine le taux TVA et la mention légale en fonction du pays du destinataire
function calculerTva(pays: string | null | undefined): { pct: number; mention: string | null; regime: string } {
  if (!pays) return { pct: 20, mention: null, regime: 'France' } // fallback FR
  const p = pays.trim().toLowerCase()
  if (p === 'france' || p === 'fr') {
    return { pct: 20, mention: null, regime: 'France' }
  }
  if (PAYS_UE.includes(p)) {
    return {
      pct: 0,
      mention: 'Autoliquidation TVA - Article 196 Directive 2006/112/CE',
      regime: 'UE (autoliquidation)'
    }
  }
  return {
    pct: 0,
    mention: 'Exonération de TVA - Article 262-I du CGI',
    regime: 'Hors UE (export)'
  }
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

  // UUID de Textile Loop (émetteur unique de toutes les factures)
  const TEXTILE_LOOP_UUID = 'a0000000-0000-0000-0000-000000000001'

  const [factures, setFactures] = useState<Facture[]>(initial)
  const [selected, setSelected] = useState<Facture | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterStatut, setFilterStatut] = useState('tous')
  const [loading, setLoading] = useState(false)

  // Filtres recherche
  const [searchFacture, setSearchFacture] = useState('')
  const [searchCommande, setSearchCommande] = useState('')
  const [filterDestinataire, setFilterDestinataire] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
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
    mention_tva: '',
    notes: '',
    lignes: [{ description: '', quantite: '', prix_unitaire: '', unite: 'kg' }]
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Sélection d'une commande : auto-remplit émetteur, destinataire, 1ère ligne et TVA
  const selectCommande = (commandeId: string) => {
    if (!commandeId) {
      setForm(f => ({
        ...f,
        commande_id: '',
        emetteur_id: '',
        destinataire_id: '',
        tva_pct: '20',
        mention_tva: '',
        lignes: [{ description: '', quantite: '', prix_unitaire: '', unite: 'kg' }]
      }))
      return
    }
    const cmd = commandes.find(c => c.id === commandeId)
    if (!cmd) return

    const destinataireId = cmd.marque?.id ?? ''
    // 1 seul accord commercial possible par client
    const accord = accords.find(a => a.entreprise_id === destinataireId)
    const prix = accord ? accord.prix_base_kg : 0.60
    const quantiteKg = (cmd.volume_total_tonnes || 0) * 1000

    // Calcul TVA selon pays du destinataire
    const destEntreprise = entreprises.find(e => e.id === destinataireId)
    const { pct, mention } = calculerTva(destEntreprise?.pays)

    setForm(f => ({
      ...f,
      commande_id: commandeId,
      emetteur_id: TEXTILE_LOOP_UUID,
      destinataire_id: destinataireId,
      tva_pct: String(pct),
      mention_tva: mention ?? '',
      lignes: [{
        description: 'Fil ETHYS — ' + cmd.reference,
        quantite: String(quantiteKg),
        prix_unitaire: String(prix),
        unite: 'kg'
      }]
    }))
  }

  const updateLigne = (i: number, k: string, v: string) => {
    setForm(f => ({
      ...f,
      lignes: f.lignes.map((l, idx) => idx === i ? { ...l, [k]: v } : l)
    }))
  }

  const addLigne = () => setForm(f => ({
    ...f,
    lignes: [...f.lignes, { description: '', quantite: '', prix_unitaire: '', unite: 'kg' }]
  }))

  const totalHT = form.lignes.reduce((s, l) => {
    return s + (parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0)
  }, 0)

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

  const creerFacture = async () => {
    if (!form.commande_id || !form.emetteur_id || !form.destinataire_id || !form.date_echeance) return
    setLoading(true)

    // 1. Génération de la référence FAC-YYYY-NNN
    const annee = new Date().getFullYear()
    const { data: dernieres } = await supabase
      .from('factures')
      .select('reference')
      .ilike('reference', 'FAC-' + annee + '-%')
      .order('reference', { ascending: false })
      .limit(1)

    const dernierNum = dernieres?.[0]?.reference?.match(/(\d+)$/)?.[1]
    const nouveauNum = dernierNum ? parseInt(dernierNum, 10) + 1 : 1
    const reference = 'FAC-' + annee + '-' + String(nouveauNum).padStart(3, '0')

    // 2. Calcul TVA et TTC (arrondis à 2 décimales)
    const tvaPct = parseFloat(form.tva_pct) || 0
    const montant_tva = Math.round(totalHT * tvaPct) / 100
    const montant_ttc = Math.round((totalHT + montant_tva) * 100) / 100

    // 3. Date d'émission = aujourd'hui (format YYYY-MM-DD)
    const date_emission = new Date().toISOString().split('T')[0]

    const { data: facture, error } = await supabase
      .from('factures')
      .insert({
        reference,
        commande_id: form.commande_id,
        emetteur_id: form.emetteur_id,
        destinataire_id: form.destinataire_id,
        montant_ht: totalHT,
        tva_pct: tvaPct,
        montant_tva,
        montant_ttc,
        mention_tva: form.mention_tva || null,
        date_emission,
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
    border: '1.5px solid #d4c5b0', fontSize: 12,
    boxSizing: 'border-box' as const, outline: 'none'
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
            <button onClick={() => setActiveTab(activeTab === 'accords' ? 'factures' : 'accords')} style={{
              padding: '7px 14px', borderRadius: 8, border: '1.5px solid #1a1a1a',
              background: activeTab === 'accords' ? '#1a1a1a' : '#fff',
              color: activeTab === 'accords' ? '#fff' : '#1a1a1a', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}>{t('boutons.accordsCommerciaux')}</button>
          )}
          <button onClick={() => setShowForm(true)} style={{
            padding: '7px 14px', borderRadius: 8, border: 'none',
            background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer'
          }}>＋ {t('boutons.nouvelleFacture')}</button>
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
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{t('accords.titre')}</div>
            <button onClick={() => setShowAccordForm(true)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ {t('boutons.nouvelAccord')}</button>
          </div>
          {accords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b7355', fontSize: 13 }}>{t('accords.aucun')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {accords.map(a => (
                <div key={a.id} style={{ background: '#fff', borderRadius: 6, border: '1px solid #e8e3d8', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{a.entreprise?.nom ?? '-'}</div>
                      <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>
                        {t('accords.du', { debut: new Date(a.date_debut).toLocaleDateString('fr-FR') })}
                        {a.date_fin ? ' ' + t('accords.auDate', { fin: new Date(a.date_fin).toLocaleDateString('fr-FR') }) : ' ' + t('accords.illimite')}
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#f0f4ec', color: '#2d5016' }}>{t('accords.actif')}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F0FDF4' }}>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 2 }}>{t('accords.prixNegocieKg')}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>{Number(a.prix_base_kg).toFixed(4)}€</div>
                      <div style={{ fontSize: 10, color: '#8b7355' }}>{t('accords.base', { prix: '0.60' })}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fdf8ec' }}>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 2 }}>{t('accords.remiseVolumeAnnuel')}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#b8860b' }}>{a.remise_volume_annuel_pct}%</div>
                      <div style={{ fontSize: 10, color: '#8b7355' }}>{t('accords.desSeuil', { seuil: a.seuil_volume_annuel_tonnes })}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f5f3ef' }}>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 2 }}>{t('accords.remisePalierCommande')}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#4a5568' }}>{t('accords.remisePalierDetail')}</div>
                      <div style={{ fontSize: 10, color: '#8b7355' }}>{t('accords.standardEthys')}</div>
                    </div>
                  </div>
                  {a.notes && <div style={{ fontSize: 11, color: '#4a5568', marginTop: 10, fontStyle: 'italic', padding: '8px 10px', borderRadius: 6, background: '#f5f3ef' }}>{a.notes}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Modal nouvel accord */}
          {showAccordForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowAccordForm(false)}>
              <div style={{ background: '#fff', borderRadius: 8, padding: '28px 32px', width: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{t('formAccord.titre')}</span>
                  <button onClick={() => setShowAccordForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>x</button>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formAccord.marque')}</label>
                  <select value={accordForm.entreprise_id} onChange={e => setAccordForm(f => ({ ...f, entreprise_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }}>
                    <option value="">{t('formAccord.selectMarque')}</option>
                    {entreprises.filter(e => e.type === 'marque').map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formAccord.prixNegocie')}</label>
                    <input type="number" step="0.0001" value={accordForm.prix_base_kg} onChange={e => setAccordForm(f => ({ ...f, prix_base_kg: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formAccord.remiseAnnuelle')}</label>
                    <input type="number" step="0.01" value={accordForm.remise_volume_annuel_pct} onChange={e => setAccordForm(f => ({ ...f, remise_volume_annuel_pct: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formAccord.seuilVolume')}</label>
                    <input type="number" value={accordForm.seuil_volume_annuel_tonnes} onChange={e => setAccordForm(f => ({ ...f, seuil_volume_annuel_tonnes: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formAccord.dateFin')}</label>
                    <input type="date" value={accordForm.date_fin} onChange={e => setAccordForm(f => ({ ...f, date_fin: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formAccord.notes')}</label>
                  <textarea value={accordForm.notes} onChange={e => setAccordForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', resize: 'none', boxSizing: 'border-box' as const }} />
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
                }} style={{ width: '100%', padding: '11px', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {t('formAccord.enregistrer')}
                </button>
              </div>
            </div>
          )}
        </div>
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
                    <span style={{
                      padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700,
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
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f5f3ef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{t('formFacture.titre')}</span>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, color: '#8b7355', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formFacture.commande')}</label>
                <select value={form.commande_id} onChange={e => selectCommande(e.target.value)} style={inputStyle}>
                  <option value="">{t('formFacture.selectionner')}</option>
                  {commandes.map(c => <option key={c.id} value={c.id}>{c.reference} — {c.marque?.nom}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formFacture.emetteur')}</label>
                  <div style={{
                    ...inputStyle,
                    background: '#f5f3ef', color: '#1a1a1a', fontWeight: 700,
                    display: 'flex', alignItems: 'center', minHeight: 36
                  }}>
                    {form.emetteur_id ? 'TEXTILE LOOP' : '—'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formFacture.destinataire')}</label>
                  <div style={{
                    ...inputStyle,
                    background: '#f5f3ef', color: '#1a1a1a', fontWeight: 700,
                    display: 'flex', alignItems: 'center', minHeight: 36
                  }}>
                    {form.destinataire_id
                      ? (entreprises.find(e => e.id === form.destinataire_id)?.nom ?? '—')
                      : '—'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formFacture.dateEcheance')}</label>
                  <input type="date" value={form.date_echeance} onChange={e => set('date_echeance', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formFacture.tva')}</label>
                  <div style={{
                    ...inputStyle,
                    background: '#f5f3ef', color: '#1a1a1a', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 36
                  }}>
                    <span>{form.tva_pct}%</span>
                    {form.destinataire_id && (() => {
                      const destEnt = entreprises.find(e => e.id === form.destinataire_id)
                      const { regime } = calculerTva(destEnt?.pays)
                      return <span style={{ fontSize: 10, fontWeight: 600, color: '#8b7355' }}>{regime}</span>
                    })()}
                  </div>
                </div>
              </div>

              {form.mention_tva && (
                <div style={{
                  padding: '8px 12px', borderRadius: 6, background: '#fdf8ec',
                  border: '1px solid #e8d8a8', fontSize: 11, color: '#8b6914',
                  fontStyle: 'italic'
                }}>
                  <strong>Mention légale facture :</strong> {form.mention_tva}
                </div>
              )}

              {/* Lignes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 8 }}>{t('formFacture.lignes')}</label>
                {form.lignes.map((l, i) => {
                  // La 1ère ligne est auto-remplie depuis la commande et non modifiable
                  const isAuto = i === 0
                  const lockedStyle = isAuto
                    ? { ...inputStyle, background: '#f5f3ef', color: '#1a1a1a', fontWeight: 600, cursor: 'not-allowed' }
                    : inputStyle
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <input
                        value={l.description}
                        onChange={e => updateLigne(i, 'description', e.target.value)}
                        placeholder={t('formFacture.phDescription')}
                        readOnly={isAuto}
                        style={lockedStyle}
                      />
                      <input
                        type="number"
                        value={l.quantite}
                        onChange={e => updateLigne(i, 'quantite', e.target.value)}
                        placeholder={t('formFacture.phQte')}
                        readOnly={isAuto}
                        style={lockedStyle}
                      />
                      <input
                        type="number"
                        value={l.prix_unitaire}
                        onChange={e => updateLigne(i, 'prix_unitaire', e.target.value)}
                        placeholder={t('formFacture.phPu')}
                        readOnly={isAuto}
                        style={lockedStyle}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>
                        {((parseFloat(l.quantite) || 0) * (parseFloat(l.prix_unitaire) || 0)).toLocaleString('fr-FR')} €
                      </div>
                    </div>
                  )
                })}
                <button onClick={addLigne} style={{
                  width: '100%', padding: '7px', borderRadius: 8,
                  border: '2px dashed #f0f4ec', background: '#F0FDF4',
                  color: '#1a1a1a', fontSize: 12, cursor: 'pointer'
                }}>＋ {t('boutons.ajouterLigne')}</button>
              </div>

              {/* Total */}
              <div style={{ padding: '12px 14px', borderRadius: 4, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#4a5568' }}>{t('formFacture.totalHt')}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(totalHT)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#4a5568' }}>{t('formFacture.tvaLigne', { pct: form.tva_pct })}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(totalHT * parseFloat(form.tva_pct) / 100)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{t('formFacture.totalTtc')}</span>
                  <span style={{ fontWeight: 900, color: '#1a1a1a' }}>{fmt(totalHT * (1 + parseFloat(form.tva_pct) / 100))}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowForm(false)} style={{
                  flex: 1, padding: '10px', borderRadius: 4,
                  border: '1.5px solid #e8e3d8', background: '#f5f3ef',
                  color: '#8b7355', fontSize: 13, cursor: 'pointer'
                }}>{t('boutons.annuler')}</button>
                <button onClick={creerFacture} disabled={loading} style={{
                  flex: 2, padding: '10px', borderRadius: 4, border: 'none',
                  background: loading ? '#d4c5b0' : '#1a1a1a',
                  color: loading ? '#8b7355' : '#fff',
                  fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer'
                }}>
                  {loading ? t('formFacture.creation') : t('formFacture.creer')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
