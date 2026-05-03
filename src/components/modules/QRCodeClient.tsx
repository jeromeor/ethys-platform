'use client'

import { useState, useEffect, useRef } from 'react'
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
  commande: {
    reference: string
    titre: string | null
    marque: { nom: string } | null
    filature: { nom: string } | null
    fournisseur: { nom: string } | null
  } | null
  qr_codes: QRCodeData[]
}

interface Props {
  lots: Lot[]
  user: { id: string }
}

export default function QRCodeClient({ lots: initial, user }: Props) {
  const supabase = createClient()
  const [lots, setLots] = useState<Lot[]>(initial)
  const [selected, setSelected] = useState<Lot | null>(initial[0] ?? null)
  const [generating, setGenerating] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [previewPublic, setPreviewPublic] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const qrActif = selected?.qr_codes?.[0]

  // Générer l'aperçu QR visuel
  useEffect(() => {
    if (!qrActif) { setQrDataUrl(null); return }
    QRCode.toDataURL(qrActif.url_publique, {
      width: 180, margin: 2,
      color: { dark: '#0A3D26', light: '#FFFFFF' }
    }).then(setQrDataUrl)
  }, [qrActif?.id])

  const genererQR = async () => {
    if (!selected) return
    setGenerating(true)

    const reference = `ETHYS-QR-${selected.commande?.reference ?? 'CMD'}-${selected.reference.split('-').pop()}`
    const urlPublique = `${window.location.origin}/tracabilite/${reference}`

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
      certification: selected.certification,
      generated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        lot_id: selected.id,
        reference,
        url_publique: urlPublique,
        data_encodee: dataEncodee,
        actif: true,
        nb_scans: 0,
      })
      .select()
      .single()

    if (!error && data) {
      const updatedLot = { ...selected, qr_codes: [data as QRCodeData] }
      setLots(prev => prev.map(l => l.id === selected.id ? updatedLot : l))
      setSelected(updatedLot)

      // Mettre à jour le statut du lot
      await supabase
        .from('lots')
        .update({ statut: 'valide' })
        .eq('id', selected.id)
    }
    setGenerating(false)
  }

  const copierURL = () => {
    if (qrActif) navigator.clipboard.writeText(qrActif.url_publique)
  }

  const telechargerQR = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `${qrActif?.reference ?? 'qr-ethys'}.png`
    a.click()
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Liste lots */}
      <div style={{
        width: 280, minWidth: 280, background: '#fff',
        borderRight: '1px solid #EEF0F3', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 2 }}>Lots de production</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>
            <span style={{ fontWeight: 700, color: '#0A3D26' }}>{lots.filter(l => l.qr_codes?.length > 0).length}</span> QR générés ·{' '}
            <span style={{ fontWeight: 700, color: '#D97706' }}>{lots.filter(l => !l.qr_codes?.length).length}</span> en attente
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {lots.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
              Aucun lot disponible.<br />Créez d'abord des lots en production.
            </div>
          ) : lots.map(lot => {
            const hasQR = lot.qr_codes?.length > 0
            const isActive = selected?.id === lot.id
            return (
              <div key={lot.id} onClick={() => setSelected(lot)} style={{
                padding: '12px 16px', cursor: 'pointer',
                background: isActive ? '#F0FDF4' : 'transparent',
                borderLeft: `3px solid ${isActive ? '#0A3D26' : 'transparent'}`,
                borderBottom: '1px solid #F8FAFC'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0A3D26' }}>{lot.reference}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                    background: hasQR ? '#D1FAE5' : '#FEF3C7',
                    color: hasQR ? '#065F46' : '#92400E'
                  }}>{hasQR ? '✓ QR généré' : '⏳ En attente'}</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>
                  {lot.commande?.reference} · {lot.commande?.marque?.nom}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>
                  {lot.volume_tonnes}T · {lot.type_coton === 'recycle' ? '♻ Recyclé' : '🌿 Vierge'}
                </div>
                {hasQR && (
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                    {lot.qr_codes[0].nb_scans} scan(s)
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Panneau QR */}
      {selected ? (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Infos lot */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '22px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>
                Informations du lot
              </div>
              {[
                ['Référence lot', selected.reference],
                ['Commande', selected.commande?.reference ?? '—'],
                ['Marque', selected.commande?.marque?.nom ?? '—'],
                ['Filature', selected.commande?.filature?.nom ?? '—'],
                ['Fournisseur', selected.commande?.fournisseur?.nom ?? '—'],
                ['Type coton', selected.type_coton === 'recycle' ? '♻ Recyclé' : '🌿 Vierge'],
                ['Volume', `${selected.volume_tonnes} T`],
                ['Origine', selected.origine ?? '—'],
                ['Certification', selected.certification ?? '—'],
                ['Avancement', `${selected.avancement_pct}%`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#94A3B8', width: 120, flexShrink: 0 }}>{l}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* QR Code */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 20, alignSelf: 'flex-start' }}>
                {qrActif ? 'QR Code actif' : 'Générer le QR Code ETHYS'}
              </div>

              {/* Visuel QR */}
              <div style={{
                padding: 16, borderRadius: 14, marginBottom: 16,
                border: `2px solid ${qrActif ? '#D1FAE5' : '#EEF0F3'}`,
                background: qrActif ? '#fff' : '#F8FAFC',
                position: 'relative'
              }}>
                {generating ? (
                  <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 32 }}>⏳</div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>Génération…</div>
                  </div>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code ETHYS" style={{ width: 180, height: 180, display: 'block' }} />
                ) : (
                  <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
                    <div style={{ fontSize: 80, color: '#0A3D26' }}>▣</div>
                  </div>
                )}
                {qrActif && !generating && (
                  <div style={{
                    position: 'absolute', top: -8, right: -8,
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#10B981', border: '2px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 700
                  }}>✓</div>
                )}
              </div>

              {qrActif && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0A3D26' }}>{qrActif.reference}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                    {qrActif.nb_scans} scan(s) · Généré le {new Date(qrActif.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              )}

              {/* Données encodées */}
              <div style={{ width: '100%', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0A3D26', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Données encodées
                </div>
                {[
                  ['🌍', 'Origine', selected.origine ?? '—'],
                  ['🏭', 'Filature', selected.commande?.filature?.nom ?? '—'],
                  ['📊', 'Type coton', selected.type_coton === 'recycle' ? '♻ Recyclé' : '🌿 Vierge'],
                  ['✓', 'Certification', selected.certification ?? '—'],
                ].map(([icon, label, val]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: '#F8FAFC', marginBottom: 6 }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>{label}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#1A202C' }}>{val}</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#10B981' }}>✓</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {!qrActif ? (
                <button onClick={genererQR} disabled={generating} style={{
                  width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                  background: generating ? '#E2E8F0' : '#0A3D26',
                  color: generating ? '#94A3B8' : '#fff',
                  fontSize: 13, fontWeight: 700, cursor: generating ? 'default' : 'pointer'
                }}>
                  {generating ? '⏳ Génération en cours…' : '▣ Générer le QR Code ETHYS'}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  <button onClick={() => setPreviewPublic(true)} style={{
                    width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                    background: '#0A3D26', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}>👁 Voir page publique consommateur</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={telechargerQR} style={{
                      flex: 1, padding: '8px', borderRadius: 8,
                      border: '1.5px solid #EEF0F3', background: '#F8FAFC',
                      fontSize: 12, cursor: 'pointer', color: '#475569'
                    }}>↓ Télécharger</button>
                    <button onClick={copierURL} style={{
                      flex: 1, padding: '8px', borderRadius: 8,
                      border: '1.5px solid #EEF0F3', background: '#F8FAFC',
                      fontSize: 12, cursor: 'pointer', color: '#475569'
                    }}>🔗 Copier URL</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>▣</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Sélectionnez un lot</div>
          </div>
        </div>
      )}

      {/* Page publique modale */}
      {previewPublic && qrActif && selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 20
        }} onClick={() => setPreviewPublic(false)}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420,
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg,#0A3D26,#0D5C3A)',
              borderRadius: '20px 20px 0 0', padding: '24px', color: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#6EE7B7', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
                    ETHYS · TRAÇABILITÉ TOTALE
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>Votre fil ETHYS</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>Lot #{selected.reference}</div>
                </div>
                <button onClick={() => setPreviewPublic(false)} style={{
                  border: 'none', background: 'rgba(255,255,255,0.15)',
                  color: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer'
                }}>✕</button>
              </div>

              {/* QR dans la page publique */}
              {qrDataUrl && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{ background: '#fff', padding: 10, borderRadius: 10 }}>
                    <img src={qrDataUrl} alt="QR" style={{ width: 100, height: 100, display: 'block' }} />
                  </div>
                </div>
              )}

              {/* Composition */}
<div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
  <div style={{ fontSize: 10, color: '#6EE7B7', fontWeight: 600, marginBottom: 10, letterSpacing: 1 }}>MATIÈRES PREMIÈRES</div>
  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
    <div style={{ flex: 51, background: '#10B981', borderRadius: 6, padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>51%</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>♻ Coton recyclé</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>61.2T</div>
    </div>
    <div style={{ flex: 49, background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>49%</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>🌿 Coton vierge</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>58.8T</div>
    </div>
  </div>
  <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
    <div style={{ height: '100%', width: '51%', background: '#6EE7B7', borderRadius: 3 }} />
  </div>
</div>

{/* Certification fil ETHYS */}
<div style={{ background: 'rgba(110,231,183,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, border: '1px solid rgba(110,231,183,0.3)', textAlign: 'center' }}>
  <div style={{ fontSize: 13, fontWeight: 900, color: '#6EE7B7', marginBottom: 4 }}>✓ Fil certifié ETHYS</div>
  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
    Ce fil est le résultat de la transformation de coton recyclé et vierge par SpinTex Izmir, certifié par la plateforme TEXTILE LOOP.
  </div>
</div>

            {/* Corps */}
            <div style={{ padding: '20px' }}>
              {[
                ['🌍', 'Origine matière', selected.origine ?? 'Non renseigné'],
                ['🏭', 'Filature', selected.commande?.filature?.nom ?? '—'],
                ['✓', 'Certification', selected.certification ?? 'Non certifié'],
                ['📦', 'Fournisseur', selected.commande?.fournisseur?.nom ?? '—'],
              ].map(([icon, label, val]) => (
                <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{val}</div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: '#F8FAFC', fontSize: 10, color: '#94A3B8', textAlign: 'center' }}>
                Données vérifiées et certifiées par TEXTILE LOOP<br />
                Plateforme ETHYS · {qrActif.reference}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}