'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

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
  statut: 'brouillon' | 'emise' | 'en_attente' | 'payee' | 'en_retard' | 'annulee'
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
  onClose: () => void
  commandes: Commande[]
  entreprises: Entreprise[]
  accords: AccordCommercial[]
  setFactures: React.Dispatch<React.SetStateAction<Facture[]>>
}

const TEXTILE_LOOP_UUID = 'a0000000-0000-0000-0000-000000000001'

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

export default function NouvelleFactureModal({ onClose, commandes, entreprises, accords, setFactures }: Props) {
  const t = useTranslations('facturation')
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

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
      onClose()
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1.5px solid #d4c5b0', fontSize: 12,
    boxSizing: 'border-box' as const, outline: 'none'
  }

  return (
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
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, color: '#8b7355', cursor: 'pointer' }}>✕</button>
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
            <button onClick={onClose} style={{
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
  )
}
