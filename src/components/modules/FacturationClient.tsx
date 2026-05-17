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
  montant_tva: number | null
  montant_ttc: number
  tva_pct: number
  date_emission: string
  date_echeance: string
  date_paiement: string | null
  notes: string | null
  lignes: LigneFacture[]
  commande: { reference: string; volume_total_tonnes: number } | null
  emetteur: { nom: string; adresse: string | null; adresse_rue: string | null; code_postal: string | null; ville: string | null; pays: string | null; telephone: string | null; email_contact: string | null; siret: string | null; tva: string | null } | null
  destinataire_nom_cache?: string | null
  destinataire_id: string | null
  destinataire: { nom: string; adresse: string | null; email_contact: string | null; pays?: string } | null
}

interface Commande {
  id: string
  reference: string
  volume_total_tonnes: number
  pct_recycle: number
  marque: { id: string; nom: string } | null
  filature: { id: string; nom: string } | null
}

interface Entreprise { id: string; nom: string; type: string; pays?: string }

interface AccordCommercial {
  id: string
  entreprise_id: string
  prix_base_kg: number
  remise_volume_annuel_pct: number
  seuil_volume_annuel_tonnes: number
  delai_paiement_jours: number | null
  date_debut: string
  date_fin: string | null
  notes: string | null
  entreprise: { nom: string } | null
}

function calcEcheance(delaiJours: number | null | undefined): string {
  const jours = delaiJours ?? 60
  const base = new Date()
  base.setDate(base.getDate() + jours)
  const finMois = new Date(base.getFullYear(), base.getMonth() + 1, 0)
  return finMois.toISOString().split('T')[0]
}

interface Props {
  factures: Facture[]
  commandes: Commande[]
  entreprises: Entreprise[]
  accords: AccordCommercial[]
  profil: { role: string; entreprise_id: string }
  user: { id: string }
}

const TEXTILE_LOOP_ID = 'a0000000-0000-0000-0000-000000000001'

const PAYS_UE = new Set([
  'Allemagne','Autriche','Belgique','Bulgarie','Chypre','Croatie','Danemark',
  'Espagne','Estonie','Finlande','Grece','Grèce','Hongrie','Irlande','Italie',
  'Lettonie','Lituanie','Luxembourg','Malte','Pays-Bas','Pologne','Portugal',
  'Roumanie','Slovaquie','Slovenie','Slovénie','Suede','Suède','Tcheque','Tchequia',
  'République tchèque','Republique tcheque'
])

function regimeTVA(pays: string | undefined | null): 'france' | 'ue' | 'hors_ue' {
  if (!pays) return 'france'
  const p = pays.trim()
  if (p.toLowerCase() === 'france') return 'france'
  if (PAYS_UE.has(p)) return 'ue'
  return 'hors_ue'
}

function mentionTVA(regime: 'france' | 'ue' | 'hors_ue'): string {
  if (regime === 'france') return ''
  if (regime === 'ue') return 'TVA intracommunautaire - autoliquidation par le preneur'
  return 'Exoneration de la TVA - Article 262 1 du CGI'
}

const STATUT_COLORS: Record<StatutFacture, [string, string, string]> = {
  brouillon:  ['#f5f3ef', '#4a5568', '#8b7355'],
  emise:      ['#DBEAFE', '#1E40AF', '#3B82F6'],
  en_attente: ['#fdf8ec', '#b8860b', '#F59E0B'],
  payee:      ['#f0f4ec', '#2d5016', '#2d5016'],
  en_retard:  ['#FEE2E2', '#991B1B', '#EF4444'],
  annulee:    ['#f5f3ef', '#4a5568', '#8b7355'],
}

const STATUT_LABELS: Record<StatutFacture, string> = {
  brouillon:  'Brouillon',
  emise:      'Emise',
  en_attente: 'En attente',
  payee:      'Payee',
  en_retard:  'En retard',
  annulee:    'Annulee',
}

function fmt(n: number | null | undefined) {
  if (n == null || isNaN(n)) return '0,00 EUR'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function calcTVA(montant_ht: number, tva_pct: number, regime: 'france' | 'ue' | 'hors_ue'): number {
  if (regime !== 'france') return 0
  return montant_ht * (tva_pct || 0) / 100
}

function loadJsPDF(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).jspdf) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('jsPDF load failed'))
    document.head.appendChild(script)
  })
}

async function telechargerPDF(facture: Facture, accords: AccordCommercial[]) {
  await loadJsPDF()
  const { jsPDF } = (window as any).jspdf
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const noir = [26, 26, 26]
  const vert = [45, 80, 22]
  const beige = [245, 243, 239]
  const gris = [74, 85, 104]

  const regime = regimeTVA(facture.destinataire?.pays)
  const montant_ht = facture.montant_ht || 0
  const tva_pct = facture.tva_pct || 0
  const montant_tva = calcTVA(montant_ht, tva_pct, regime)
  const montant_ttc = montant_ht + montant_tva
  const mention = mentionTVA(regime)

  doc.setFillColor(noir[0], noir[1], noir[2])
  doc.rect(0, 0, 210, 38, 'F')
  doc.setFontSize(9)
  doc.setTextColor(194, 149, 110)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE ETHYS', 14, 13)
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text(facture.reference, 14, 24)
  if (facture.commande?.reference) {
    doc.setFontSize(9)
    doc.setTextColor(180, 180, 180)
    doc.setFont('helvetica', 'normal')
    doc.text('Ref. commande : ' + facture.commande.reference, 14, 32)
  }
  doc.setFontSize(18)
  doc.setTextColor(194, 149, 110)
  doc.setFont('helvetica', 'bold')
  doc.text(fmt(montant_ttc), 196, 22, { align: 'right' })
  doc.setFontSize(8)
  doc.setTextColor(180, 180, 180)
  doc.setFont('helvetica', 'normal')
  doc.text('TTC', 196, 29, { align: 'right' })
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text(STATUT_LABELS[facture.statut], 196, 35, { align: 'right' })

  let y = 46
  const colW = 86
  const cardH = 28

  doc.setFillColor(beige[0], beige[1], beige[2])
  doc.roundedRect(14, y, colW, cardH, 3, 3, 'F')
  doc.setFontSize(7)
  doc.setTextColor(gris[0], gris[1], gris[2])
  doc.setFont('helvetica', 'bold')
  doc.text('EMETTEUR', 19, y + 7)
  doc.setFontSize(11)
  doc.setTextColor(noir[0], noir[1], noir[2])
  doc.text(facture.emetteur?.nom ?? 'TEXTILE LOOP', 19, y + 15)
  if (facture.emetteur?.email_contact) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gris[0], gris[1], gris[2])
    doc.text(facture.emetteur.email_contact, 19, y + 22)
  }

  doc.setFillColor(beige[0], beige[1], beige[2])
  doc.roundedRect(110, y, colW, cardH, 3, 3, 'F')
  doc.setFontSize(7)
  doc.setTextColor(gris[0], gris[1], gris[2])
  doc.setFont('helvetica', 'bold')
  doc.text('DESTINATAIRE', 115, y + 7)
  doc.setFontSize(11)
  doc.setTextColor(noir[0], noir[1], noir[2])
  doc.text(facture.destinataire?.nom ?? '-', 115, y + 15)
  if (facture.destinataire?.email_contact) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gris[0], gris[1], gris[2])
    doc.text(facture.destinataire.email_contact, 115, y + 22)
  }

  y += cardH + 10
  const dates = [
    ["Date d'emission", new Date(facture.date_emission).toLocaleDateString('fr-FR')],
    ["Date d'echeance", new Date(facture.date_echeance).toLocaleDateString('fr-FR')],
    ["Date de paiement", facture.date_paiement ? new Date(facture.date_paiement).toLocaleDateString('fr-FR') : '-'],
  ]
  const dateW = 56
  dates.forEach(([label, val], i) => {
    const dx = 14 + i * (dateW + 5)
    doc.setFillColor(beige[0], beige[1], beige[2])
    doc.roundedRect(dx, y, dateW, 18, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gris[0], gris[1], gris[2])
    doc.text(label, dx + 4, y + 6)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(noir[0], noir[1], noir[2])
    doc.text(val, dx + 4, y + 14)
  })

  y += 28
  if (facture.lignes && facture.lignes.length > 0) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gris[0], gris[1], gris[2])
    doc.text('DETAIL DES PRESTATIONS', 14, y)
    y += 5
    doc.setFillColor(beige[0], beige[1], beige[2])
    doc.rect(14, y, 182, 8, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(gris[0], gris[1], gris[2])
    doc.text('DESCRIPTION', 17, y + 5)
    doc.text('QTE', 115, y + 5, { align: 'right' })
    doc.text('UNITE', 135, y + 5, { align: 'right' })
    doc.text('PU (EUR)', 163, y + 5, { align: 'right' })
    doc.text('TOTAL HT', 196, y + 5, { align: 'right' })
    y += 8
    facture.lignes.forEach((l, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(252, 252, 250)
        doc.rect(14, y, 182, 8, 'F')
      }
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(noir[0], noir[1], noir[2])
      doc.text(l.description, 17, y + 5)
      doc.text(String(l.quantite), 115, y + 5, { align: 'right' })
      doc.text(l.unite, 135, y + 5, { align: 'right' })
      doc.text(fmt(l.prix_unitaire), 163, y + 5, { align: 'right' })
      doc.setFont('helvetica', 'bold')
      doc.text(fmt(l.total_ht || l.quantite * l.prix_unitaire), 196, y + 5, { align: 'right' })
      y += 8
    })
    y += 4
  }

  const totX = 196 - 80
  const totaux: [string, string][] = [['Sous-total HT', fmt(montant_ht)]]
  if (regime === 'france') {
    totaux.push(['TVA ' + tva_pct + '%', fmt(montant_tva)])
  } else {
    totaux.push([regime === 'ue' ? 'TVA intracommunautaire' : 'TVA (exoneree)', '0,00 EUR'])
  }
  totaux.forEach(([label, val]) => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(gris[0], gris[1], gris[2])
    doc.text(label, totX, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(noir[0], noir[1], noir[2])
    doc.text(val, 196, y, { align: 'right' })
    y += 7
  })
  doc.setLineWidth(0.5)
  doc.setDrawColor(232, 227, 216)
  doc.line(totX, y - 2, 196, y - 2)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(noir[0], noir[1], noir[2])
  doc.text('Total TTC', totX, y + 6)
  doc.setFontSize(14)
  doc.text(fmt(montant_ttc), 196, y + 6, { align: 'right' })
  y += 14

  if (mention) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(gris[0], gris[1], gris[2])
    doc.text(mention, 14, y)
    y += 8
  }

  const accord = accords.find(a => a.entreprise_id === facture.destinataire_id)
  if (accord) {
    const vol = facture.commande?.volume_total_tonnes ?? 0
    const remisePalier = vol >= 10 ? 2 : vol >= 5 ? 1 : 0
    const remiseAnnuelle = accord.remise_volume_annuel_pct ?? 0
    const prixFinal = accord.prix_base_kg * (1 - remisePalier / 100) * (1 - remiseAnnuelle / 100)
    doc.setFillColor(240, 244, 236)
    doc.roundedRect(14, y, 182, remisePalier > 0 || remiseAnnuelle > 0 ? 36 : 24, 3, 3, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(vert[0], vert[1], vert[2])
    doc.text('PRIX ACCORD COMMERCIAL', 19, y + 7)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(noir[0], noir[1], noir[2])
    doc.text('Prix de base : ' + accord.prix_base_kg.toFixed(4) + ' EUR/kg', 19, y + 14)
    let ay = y + 14
    if (remisePalier > 0) { ay += 6; doc.text('Remise volume commande : -' + remisePalier + '%', 19, ay) }
    if (remiseAnnuelle > 0) { ay += 6; doc.text('Remise volume annuel : -' + remiseAnnuelle + '%', 19, ay) }
    doc.setFont('helvetica', 'bold')
    doc.text('Prix applicable : ' + prixFinal.toFixed(4) + ' EUR/kg', 130, y + 14)
  }

  const pageH = 297
  doc.setFillColor(noir[0], noir[1], noir[2])
  doc.rect(0, pageH - 14, 210, 14, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 180)
  const today = new Date().toLocaleDateString('fr-FR')
  doc.text('ETHYS - Textile Loop - Document genere le ' + today, 14, pageH - 5)
  doc.text(facture.reference, 196, pageH - 5, { align: 'right' })

  doc.save('facture-' + facture.reference + '.pdf')
}

export default function FacturationClient({ factures: initial, commandes, entreprises, accords: accordsInitial, profil, user }: Props) {
  const supabase = createClient()
  const [factures, setFactures] = useState<Facture[]>(initial)
  const [selected, setSelected] = useState<Facture | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterStatut, setFilterStatut] = useState('tous')
  const [search, setSearch] = useState('')
  const [filterSociete, setFilterSociete] = useState('')
  const societesUniques = Array.from(new Set(factures.map(f => f.destinataire?.nom).filter(Boolean))) as string[]
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'factures' | 'accords'>('factures')
  const [accords, setAccords] = useState<AccordCommercial[]>(accordsInitial)
  const [showAccordForm, setShowAccordForm] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
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
  const [filterMarqueForm, setFilterMarqueForm] = useState('')
  const [searchCommande, setSearchCommande] = useState('')
  const marquesUniques = Array.from(new Set(commandes.map(c => c.marque?.nom).filter(Boolean))) as string[]
  const commandesFiltrees = commandes.filter(c => {
    if (filterMarqueForm && c.marque?.nom !== filterMarqueForm) return false
    if (searchCommande && !c.reference.toLowerCase().includes(searchCommande.toLowerCase())) return false
    return true
  })

  const [form, setForm] = useState({
    commande_id: '',
    emetteur_id: TEXTILE_LOOP_ID,
    destinataire_id: '',
    date_echeance: '',
    tva_pct: '20',
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Quand la commande change : pré-remplir destinataire + ligne automatique
  const handleCommandeChange = (commandeId: string) => {
    const commande = commandes.find(c => c.id === commandeId)
    if (!commande) { setForm(f => ({ ...f, commande_id: commandeId })); return }

    const destinataireId = commande.marque?.id ?? ''
    const accord = accords.find(a => a.entreprise_id === destinataireId)
    const vol_kg = Math.round((commande.volume_total_tonnes ?? 0) * 1000)
    const prix_kg = accord ? accord.prix_base_kg : 0.60

    const accordDestinataire = accords.find(a => a.entreprise_id === destinataireId)
    const dateEcheance = calcEcheance(accordDestinataire?.delai_paiement_jours)

    setForm(f => ({
      ...f,
      commande_id: commandeId,
      destinataire_id: destinataireId,
      date_echeance: dateEcheance,
    }))
    setLigneAuto({
      description: 'Fil ETHYS - ' + commande.reference,
      quantite: vol_kg,
      prix_unitaire: prix_kg,
    })
  }

  const [ligneAuto, setLigneAuto] = useState<{ description: string; quantite: number; prix_unitaire: number } | null>(null)

  const totalHT = ligneAuto ? ligneAuto.quantite * ligneAuto.prix_unitaire : 0

  const destinataireSelectionne = entreprises.find(e => e.id === form.destinataire_id)
  const regimeForm = regimeTVA(destinataireSelectionne?.pays)
  const tvaPctNum = parseFloat(form.tva_pct) || 0
  const totalTVA = calcTVA(totalHT, tvaPctNum, regimeForm)
  const totalTTC = totalHT + totalTVA
  const mentionForm = mentionTVA(regimeForm)

  const filtrees = factures.filter(f => {
    if (filterStatut !== 'tous' && f.statut !== filterStatut) return false
    if (filterSociete && f.destinataire?.nom !== filterSociete) return false
    if (search) {
      const s = search.toLowerCase()
      const matchSociete = f.destinataire?.nom?.toLowerCase().includes(s) || f.emetteur?.nom?.toLowerCase().includes(s)
      const matchCommande = f.commande?.reference?.toLowerCase().includes(s)
      const matchRef = f.reference?.toLowerCase().includes(s)
      const matchDate = new Date(f.date_emission).toLocaleDateString('fr-FR').includes(s)
      if (!matchSociete && !matchCommande && !matchRef && !matchDate) return false
    }
    return true
  })

  const totalCA = factures.filter(f => f.statut === 'payee').reduce((s, f) => s + (f.montant_ttc || 0), 0)
  const totalAttente = factures.filter(f => f.statut === 'en_attente').reduce((s, f) => s + (f.montant_ttc || 0), 0)
  const totalRetard = factures.filter(f => f.statut === 'en_retard').reduce((s, f) => s + (f.montant_ttc || 0), 0)

  const creerFacture = async () => {
    if (!form.commande_id || !form.destinataire_id || !form.date_echeance || !ligneAuto) return
    setLoading(true)

    const montant_ht = totalHT
    const montant_tva = totalTVA
    const montant_ttc = totalTTC

    const { data: refData } = await supabase.rpc('generate_facture_reference')
    const { data: facture, error } = await supabase
      .from('factures')
      .insert({
        reference: refData,
        commande_id: form.commande_id,
        emetteur_id: TEXTILE_LOOP_ID,
        destinataire_id: form.destinataire_id,
        montant_ht,
        montant_tva,
        montant_ttc,
        tva_pct: regimeForm === 'france' ? tvaPctNum : 0,
        date_emission: new Date().toISOString().split('T')[0],
        date_echeance: form.date_echeance,
        statut: 'emise',
        notes: form.notes || null,
      })
      .select('id')
      .single()

    if (!error && facture) {
      await supabase.from('lignes_facture').insert({
        facture_id: facture.id,
        description: ligneAuto.description,
        quantite: ligneAuto.quantite,
        unite: 'kg',
        prix_unitaire: ligneAuto.prix_unitaire,
        total_ht: ligneAuto.quantite * ligneAuto.prix_unitaire,
      })

      const { data: newFacture } = await supabase
        .from('factures')
        .select(`
          *,
          lignes:lignes_facture(*),
          commande:commandes(reference, volume_total_tonnes),
          emetteur:entreprises!factures_emetteur_id_fkey(nom, adresse, adresse_rue, code_postal, ville, pays, telephone, email_contact, siret, tva),
          destinataire:entreprises!factures_destinataire_id_fkey(nom, adresse, email_contact, pays)
        `)
        .eq('id', facture.id)
        .single()

      if (newFacture) setFactures(prev => [newFacture as Facture, ...prev])
      setShowForm(false)
      setLigneAuto(null)
      setForm({
        commande_id: '',
        emetteur_id: TEXTILE_LOOP_ID,
        destinataire_id: '',
        date_echeance: '',
        tva_pct: '20',
        notes: '',
      })
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

  const handleTelechargerPDF = async (facture: Facture) => {
    setPdfLoading(true)
    try { await telechargerPDF(facture, accords) } catch (e) { console.error('PDF error:', e) }
    setPdfLoading(false)
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
          { label: 'Total facture', value: fmt(factures.reduce((s, f) => s + (f.montant_ttc || 0), 0)), bg: '#fff', color: '#1a1a1a' },
          { label: 'Encaisse', value: fmt(totalCA), bg: '#F0FDF4', color: '#2d5016' },
          { label: 'En attente', value: fmt(totalAttente), bg: '#FFFBEB', color: '#b8860b' },
          { label: 'En retard', value: fmt(totalRetard), bg: '#fdf0f0', color: '#991B1B' },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, borderRadius: 6, border: '1px solid #e8e3d8', padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Barre outils */}
      <div style={{ padding: '10px 22px', background: '#fff', borderBottom: '1px solid #e8e3d8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {['tous', 'emise', 'en_attente', 'payee', 'en_retard'].map(s => (
            <button key={s} onClick={() => setFilterStatut(s)} style={{
              padding: '5px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: filterStatut === s ? 700 : 500,
              background: filterStatut === s ? '#1a1a1a' : '#f5f3ef',
              color: filterStatut === s ? '#fff' : '#4a5568'
            }}>
              {s === 'tous' ? 'Toutes' : STATUT_LABELS[s as StatutFacture]}
            </button>
          ))}
          <select
            value={filterSociete}
            onChange={e => setFilterSociete(e.target.value)}
            style={{ padding: '5px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 11, outline: 'none', background: filterSociete ? '#1a1a1a' : '#f5f3ef', color: filterSociete ? '#fff' : '#4a5568' }}
          >
            <option value="">Toutes societes</option>
            {societesUniques.sort().map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="text"
            placeholder="N commande ou reference..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '5px 12px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 11, outline: 'none', width: 200 }}
          />
          {(search || filterSociete) && (
            <button onClick={() => { setSearch(''); setFilterSociete('') }} style={{ padding: '5px 10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', fontSize: 11, color: '#8b7355', cursor: 'pointer' }}>
              Reinit.
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && (
            <button onClick={() => setActiveTab(activeTab === 'accords' ? 'factures' : 'accords')} style={{
              padding: '7px 14px', borderRadius: 8, border: '1.5px solid #1a1a1a',
              background: activeTab === 'accords' ? '#1a1a1a' : '#fff',
              color: activeTab === 'accords' ? '#fff' : '#1a1a1a', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}>Accords commerciaux</button>
          )}
          <button onClick={() => setShowForm(true)} style={{
            padding: '7px 14px', borderRadius: 8, border: 'none',
            background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer'
          }}>+ Nouvelle facture</button>
        </div>
      </div>

      {/* Onglet Accords commerciaux */}
      {activeTab === 'accords' && isAdmin && (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Accords commerciaux</div>
            <button onClick={() => setShowAccordForm(true)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nouvel accord</button>
          </div>
          {accords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b7355', fontSize: 13 }}>Aucun accord commercial.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {accords.map(a => (
                <div key={a.id} style={{ background: '#fff', borderRadius: 6, border: '1px solid #e8e3d8', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{a.entreprise?.nom ?? '-'}</div>
                      <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>
                        {'Du ' + new Date(a.date_debut).toLocaleDateString('fr-FR') + (a.date_fin ? ' au ' + new Date(a.date_fin).toLocaleDateString('fr-FR') : ' (illimite)')}
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#f0f4ec', color: '#2d5016' }}>Actif</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F0FDF4' }}>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 2 }}>Prix negocie/kg</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>{Number(a.prix_base_kg).toFixed(4) + ' EUR'}</div>
                      <div style={{ fontSize: 10, color: '#8b7355' }}>Base: 0.60 EUR</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fdf8ec' }}>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 2 }}>Remise volume annuel</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#b8860b' }}>{a.remise_volume_annuel_pct + '%'}</div>
                      <div style={{ fontSize: 10, color: '#8b7355' }}>{'Des ' + a.seuil_volume_annuel_tonnes + 'T/an'}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f5f3ef' }}>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 2 }}>Remise palier commande</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#4a5568' }}>{'1% >= 5T  2% >= 10T'}</div>
                      <div style={{ fontSize: 10, color: '#8b7355' }}>Standard ETHYS</div>
                    </div>
                  </div>
                  {a.notes && <div style={{ fontSize: 11, color: '#4a5568', marginTop: 10, fontStyle: 'italic', padding: '8px 10px', borderRadius: 6, background: '#f5f3ef' }}>{a.notes}</div>}
                </div>
              ))}
            </div>
          )}

          {showAccordForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowAccordForm(false)}>
              <div style={{ background: '#fff', borderRadius: 8, padding: '28px 32px', width: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Nouvel accord commercial</span>
                  <button onClick={() => setShowAccordForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>x</button>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Marque *</label>
                  <select value={accordForm.entreprise_id} onChange={e => setAccordForm(f => ({ ...f, entreprise_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }}>
                    <option value="">Selectionner une marque...</option>
                    {entreprises.filter(e => e.type === 'marque').map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Prix negocie (EUR/kg) *</label>
                    <input type="number" step="0.0001" value={accordForm.prix_base_kg} onChange={e => setAccordForm(f => ({ ...f, prix_base_kg: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Remise annuelle (%)</label>
                    <input type="number" step="0.01" value={accordForm.remise_volume_annuel_pct} onChange={e => setAccordForm(f => ({ ...f, remise_volume_annuel_pct: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Seuil volume annuel (T)</label>
                    <input type="number" value={accordForm.seuil_volume_annuel_tonnes} onChange={e => setAccordForm(f => ({ ...f, seuil_volume_annuel_tonnes: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Date fin (optionnel)</label>
                    <input type="date" value={accordForm.date_fin} onChange={e => setAccordForm(f => ({ ...f, date_fin: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Notes (optionnel)</label>
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
                  Enregistrer l'accord
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table factures */}
      {activeTab === 'factures' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>
          {filtrees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b7355' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>◫</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune facture</div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f3ef' }}>
                    {['Reference', 'Emetteur', 'Destinataire', 'Montant TTC', 'Emission', 'Echeance', 'Statut', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#8b7355', textAlign: 'left', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrees.map((f) => {
                    const [bg, tc, dot] = STATUT_COLORS[f.statut]
                    return (
                      <tr key={f.id}
                        onClick={() => setSelected(f)}
                        style={{ borderTop: '1px solid #f5f3ef', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f5f3ef'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#1a1a1a' }}>{f.reference}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#4a5568' }}>{f.emetteur?.nom ?? '-'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#4a5568' }}>{f.destinataire?.nom ?? '-'}</td>
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
                          <button onClick={e => { e.stopPropagation(); setSelected(f) }} style={{ padding: '4px 10px', borderRadius: 7, border: '1.5px solid #e8e3d8', background: '#f5f3ef', fontSize: 11, cursor: 'pointer' }}>Voir</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal detail facture */}
      {selected && (() => {
        const regimeSelected = regimeTVA(selected.destinataire?.pays)
        const ht = selected.montant_ht || 0
        const tvaAffichee = calcTVA(ht, selected.tva_pct || 0, regimeSelected)
        const ttcAffiche = ht + tvaAffichee
        const mentionSelected = mentionTVA(regimeSelected)
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }} onClick={() => setSelected(null)}>
            <div style={{ background: '#fff', borderRadius: 4, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
              <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)', borderRadius: '20px 20px 0 0', padding: '24px 28px', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>FACTURE ETHYS</div>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>{selected.reference}</div>
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{'Ref. commande : ' + selected.commande?.reference}</div>
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
                            {accord ? 'Prix accord commercial' : 'Decomposition du prix'}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            <div style={{ fontSize: 11, color: '#4a5568' }}>Prix de base</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a', textAlign: 'right' }}>{prixBase.toFixed(4) + ' EUR/kg'}</div>
                            {remisePalier > 0 && <>
                              <div style={{ fontSize: 11, color: '#4a5568' }}>Remise volume commande</div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#2d5016', textAlign: 'right' }}>{'-' + remisePalier + '%'}</div>
                            </>}
                            {remiseAnnuelle > 0 && <>
                              <div style={{ fontSize: 11, color: '#4a5568' }}>Remise volume annuel</div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#2d5016', textAlign: 'right' }}>{'-' + remiseAnnuelle + '%'}</div>
                            </>}
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', borderTop: '1px solid #c8d8b8', paddingTop: 6 }}>Prix applicable</div>
                            <div style={{ fontSize: 12, fontWeight: 900, color: '#1a1a1a', textAlign: 'right', borderTop: '1px solid #c8d8b8', paddingTop: 6 }}>{prixFinal.toFixed(4) + ' EUR/kg'}</div>
                          </div>
                          {accord?.notes && <div style={{ fontSize: 10, color: '#4a5568', marginTop: 8, fontStyle: 'italic' }}>{accord.notes}</div>}
                        </div>
                      )
                    })()}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#c2956e' }}>{fmt(ttcAffiche)}</div>
                    <div style={{ fontSize: 10, opacity: 0.65 }}>TTC</div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: STATUT_COLORS[selected.statut][0], color: STATUT_COLORS[selected.statut][1] }}>{STATUT_LABELS[selected.statut]}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '22px 28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  {[{ titre: 'Emetteur', data: selected.emetteur }, { titre: 'Destinataire', data: selected.destinataire }].map(({ titre, data }) => (
                    <div key={titre} style={{ padding: '12px 14px', borderRadius: 4, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#8b7355', marginBottom: 6, textTransform: 'uppercase' }}>{titre}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{data?.nom ?? '-'}</div>
                      {data?.email_contact && <div style={{ fontSize: 11, color: '#4a5568', marginTop: 2 }}>{data.email_contact}</div>}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                  {[
                    ["Date d'emission", new Date(selected.date_emission).toLocaleDateString('fr-FR')],
                    ["Date d'echeance", new Date(selected.date_echeance).toLocaleDateString('fr-FR')],
                    ["Date de paiement", selected.date_paiement ? new Date(selected.date_paiement).toLocaleDateString('fr-FR') : '-'],
                  ].map(([l, v]) => (
                    <div key={l} style={{ padding: '10px 12px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 3 }}>{l}</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{v}</div>
                    </div>
                  ))}
                </div>

                {selected.lignes?.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Detail des prestations</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e8e3d8', borderRadius: 8, overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ background: '#f5f3ef' }}>
                          {['Description', 'Qte', 'Unite', 'PU (EUR)', 'Total HT'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: '#8b7355', textAlign: h === 'Description' ? 'left' : 'right', textTransform: 'uppercase' }}>{h}</th>
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
                            <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, textAlign: 'right', color: '#1a1a1a' }}>{fmt(l.total_ht || l.quantite * l.prix_unitaire)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: mentionSelected ? 10 : 20 }}>
                  <div style={{ width: 260 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f5f3ef', fontSize: 12 }}>
                      <span style={{ color: '#4a5568' }}>Sous-total HT</span>
                      <span style={{ fontWeight: 600 }}>{fmt(ht)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f5f3ef', fontSize: 12 }}>
                      <span style={{ color: '#4a5568' }}>
                        {regimeSelected === 'france' ? ('TVA ' + (selected.tva_pct || 0) + '%') : regimeSelected === 'ue' ? 'TVA intracommunautaire' : 'TVA (exoneree)'}
                      </span>
                      <span style={{ fontWeight: 600 }}>{fmt(tvaAffichee)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
                      <span style={{ fontWeight: 700, color: '#1a1a1a' }}>Total TTC</span>
                      <span style={{ fontWeight: 900, color: '#1a1a1a', fontSize: 16 }}>{fmt(ttcAffiche)}</span>
                    </div>
                  </div>
                </div>

                {mentionSelected && (
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: '#fdf8ec', border: '1px solid #e8d5a0', fontSize: 11, color: '#8b6914', marginBottom: 20, fontStyle: 'italic' }}>
                    {mentionSelected}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  {selected.statut !== 'payee' && selected.statut !== 'annulee' && (
                    <button onClick={() => marquerPayee(selected.id)} style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Marquer comme payee</button>
                  )}
                  <button onClick={() => handleTelechargerPDF(selected)} disabled={pdfLoading} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #2d5016', background: pdfLoading ? '#f5f3ef' : '#f0f4ec', color: pdfLoading ? '#8b7355' : '#2d5016', fontSize: 13, fontWeight: 700, cursor: pdfLoading ? 'default' : 'pointer' }}>
                    {pdfLoading ? 'Generation...' : 'Telecharger PDF'}
                  </button>
                  <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#8b7355', fontSize: 13, cursor: 'pointer' }}>Fermer</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal nouvelle facture */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f5f3ef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Nouvelle facture</span>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, color: '#8b7355', cursor: 'pointer' }}>x</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Commande *</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <select value={filterMarqueForm} onChange={e => setFilterMarqueForm(e.target.value)} style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 11, outline: 'none', background: filterMarqueForm ? '#1a1a1a' : '#f5f3ef', color: filterMarqueForm ? '#fff' : '#4a5568' }}>
                    <option value="">Toutes marques</option>
                    {marquesUniques.sort().map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input type="text" placeholder="Rechercher n° commande..." value={searchCommande} onChange={e => setSearchCommande(e.target.value)} style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 11, outline: 'none' }} />
                </div>
                <select value={form.commande_id} onChange={e => handleCommandeChange(e.target.value)} style={inputStyle}>
                  <option value="">Selectionner une commande...</option>
                  {commandesFiltrees.map(c => <option key={c.id} value={c.id}>{c.reference + ' - ' + (c.marque?.nom ?? '')}</option>)}
                </select>
              </div>

              {form.commande_id && ligneAuto && (
                <div style={{ padding: '14px 16px', borderRadius: 8, background: '#f0f4ec', border: '1px solid #c8d8b8' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2d5016', marginBottom: 10 }}>Ligne de facturation (generee automatiquement)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 3 }}>Description</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{ligneAuto.description}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 3 }}>Quantite (kg)</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{ligneAuto.quantite.toLocaleString('fr-FR')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 3 }}>PU (EUR/kg)</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{ligneAuto.prix_unitaire.toFixed(4)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 3 }}>Total HT</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#2d5016' }}>{fmt(totalHT)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Emetteur</label>
                  <div style={{ ...inputStyle, background: '#f5f3ef', color: '#4a5568', display: 'flex', alignItems: 'center', cursor: 'not-allowed' }}>
                    TEXTILE LOOP
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Destinataire *</label>
                  <select value={form.destinataire_id} onChange={e => set('destinataire_id', e.target.value)} style={inputStyle}>
                    <option value="">Selectionner...</option>
                    {entreprises.filter(e => e.id !== TEXTILE_LOOP_ID).map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Date d'echeance *</label>
                  <input type="date" value={form.date_echeance} onChange={e => set('date_echeance', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>
                    {'TVA (%)' + (regimeForm !== 'france' ? ' - Non applicable' : '')}
                  </label>
                  <input type="number" value={form.tva_pct} onChange={e => set('tva_pct', e.target.value)} disabled={regimeForm !== 'france'} style={{ ...inputStyle, background: regimeForm !== 'france' ? '#f5f3ef' : '#fff', color: regimeForm !== 'france' ? '#8b7355' : '#1a1a1a' }} />
                </div>
              </div>

              {mentionForm && (
                <div style={{ padding: '8px 12px', borderRadius: 6, background: '#fdf8ec', border: '1px solid #e8d5a0', fontSize: 11, color: '#8b6914', fontStyle: 'italic' }}>
                  {mentionForm}
                </div>
              )}

              <div style={{ padding: '12px 14px', borderRadius: 4, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#4a5568' }}>Total HT</span>
                  <span style={{ fontWeight: 700 }}>{fmt(totalHT)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#4a5568' }}>
                    {regimeForm === 'france' ? ('TVA ' + form.tva_pct + '%') : regimeForm === 'ue' ? 'TVA intracommunautaire' : 'TVA (exoneree)'}
                  </span>
                  <span style={{ fontWeight: 700 }}>{fmt(totalTVA)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ fontWeight: 700, color: '#1a1a1a' }}>Total TTC</span>
                  <span style={{ fontWeight: 900, color: '#1a1a1a' }}>{fmt(totalTTC)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#8b7355', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button onClick={creerFacture} disabled={loading || !ligneAuto} style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: (loading || !ligneAuto) ? '#d4c5b0' : '#1a1a1a', color: (loading || !ligneAuto) ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: (loading || !ligneAuto) ? 'default' : 'pointer' }}>
                  {loading ? 'Création...' : 'Créer la facture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
