'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'qrcode'

interface QRCodeData {
  id: string
  reference: string
  url_publique: string
  nb_scans: number
  actif: boolean
  created_at: string
}

interface Lot {
  id: string
  reference: string
  type_coton: string
  volume_tonnes: number
  origine: string | null
  certification: string | null
  statut: string
  avancement_pct: number
  avancement_commande_pct?: number
  commande: {
    reference: string
    titre: string | null
    marque: { nom: string } | null
    filature: { nom: string } | null
    fournisseur: { nom: string } | null
  } | null
  qr_codes: QRCodeData[]
}

interface Certification {
  id: string
  numero: string
  date_emission: string
  date_validite: string
  declaration: {
    type_produit: string
    volume_recycle_kg: number
    volume_vierge_kg: number
    pct_recycle: number
    provenance_pays: string | null
    filature_nom: string | null
    filature_pays: string | null
    description: string | null
    entreprise: { nom: string; pays: string } | null
  } | null
  qr_codes: QRCodeData[]
}

interface DemandeQr {
  id: string
  lot_id: string
  statut: 'en_attente' | 'acceptee' | 'refusee'
  created_at: string
}

interface Props {
  lots: Lot[]
  user: { id: string }
  profil: { role: string; entreprise_id: string }
  certifications: Certification[]
  certificationIdActif: string | null
  lotIdActif: string | null
  demandesQrEnAttente: DemandeQr[]
  marques: { id: string; nom: string }[
}

function CertQRImage({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  useEffect(() => {
    QRCode.toDataURL(url, { width: 80, margin: 1, color: { dark: '#1a1a1a', light: '#FFFFFF' } }).then(setDataUrl)
  }, [url])
  if (!dataUrl) return <div style={{ width: 80, height: 80, background: '#e8e3d8', borderRadius: 4 }} />
  return <img src={dataUrl} alt="QR" style={{ width: 80, height: 80, borderRadius: 4, border: '2px solid #fff' }} />
}

export default function QRCodeClient({ lots: initial, user, profil, certifications, certificationIdActif, lotIdActif, demandesQrEnAttente, marques }: Props) {
  const supabase = createClient()
  const [lots, setLots] = useState<Lot[]>(initial)
 const [selected, setSelected] = useState<Lot | null>(
  certificationIdActif ? null : (lotIdActif ? initial.find(l => l.id === lotIdActif) : null) ?? initial[0] ?? null
)
  const [generating, setGenerating] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [previewPublic, setPreviewPublic] = useState(false)
  const [source, setSource] = useState<'lots' | 'certs'>(certificationIdActif ? 'certs' : 'lots')
  const [selectedCert, setSelectedCert] = useState<Certification | null>(
    certificationIdActif ? (certifications.find(c => c.declaration?.type_produit && c.id === certificationIdActif) ?? null) : null
  )
  const [urlCopied, setUrlCopied] = useState(false)

  // Demandes QR : état local initialisé depuis les props
  const [demandesQr, setDemandesQr] = useState<DemandeQr[]>(demandesQrEnAttente)
  const [loadingDemande, setLoadingDemande] = useState(false)
  const [errorDemande, setErrorDemande] = useState('')
  const [showTransfert, setShowTransfert] = useState(false)
  const [transfertMarqueId, setTransfertMarqueId] = useState('')
  const [transfertMarqueEmail, setTransfertMarqueEmail] = useState('')
  const [transfertNouvelleMarque, setTransfertNouvelleMarque] = useState(false)
  const [transfertSaving, setTransfertSaving] = useState(false)
  const [transfertMessage, setTransfertMessage] = useState('')

  // Filtre demandes uniquement (actif si arrivée via notif)
  const [filtreDemandesOnly, setFiltreDemandesOnly] = useState(!!lotIdActif)

  const role = profil.role
  const isAdmin = role === 'admin'

  const qrActif = selected?.qr_codes?.[0]

  // Demande en attente pour le lot sélectionné
  const demandeEnAttente = selected
    ? demandesQr.find(d => d.lot_id === selected.id && d.statut === 'en_attente') ?? null
    : null

  useEffect(() => {
    if (!qrActif) { setQrDataUrl(null); return }
    QRCode.toDataURL(qrActif.url_publique, {
      width: 180, margin: 2,
      color: { dark: '#1a1a1a', light: '#FFFFFF' }
    }).then(setQrDataUrl)
  }, [qrActif?.id])

  // Admin : génère le QR après validation de la demande
  const genererQR = async (demandeId?: string) => {
    if (!selected) return
    setGenerating(true)
    setErrorDemande('')

    const reference = 'ETHYS-QR-' + (selected.commande?.reference ?? 'CMD') + '-' + selected.reference.split('-').pop()
    const { data: existing } = await supabase.from('qr_codes').select('*').eq('reference', reference).single()
    if (existing) {
      const updatedLot = { ...selected, qr_codes: [existing as QRCodeData] }
      setLots(prev => prev.map(l => l.id === selected.id ? updatedLot : l))
      setSelected(updatedLot)
      setGenerating(false)
      return
    }

    const urlPublique = window.location.origin + '/tracabilite/' + reference
    const dataEncodee = {
      lot_id: selected.id,
      lot_reference: selected.reference,
      commande: selected.commande?.reference,
      marque: selected.commande?.marque?.nom,
      filature: selected.commande?.filature?.nom,
      fournisseur: selected.commande?.fournisseur?.nom,
      type_coton: selected.type_coton,
      volume_tonnes: selected.volume_tonnes,
      origine: selected.origine,
      certification: 'ETHYS',
      generated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('qr_codes')
      .insert({ lot_id: selected.id, reference, url_publique: urlPublique, data_encodee: dataEncodee, actif: true, nb_scans: 0 })
      .select()
      .single()

    if (!error && data) {
      const updatedLot = { ...selected, qr_codes: [data as QRCodeData] }
      setLots(prev => prev.map(l => l.id === selected.id ? updatedLot : l))
      setSelected(updatedLot)
      await supabase.from('lots').update({ statut: 'valide' }).eq('id', selected.id)

      // Si génération suite à demande : marque la demande comme acceptée
      if (demandeId) {
        await fetch(`/api/demandes-qr/${demandeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statut: 'acceptee', traite_par: user.id })
        })
        setDemandesQr(prev => prev.filter(d => d.id !== demandeId))
      }
    }
    setGenerating(false)
  }

  // Non-admin : soumet une demande de génération QR
  const demanderQR = async () => {
    if (!selected) return
    setLoadingDemande(true)
    setErrorDemande('')

    const res = await fetch('/api/demandes-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lot_id: selected.id,
        lot_reference: selected.reference,
        commande_reference: selected.commande?.reference ?? '',
        demandeur_id: user.id,
        entreprise_id: profil.entreprise_id || null,
      })
    })
    const result = await res.json()

    if (result.error) {
      setErrorDemande(result.error)
    } else {
      setDemandesQr(prev => [...prev, result.data as DemandeQr])
    }
    setLoadingDemande(false)
  }

  // Admin : refuse la demande
  const refuserDemande = async (demandeId: string) => {
    setLoadingDemande(true)
    setErrorDemande('')

    const res = await fetch(`/api/demandes-qr/${demandeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'refusee', traite_par: user.id })
    })
    const result = await res.json()

    if (result.error) {
      setErrorDemande(result.error)
    } else {
      setDemandesQr(prev => prev.filter(d => d.id !== demandeId))
    }
    setLoadingDemande(false)
  }

  const copierURL = () => {
    if (qrActif) {
      navigator.clipboard.writeText(qrActif.url_publique)
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 3000)
    }
  }

  const telechargerQR = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = (qrActif?.reference ?? 'qr-ethys') + '.png'
    a.click()
  }

  // Rendu du bouton QR selon rôle et état
  const renderBoutonQR = () => {
    if (qrActif) return null

    if (isAdmin) {
      if (demandeEnAttente) {
        return (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#b8860b', background: '#fdf8ec', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
              Demande de génération en attente
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => refuserDemande(demandeEnAttente.id)}
                disabled={loadingDemande}
                style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#fff', color: '#4a5568', fontSize: 12, fontWeight: 700, cursor: loadingDemande ? 'default' : 'pointer', opacity: loadingDemande ? 0.6 : 1 }}
              >
                Refuser la demande
              </button>
              <button
                onClick={() => genererQR(demandeEnAttente.id)}
                disabled={generating || loadingDemande}
                style={{ flex: 1, padding: '10px', borderRadius: 4, border: 'none', background: generating ? '#d4c5b0' : '#1a1a1a', color: generating ? '#8b7355' : '#fff', fontSize: 12, fontWeight: 700, cursor: generating ? 'default' : 'pointer' }}
              >
                {generating ? 'Génération...' : 'Générer le QR Code'}
              </button>
            </div>
          </div>
        )
      }
      return (
        <button
          onClick={() => genererQR()}
          disabled={generating}
          style={{ width: '100%', padding: '11px', borderRadius: 4, border: 'none', background: generating ? '#d4c5b0' : '#1a1a1a', color: generating ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: generating ? 'default' : 'pointer' }}
        >
          {generating ? 'Génération...' : 'Générer le QR Code ETHYS'}
        </button>
      )
    }

    if (demandeEnAttente) {
      return (
        <div style={{ fontSize: 11, color: '#b8860b', background: '#fdf8ec', borderRadius: 6, padding: '10px 12px', textAlign: 'center', width: '100%' }}>
          Demande envoyée<br />en attente de validation Textile Loop
        </div>
      )
    }

    // src/components/QRCodeClient.tsx — renderBoutonQR(), branche non-admin sans demande en attente

// Lot non terminé : bouton désactivé avec message
const lotTermine = (selected?.avancement_commande_pct ?? selected?.avancement_pct ?? 0) >= 100

return (
  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
    {!lotTermine && (
      <div style={{ fontSize: 11, color: '#8b7355', background: '#f5f3ef', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
        Le lot doit être à 100% pour demander un QR Code
      </div>
    )}
    <button
      onClick={demanderQR}
      disabled={loadingDemande || !lotTermine}
      style={{
        width: '100%', padding: '11px', borderRadius: 4, border: 'none',
        background: (loadingDemande || !lotTermine) ? '#d4c5b0' : '#1a1a1a',
        color: (loadingDemande || !lotTermine) ? '#8b7355' : '#fff',
        fontSize: 13, fontWeight: 700,
        cursor: (loadingDemande || !lotTermine) ? 'default' : 'pointer'
      }}
    >
      {loadingDemande ? 'Envoi...' : 'Demander la génération QR'}
    </button>
  </div>
)
  }

  // Liste filtrée des lots
  const lotsFiltres = lots.filter(lot =>
    !filtreDemandesOnly || demandesQr.some(d => d.lot_id === lot.id && d.statut === 'en_attente')
  )

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: 280, minWidth: 280, background: '#fff', borderRight: '1px solid #e8e3d8', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f5f3ef' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <button onClick={() => setSource('lots')} style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer', background: source === 'lots' ? '#1a1a1a' : '#f5f3ef', color: source === 'lots' ? '#fff' : '#4a5568', fontSize: 11, fontWeight: 700 }}>
              Lots
            </button>
            <button onClick={() => setSource('certs')} style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer', background: source === 'certs' ? '#1a1a1a' : '#f5f3ef', color: source === 'certs' ? '#fff' : '#4a5568', fontSize: 11, fontWeight: 700 }}>
              Certifications
            </button>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>{source === 'lots' ? 'Lots de production' : 'Certifications ETHYS'}</div>
          <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{source === 'lots' ? lots.filter(l => l.qr_codes?.length > 0).length : certifications.filter(c => c.qr_codes?.length > 0).length}</span>{' QR generés · '}
            <span style={{ fontWeight: 700, color: '#D97706' }}>{source === 'lots' ? lots.filter(l => !l.qr_codes?.length).length : certifications.filter(c => !c.qr_codes?.length).length}</span>{' en attente'}
          </div>
          {source === 'lots' && isAdmin && (
            <button
              onClick={() => setFiltreDemandesOnly(v => !v)}
              style={{
                width: '100%', padding: '5px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: filtreDemandesOnly ? '#D97706' : '#f5f3ef',
                color: filtreDemandesOnly ? '#fff' : '#4a5568',
                fontSize: 11, fontWeight: 700
              }}
            >
              {filtreDemandesOnly ? '▣ Demandes QR uniquement' : '▣ Voir demandes QR'}
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {source === 'certs' && (
            <>
              {certifications.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: '#8b7355', fontSize: 12 }}>Aucune certification disponible.</div>
              ) : certifications.map(cert => {
                const hasQR = cert.qr_codes?.length > 0
                const isActive = selectedCert?.id === cert.id
                return (
                  <div key={cert.id} onClick={() => { setSelectedCert(cert); setSelected(null) }} style={{ padding: '12px 16px', cursor: 'pointer', background: isActive ? '#F0FDF4' : 'transparent', borderLeft: '3px solid ' + (isActive ? '#1a1a1a' : 'transparent'), borderBottom: '1px solid #f5f3ef' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a' }}>{cert.numero}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: hasQR ? '#f0f4ec' : '#fdf8ec', color: hasQR ? '#2d5016' : '#b8860b' }}>
                        {hasQR ? 'QR actif' : 'Sans QR'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#4a5568' }}>{cert.declaration?.type_produit === 'fil' ? 'Fil ETHYS' : cert.declaration?.type_produit === 'tissu' ? 'Tissu ETHYS' : 'Produit fini ETHYS'}</div>
                    <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>{cert.declaration?.entreprise?.nom}</div>
                  </div>
                )
              })}
            </>
          )}

          {source === 'lots' && lotsFiltres.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#8b7355', fontSize: 12 }}>
              {filtreDemandesOnly ? 'Aucune demande QR en attente.' : 'Aucun lot disponible.'}
            </div>
          )}
          {source === 'lots' && lotsFiltres.map(lot => {
            const hasQR = lot.qr_codes?.length > 0
            const isActive = selected?.id === lot.id
            const hasDemande = demandesQr.some(d => d.lot_id === lot.id && d.statut === 'en_attente')
            return (
              <div key={lot.id} onClick={() => setSelected(lot)} style={{ padding: '12px 16px', cursor: 'pointer', background: isActive ? '#F0FDF4' : hasDemande ? '#fffbeb' : 'transparent', borderLeft: '3px solid ' + (isActive ? '#1a1a1a' : 'transparent'), borderBottom: '1px solid #f5f3ef' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a' }}>{lot.reference}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: hasQR ? '#f0f4ec' : hasDemande ? '#fef3c7' : '#fdf8ec', color: hasQR ? '#2d5016' : hasDemande ? '#b8860b' : '#b8860b' }}>
                    {hasQR ? 'QR actif' : hasDemande ? 'Demande QR' : 'En attente'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 2 }}>{lot.commande?.reference} · {lot.commande?.marque?.nom}</div>
                <div style={{ fontSize: 11, color: '#8b7355' }}>{Math.round((lot.volume_tonnes ?? 0) * 1000).toLocaleString('fr-FR')} kg · {lot.type_coton === 'recycle' ? 'Recycle' : 'Vierge'}</div>
                {hasQR && <div style={{ fontSize: 10, color: '#8b7355', marginTop: 4 }}>{lot.qr_codes[0].nb_scans} scan(s)</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Panneau lot */}
      {selected && (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Infos lot */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '22px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Informations du lot</div>
              {[
                ['Reference lot', selected.reference],
                ['Commande', selected.commande?.reference ?? '-'],
                ['Marque', selected.commande?.marque?.nom ?? '-'],
                ['Filature', selected.commande?.filature?.nom ?? '-'],
                ['Fournisseur', selected.commande?.fournisseur?.nom ?? '-'],
                ['Type coton', selected.type_coton === 'recycle' ? 'Recycle' : 'Vierge'],
                ['Volume', Math.round((selected.volume_tonnes ?? 0) * 1000).toLocaleString('fr-FR') + ' kg'],
                ['Origine', selected.origine ?? '-'],
                ['Certification fil', 'ETHYS'],
                ['Avancement', selected.avancement_pct + '%'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#8b7355', width: 120, flexShrink: 0 }}>{l}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* QR Code */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16, alignSelf: 'flex-start' }}>
                {qrActif ? 'QR Code actif' : 'QR Code ETHYS'}
              </div>

              {/* Image QR */}
              <div style={{ padding: 16, borderRadius: 8, marginBottom: 12, border: '2px solid ' + (qrActif ? '#f0f4ec' : '#e8e3d8'), background: qrActif ? '#fff' : '#f5f3ef', position: 'relative' }}>
                {generating ? (
                  <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 12, color: '#8b7355' }}>Génération...</div>
                  </div>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code ETHYS" style={{ width: 180, height: 180, display: 'block' }} />
                ) : (
                  <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
                    <div style={{ fontSize: 80, color: '#1a1a1a' }}>▣</div>
                  </div>
                )}
                {qrActif && !generating && (
                  <div style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#2d5016', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth='3'><polyline points='20 6 9 17 4 12'/></svg>
                  </div>
                )}
              </div>

              {qrActif && (
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{qrActif.reference}</div>
                  <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>{qrActif.nb_scans} scan(s)</div>
                </div>
              )}

              {/* Donnees encodees 2x2 */}
              <div style={{ width: '100%', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#8b7355', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{"Données encodées"}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    ['Origine', selected.origine ?? '-'],
                    ['Filature', selected.commande?.filature?.nom ?? '-'],
                    ['Type coton', selected.type_coton === 'recycle' ? 'Recycle' : 'Vierge'],
                    ['Certification', 'ETHYS'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ padding: '8px 10px', borderRadius: 8, background: '#f5f3ef' }}>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Erreur */}
              {errorDemande && (
                <div style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: '#fdf0f0', border: '1px solid #c8a0a0', fontSize: 12, color: '#8b3a3a', marginBottom: 10 }}>
                  {errorDemande}
                </div>
              )}

              {/* Boutons selon rôle */}
              {!qrActif ? (
                renderBoutonQR()
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => window.open(qrActif.url_publique, '_blank')} style={{ flex: 1, padding: '10px', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {"Voir page publique"}
                    </button>
                    <button onClick={() => setPreviewPublic(true)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #1a1a1a', background: '#fff', color: '#1a1a1a', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {"Aperçu"}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={telechargerQR} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid #e8e3d8', background: '#f5f3ef', fontSize: 12, cursor: 'pointer', color: '#4a5568' }}>
                      {"Télécharger"}
                    </button>
                    <button onClick={copierURL} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid #e8e3d8', background: urlCopied ? '#f0f4ec' : '#f5f3ef', fontSize: 12, cursor: 'pointer', color: urlCopied ? '#2d5016' : '#4a5568', fontWeight: urlCopied ? 700 : 400 }}>
                      {urlCopied ? 'URL copiee !' : 'Copier URL'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Etat vide */}
      {!selected && !selectedCert && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b7355' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>▣</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Selectionnez un lot</div>
          </div>
        </div>
      )}

      {/* Modal apercu public */}
      {previewPublic && qrActif && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }} onClick={() => setPreviewPublic(false)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)', borderRadius: '12px 12px 0 0', padding: '16px', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>ETHYS · Tracabilite TOTALE</div>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>Votre fil ETHYS</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{'Lot #' + selected.reference}</div>
                </div>
                <button onClick={() => setPreviewPublic(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>x</button>
              </div>

              {qrDataUrl && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{ background: '#fff', padding: 10, borderRadius: 4 }}>
                    <img src={qrDataUrl} alt="QR" style={{ width: 100, height: 100, display: 'block' }} />
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '14px', marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, marginBottom: 10, letterSpacing: 1 }}>MATIERES PREMIERES</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 51, background: '#8b7355', borderRadius: 6, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>51%</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Coton recycle</div>
                  </div>
                  <div style={{ flex: 49, background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>49%</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Coton vierge</div>
                  </div>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '51%', background: '#c2956e', borderRadius: 3 }} />
                </div>
              </div>

              <div style={{ background: 'rgba(110,231,183,0.2)', borderRadius: 4, padding: '12px 14px', border: '1px solid rgba(110,231,183,0.4)', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#c2956e', marginBottom: 4 }}>Fil certifie ETHYS</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  {'Ce fil certifie ETHYS est le resultat de la transformation de coton recycle (51%) et de coton vierge (49%). Il a ete realise par ' + (selected.commande?.filature?.nom ?? 'la filature') + '.'}
                </div>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {[
                ['Origine matiere', selected.origine ?? 'Non renseigne'],
                ['Filature', selected.commande?.filature?.nom ?? '-'],
                ['Certification fil', 'ETHYS'],
                ['Fournisseur coton', selected.commande?.fournisseur?.nom ?? '-'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f3ef' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: label === 'Certification fil' ? '#f0f4ec' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>
                    {label === 'Certification fil' ? 'E' : label === 'Filature' ? 'F' : label === 'Origine matiere' ? 'O' : 'C'}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 11, color: label === 'Certification fil' ? '#2d5016' : '#4a5568', fontWeight: label === 'Certification fil' ? 700 : 400 }}>{val}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 4, background: '#f5f3ef', fontSize: 10, color: '#8b7355', textAlign: 'center' }}>
                {'Donnees verifiees et certifiees par TEXTILE LOOP'}
                <br />{'Plateforme ETHYS · ' + qrActif.reference}
              </div>
              <button onClick={() => window.open(qrActif.url_publique, '_blank')} style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {"Ouvrir la page publique"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panneau certification */}
      {selectedCert && source === 'certs' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>
                  {selectedCert.declaration?.type_produit === 'fil' ? 'Fil ETHYS' : selectedCert.declaration?.type_produit === 'tissu' ? 'Tissu ETHYS' : 'Produit fini ETHYS'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2d5016' }}>{selectedCert.numero}</div>
                <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>
                  {'Valide jusqu\'au ' + new Date(selectedCert.date_validite).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#f0f4ec', color: '#2d5016' }}>Certifie</span>
            </div>

            <div style={{ background: '#F0FDF4', borderRadius: 6, padding: '16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, textTransform: 'uppercase' }}>Composition</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: selectedCert.declaration?.pct_recycle ?? 51, background: '#8b7355', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{selectedCert.declaration?.pct_recycle ?? 0}{'%'}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Recycle</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{(selectedCert.declaration?.volume_recycle_kg ?? 0).toLocaleString('fr-FR') + ' kg'}</div>
                </div>
                <div style={{ flex: 100 - (selectedCert.declaration?.pct_recycle ?? 51), background: '#d4c5b0', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#4a5568' }}>{100 - (selectedCert.declaration?.pct_recycle ?? 0)}{'%'}</div>
                  <div style={{ fontSize: 10, color: '#4a5568' }}>Vierge</div>
                  <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>{(selectedCert.declaration?.volume_vierge_kg ?? 0).toLocaleString('fr-FR') + ' kg'}</div>
                </div>
              </div>
            </div>

            {[
              ['Entreprise', selectedCert.declaration?.entreprise?.nom ?? '-'],
              ['Filature', selectedCert.declaration?.filature_nom ?? '-'],
              ['Pays filature', selectedCert.declaration?.filature_pays ?? '-'],
              ['Provenance coton', selectedCert.declaration?.provenance_pays ?? '-'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f3ef' }}>
                <span style={{ fontSize: 12, color: '#8b7355', width: 130, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{val}</span>
              </div>
            ))}

            <div style={{ marginTop: 20 }}>
              {selectedCert.qr_codes?.length > 0 ? (
                <div style={{ padding: '16px', borderRadius: 8, background: '#f0f4ec', border: '1px solid #c8d8b8' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
                    <CertQRImage url={selectedCert.qr_codes[0].url_publique} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#2d5016', marginBottom: 4 }}>QR Code actif</div>
                      <div style={{ fontSize: 11, color: '#2d5016', marginBottom: 2 }}>{selectedCert.qr_codes[0].reference}</div>
                      <div style={{ fontSize: 11, color: '#8b7355' }}>{selectedCert.qr_codes[0].nb_scans + ' scan(s)'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button onClick={() => window.open(selectedCert.qr_codes[0].url_publique, '_blank')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      {"Voir page publique"}
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(selectedCert.qr_codes[0].url_publique); setUrlCopied(true); setTimeout(() => setUrlCopied(false), 2000) }} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid #1a1a1a', background: '#fff', color: '#1a1a1a', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      {urlCopied ? 'Copiee !' : 'Copier URL'}
                    </button>
                  </div>
                  {/* Bouton transfert marque */}
                  <button
                    onClick={() => { setShowTransfert(true); setTransfertMessage(''); setTransfertMarqueId(''); setTransfertMarqueEmail(''); setTransfertNouvelleMarque(false) }}
                    style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1.5px solid #2d5016', background: '#f0f4ec', color: '#2d5016', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Transférer à une marque
                  </button>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    const reference = 'ETHYS-CERT-' + selectedCert.numero.replace(/\//g, '-')
                    const res = await fetch('/api/qr-certification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        certification_id: selectedCert.id,
                        numero: selectedCert.numero,
                        data_encodee: {
                          certification_id: selectedCert.id,
                          numero: selectedCert.numero,
                          type_produit: selectedCert.declaration?.type_produit,
                          entreprise: selectedCert.declaration?.entreprise?.nom,
                          filature: selectedCert.declaration?.filature_nom,
                          pct_recycle: selectedCert.declaration?.pct_recycle,
                          volume_recycle_kg: selectedCert.declaration?.volume_recycle_kg,
                          volume_vierge_kg: selectedCert.declaration?.volume_vierge_kg,
                        }
                      })
                    })
                    const result = await res.json()
                    if (result.data) window.location.reload()
                    else console.error('Error:', result.error)
                  }}
                  style={{ width: '100%', padding: '11px', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Generer le QR Code consommateur
                </button>
              )}
            </div>
          </div>

          {/* Modale transfert marque */}
          {showTransfert && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', borderRadius: 8, padding: '28px 24px', width: 440, maxWidth: '90vw' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Transférer le QR à une marque</div>
                  <button onClick={() => setShowTransfert(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>×</button>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={transfertNouvelleMarque} onChange={e => setTransfertNouvelleMarque(e.target.checked)} />
                  Marque non enregistrée sur ETHYS
                </label>

                {transfertNouvelleMarque ? (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Email de la marque *</label>
                    <input
                      type="email"
                      value={transfertMarqueEmail}
                      onChange={e => setTransfertMarqueEmail(e.target.value)}
                      placeholder="contact@marque.com"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                    <div style={{ fontSize: 11, color: '#8b7355', marginTop: 6 }}>Un email d'invitation sera envoyé à cette adresse.</div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Sélectionner la marque *</label>
                    <select
                      value={transfertMarqueId}
                      onChange={e => setTransfertMarqueId(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="">Sélectionner une marque...</option>
                      {marques.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.nom}</option>
                      ))}
                    </select>
                  </div>
                )}

                {transfertMessage && (
                  <div style={{ padding: '10px 14px', borderRadius: 6, background: transfertMessage.includes('Erreur') ? '#fdf0f0' : '#f0f4ec', border: '1px solid ' + (transfertMessage.includes('Erreur') ? '#c8a0a0' : '#c8d8b8'), fontSize: 12, color: transfertMessage.includes('Erreur') ? '#8b3a3a' : '#2d5016', marginBottom: 12 }}>
                    {transfertMessage}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowTransfert(false)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#4a5568', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                  <button
                    disabled={transfertSaving || (!transfertNouvelleMarque && !transfertMarqueId) || (transfertNouvelleMarque && !transfertMarqueEmail)}
                    onClick={async () => {
                      setTransfertSaving(true)
                      setTransfertMessage('')
                      const marqueSelectionnee = marques.find((m: any) => m.id === transfertMarqueId)
                      const res = await fetch('/api/qr-transfert', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          certification_id: selectedCert.id,
                          qr_code_id: selectedCert.qr_codes[0].id,
                          filature_id: profil.entreprise_id,
                          filature_nom: selectedCert.declaration?.filature_nom ?? '',
                          marque_id: transfertNouvelleMarque ? null : transfertMarqueId,
                          marque_email: transfertNouvelleMarque ? transfertMarqueEmail : null,
                          marque_nom: transfertNouvelleMarque ? transfertMarqueEmail : (marqueSelectionnee?.nom ?? ''),
                          volume_kg: (selectedCert.declaration?.volume_recycle_kg ?? 0) + (selectedCert.declaration?.volume_vierge_kg ?? 0),
                          certification_reference: selectedCert.numero,
                        })
                      })
                      const result = await res.json()
                      if (result.success) {
                        setTransfertMessage(result.nouvelle_marque ? 'Email d\'invitation envoyé à la marque.' : 'QR code transféré. La marque a reçu un email.')
                        setTransfertSaving(false)
                        setTimeout(() => setShowTransfert(false), 2000)
                      } else {
                        setTransfertMessage('Erreur : ' + (result.error ?? 'inconnue'))
                        setTransfertSaving(false)
                      }
                    }}
                    style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: transfertSaving ? '#d4c5b0' : '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: transfertSaving ? 'default' : 'pointer' }}
                  >
                    {transfertSaving ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
