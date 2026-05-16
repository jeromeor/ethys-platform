'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Commande {
  id: string
  reference: string
  marque_id: string
  filature_id: string
  marque: { nom: string } | null
  filature: { nom: string } | null
  fournisseur?: { nom: string } | null
  volume_recycle_tonnes?: number
  volume_vierge_tonnes?: number
  pct_recycle?: number
}

interface Lot {
  id: string
  reference: string
  volume_tonnes: number
  avancement_pct: number
  origine: string | null
  statut?: string
  commande: Commande | Commande[] | null
}

interface Certification {
  id: string
  reference: string | null
  lot_id: string | null
  statut: string | null
  type_produit: string | null
  volume_recycle_kg: number | null
  volume_vierge_kg: number | null
  pct_recycle: number | null
  date_emission: string | null
  date_expiration: string | null
  created_at: string
  lot?: Lot | null
  createur?: { prenom: string; nom: string } | null
}

interface Props {
  certifications: Certification[]
  lotsEligibles: Lot[]
  userRole: string
  entrepriseId: string
  userId: string
}

const STATUT_COLORS: Record<string, [string, string]> = {
  en_attente:    ['#fdf8ec', '#b8860b'],
  en_validation: ['#DBEAFE', '#1E40AF'],
  certifiee:     ['#f0f4ec', '#2d5016'],
  refusee:       ['#FEE2E2', '#991B1B'],
}

const STATUT_LABELS: Record<string, string> = {
  en_attente:    'En attente',
  en_validation: 'En validation',
  certifiee:     'Certifiee',
  refusee:       'Refusee',
}

function getLot(lot: Lot | null | undefined): Lot | null {
  return lot ?? null
}

function getCommande(lot: Lot | null): Commande | null {
  if (!lot) return null
  if (Array.isArray(lot.commande)) return lot.commande[0] ?? null
  return lot.commande
}

export default function CertificationClient({ certifications: initial, lotsEligibles, userRole, entrepriseId, userId }: Props) {
  const supabase = createClient()
  const [certifications, setCertifications] = useState<Certification[]>(initial)
  const [selected, setSelected] = useState<Certification | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedLotId, setSelectedLotId] = useState('')
  const [declarationHonneur, setDeclarationHonneur] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [showRefus, setShowRefus] = useState(false)

  const isAdmin = userRole === 'admin'

  const demanderCertification = async () => {
    if (!selectedLotId) {
      setMessage('Veuillez selectionner un lot.')
      return
    }
    if (!declarationHonneur) {
      setMessage('Veuillez cocher la declaration sur honneur.')
      return
    }
    setSaving(true)
    setMessage('')

    const lot = lotsEligibles.find(l => l.id === selectedLotId)
    const commande = getCommande(lot ?? null)

    const { data, error } = await supabase
      .from('certifications_ethys')
      .insert({
        lot_id: selectedLotId,
        marque_id: commande?.marque_id ?? null,
        filature_id: commande?.filature_id ?? null,
        type_produit: 'fil',
        volume_recycle_kg: lot ? Math.round((lot.volume_tonnes ?? 0) * 1000 * 0.51) : 0,
        volume_vierge_kg: lot ? Math.round((lot.volume_tonnes ?? 0) * 1000 * 0.49) : 0,
        pct_recycle: 51,
        statut: 'en_validation',
        created_by: userId,
      })
      .select('*, lot:lots(id, reference, volume_tonnes, avancement_pct, origine, commande:commandes(id, reference, marque_id, filature_id, marque:entreprises!commandes_marque_id_fkey(nom), filature:entreprises!commandes_filature_id_fkey(nom)))')
      .single()

    if (error) {
      setMessage('Erreur : ' + error.message)
      setSaving(false)
      return
    }

    if (data) {
      setCertifications(prev => [data as Certification, ...prev])
      setShowForm(false)
      setSelectedLotId('')
      setDeclarationHonneur(false)
      setMessage('Demande de certification soumise. Elle sera examinee par TEXTILE LOOP.')
    }
    setSaving(false)
  }

  const certifier = async (cert: Certification) => {
    setSaving(true)
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const seq = String(certifications.filter(c => c.statut === 'certifiee').length + 1).padStart(4, '0')
    const reference = 'ETHYS-' + year + '-' + month + '-' + seq

    const expiration = new Date(now)
    expiration.setFullYear(expiration.getFullYear() + 2)

    await supabase.from('certifications_ethys').update({
      statut: 'certifiee',
      reference,
      date_emission: now.toISOString().split('T')[0],
      date_expiration: expiration.toISOString().split('T')[0],
    }).eq('id', cert.id)

    setCertifications(prev => prev.map(c => c.id === cert.id ? { ...c, statut: 'certifiee', reference } : c))
    setSelected(null)
    setMessage('Certification accordee. Reference : ' + reference)
    setSaving(false)
  }

  const refuser = async (cert: Certification) => {
    if (!commentaire.trim()) {
      setMessage('Veuillez indiquer un motif de refus.')
      return
    }
    setSaving(true)
    await supabase.from('certifications_ethys').update({ statut: 'refusee' }).eq('id', cert.id)
    setCertifications(prev => prev.map(c => c.id === cert.id ? { ...c, statut: 'refusee' } : c))
    setSelected(null)
    setShowRefus(false)
    setCommentaire('')
    setSaving(false)
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Liste gauche */}
      <div style={{ width: 320, minWidth: 320, background: '#fff', borderRight: '1px solid #e8e3d8', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f5f3ef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Certifications ETHYS</div>
            <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>
              <span style={{ fontWeight: 700, color: '#2d5016' }}>{certifications.filter(c => c.statut === 'certifiee').length}</span> certifiees
              {' · '}
              <span style={{ fontWeight: 700, color: '#b45309' }}>{certifications.filter(c => c.statut === 'en_validation').length}</span> en attente
            </div>
          </div>
          {lotsEligibles.length > 0 && (
            <button onClick={() => { setShowForm(true); setSelected(null) }} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              + Demander
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {certifications.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#8b7355', fontSize: 12 }}>
              Aucune certification.
            </div>
          ) : certifications.map(cert => {
            const lot = getLot(cert.lot)
            const commande = getCommande(lot)
            const [bg, tc] = STATUT_COLORS[cert.statut ?? ''] ?? ['#f5f3ef', '#4a5568']
            return (
              <div key={cert.id} onClick={() => { setSelected(cert); setShowForm(false) }} style={{ padding: '12px 16px', cursor: 'pointer', background: selected?.id === cert.id ? '#f0f4ec' : 'transparent', borderLeft: '3px solid ' + (selected?.id === cert.id ? '#1a1a1a' : 'transparent'), borderBottom: '1px solid #f5f3ef' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{lot?.reference ?? '-'}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: bg, color: tc }}>{STATUT_LABELS[cert.statut ?? ''] ?? cert.statut}</span>
                </div>
                <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 2 }}>
                  {commande?.marque?.nom ?? '-'} · {commande?.filature?.nom ?? '-'}
                </div>
                {cert.reference && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#2d5016' }}>{cert.reference}</div>
                )}
                <div style={{ fontSize: 10, color: '#a0aec0', marginTop: 2 }}>{formatDate(cert.created_at)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Zone principale */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>

        {message && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: message.includes('Erreur') ? '#fdf0f0' : '#f0f4ec', border: '1px solid ' + (message.includes('Erreur') ? '#c8a0a0' : '#c8d8b8'), fontSize: 13, color: message.includes('Erreur') ? '#8b3a3a' : '#2d5016', marginBottom: 20 }}>
            {message}
          </div>
        )}

        {/* Formulaire demande certification */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px', marginBottom: 24, maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Demande de certification ETHYS</div>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>x</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Lot a certifier *</label>
              <select value={selectedLotId} onChange={e => setSelectedLotId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                <option value="">Selectionner un lot...</option>
                {lotsEligibles.map(lot => {
                  const commande = getCommande(lot)
                  return (
                    <option key={lot.id} value={lot.id}>
                      {lot.reference} — {Math.round((lot.volume_tonnes ?? 0) * 1000)} kg — {commande?.marque?.nom ?? '-'}
                    </option>
                  )
                })}
              </select>
            </div>

            {selectedLotId && (() => {
              const lot = lotsEligibles.find(l => l.id === selectedLotId)
              const commande = getCommande(lot ?? null)
              return lot ? (
                <div style={{ padding: '14px 16px', borderRadius: 8, background: '#f0f4ec', border: '1px solid #c8d8b8', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2d5016', marginBottom: 8 }}>Recap du lot</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: '#4a5568' }}>
                    <div>Lot : <strong>{lot.reference}</strong></div>
                    <div>Volume : <strong>{Math.round((lot.volume_tonnes ?? 0) * 1000).toLocaleString('fr-FR')} kg</strong></div>
                    <div>Marque : <strong>{commande?.marque?.nom ?? '-'}</strong></div>
                    <div>Filature : <strong>{commande?.filature?.nom ?? '-'}</strong></div>
                    <div>Composition : <strong>51% recycle / 49% vierge</strong></div>
                    {lot.origine && <div>Origine : <strong>{lot.origine}</strong></div>}
                  </div>
                </div>
              ) : null
            })()}

            <div style={{ padding: '14px 16px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Declaration sur honneur</div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={declarationHonneur} onChange={e => setDeclarationHonneur(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5 }}>
                  Je certifie sur honneur que les informations sont exactes et que ce lot de fil respecte les criteres ETHYS (minimum 51% de coton recycle, tracabilite verifiable).
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#4a5568', fontSize: 13, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={demanderCertification} disabled={saving || !selectedLotId || !declarationHonneur}
                style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: saving || !selectedLotId || !declarationHonneur ? '#d4c5b0' : '#1a1a1a', color: saving || !selectedLotId || !declarationHonneur ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: saving || !selectedLotId || !declarationHonneur ? 'default' : 'pointer' }}>
                {saving ? 'Envoi...' : 'Soumettre la demande'}
              </button>
            </div>
          </div>
        )}

        {/* Detail certification selectionnee */}
        {selected && !showForm && (
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>
                  {getLot(selected.lot)?.reference ?? 'Lot inconnu'}
                </div>
                <div style={{ fontSize: 12, color: '#8b7355' }}>Soumise le {formatDate(selected.created_at)}</div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: (STATUT_COLORS[selected.statut ?? ''] ?? ['#f5f3ef', '#4a5568'])[0], color: (STATUT_COLORS[selected.statut ?? ''] ?? ['#f5f3ef', '#4a5568'])[1] }}>
                {STATUT_LABELS[selected.statut ?? ''] ?? selected.statut}
              </span>
            </div>

            {(() => {
              const lot = getLot(selected.lot)
              const commande = getCommande(lot)
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    ['Lot', lot?.reference ?? '-'],
                    ['Volume', lot ? Math.round((lot.volume_tonnes ?? 0) * 1000).toLocaleString('fr-FR') + ' kg' : '-'],
                    ['Marque', commande?.marque?.nom ?? '-'],
                    ['Filature', commande?.filature?.nom ?? '-'],
                    ['Composition', '51% recycle / 49% vierge'],
                    ['Origine', lot?.origine ?? '-'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ padding: '10px 14px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                      <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{val}</div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {selected.statut === 'certifiee' && (
              <div style={{ padding: '16px', borderRadius: 8, background: '#f0f4ec', border: '1px solid #c8d8b8', marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#2d5016', marginBottom: 8 }}>Certification ETHYS obtenue</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{selected.reference}</div>
                <div style={{ fontSize: 12, color: '#4a5568' }}>
                  Emise le {formatDate(selected.date_emission)} · Valide jusqu au {formatDate(selected.date_expiration)}
                </div>
              </div>
            )}

            {isAdmin && selected.statut === 'en_validation' && (
              <div style={{ borderTop: '1px solid #e8e3d8', paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Decision TEXTILE LOOP</div>
                {!showRefus ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowRefus(true)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #c8a0a0', background: '#fdf0f0', color: '#8b3a3a', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      Refuser
                    </button>
                    <button onClick={() => certifier(selected)} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: saving ? '#d4c5b0' : '#1a1a1a', color: saving ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                      {saving ? 'Certification...' : 'Certifier ETHYS'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
                      placeholder="Motif du refus..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, boxSizing: 'border-box', outline: 'none', height: 80, marginBottom: 10, resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setShowRefus(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1.5px solid #e8e3d8', background: '#f5f3ef', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
                      <button onClick={() => refuser(selected)} disabled={saving} style={{ flex: 2, padding: '9px', borderRadius: 8, border: 'none', background: '#8b3a3a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Confirmer le refus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!selected && !showForm && (
          <div style={{ textAlign: 'center', padding: '80px 40px', color: '#8b7355' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Certification ETHYS</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              {isAdmin
                ? 'Selectionnez une demande pour la valider ou la refuser.'
                : lotsEligibles.length > 0
                  ? 'Vous avez des lots eligibles. Cliquez sur Demander pour soumettre une certification.'
                  : 'Les lots de production termines apparaitront ici pour demande de certification.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
