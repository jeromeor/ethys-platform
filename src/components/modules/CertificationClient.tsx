'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'


const ZONES: Record<string, number[]> = {
  'France': [1], 'Espagne': [1], 'Italie': [1], 'Portugal': [1],
  'Allemagne': [1], 'Belgique': [1], 'Pays-Bas': [1], 'Royaume-Uni': [1],
  'Suisse': [1], 'Autriche': [1], 'Pologne': [1], 'Roumanie': [1],
  'Turquie': [1, 5],
  'Maroc': [1, 4], 'Tunisie': [1, 4], 'Algerie': [1, 4], 'Egypte': [1, 4], 'Libye': [1, 4],
  'Senegal': [4], 'Mali': [4], 'Burkina Faso': [4], 'Cote Ivoire': [4],
  'Nigeria': [4], 'Ethiopie': [4], 'Kenya': [4], 'Tanzanie': [4],
  'Afrique du Sud': [4], 'Zimbabwe': [4], 'Mozambique': [4],
  'Etats-Unis': [2], 'Canada': [2], 'Mexique': [2],
  'Bresil': [3], 'Argentine': [3], 'Colombie': [3], 'Perou': [3],
  'Inde': [5], 'Bangladesh': [5], 'Chine': [5], 'Vietnam': [5],
  'Pakistan': [5], 'Indonesie': [5], 'Cambodge': [5], 'Myanmar': [5],
  'Sri Lanka': [5], 'Nepal': [5],
  'Australie': [6], 'Nouvelle-Zelande': [6],
}

const ZONE_LABELS: Record<number, string> = {
  1: 'Europe', 2: 'Amerique du Nord', 3: 'Amerique du Sud',
  4: 'Afrique', 5: 'Asie', 6: 'Oceanie',
}

const PAYS_CODES: Record<string, string> = {
  'France': 'FR', 'Espagne': 'ES', 'Italie': 'IT', 'Portugal': 'PT',
  'Allemagne': 'DE', 'Belgique': 'BE', 'Pays-Bas': 'NL', 'Royaume-Uni': 'GB',
  'Suisse': 'CH', 'Autriche': 'AT', 'Pologne': 'PL', 'Roumanie': 'RO',
  'Turquie': 'TR', 'Maroc': 'MA', 'Tunisie': 'TN', 'Algerie': 'DZ',
  'Egypte': 'EG', 'Libye': 'LY', 'Senegal': 'SN', 'Mali': 'ML',
  'Nigeria': 'NG', 'Ethiopie': 'ET', 'Kenya': 'KE', 'Afrique du Sud': 'ZA',
  'Etats-Unis': 'US', 'Canada': 'CA', 'Mexique': 'MX',
  'Bresil': 'BR', 'Argentine': 'AR', 'Colombie': 'CO', 'Perou': 'PE',
  'Inde': 'IN', 'Bangladesh': 'BD', 'Chine': 'CN', 'Vietnam': 'VN',
  'Pakistan': 'PK', 'Indonesie': 'ID', 'Cambodge': 'KH',
  'Australie': 'AU', 'Nouvelle-Zelande': 'NZ',
}

const zonesCompatibles = (pays1: string, pays2: string): boolean => {
  const z1 = ZONES[pays1] ?? []
  const z2 = ZONES[pays2] ?? []
  return z1.some(z => z2.includes(z))
}

const getZoneLabel = (pays: string): string => {
  const zones = ZONES[pays]
  if (!zones) return 'Zone inconnue'
  return zones.map(z => ZONE_LABELS[z]).join(' / ')
}

interface Declaration {
  id: string
  type_produit: string
  volume_recycle_kg: number
  volume_vierge_kg: number
  pct_recycle: number
  eligible_ethys: boolean
  provenance_pays: string | null
  filature_nom: string | null
  tisseur_nom: string | null
  description: string | null
  declaration_honneur: boolean
  statut: string
 commentaire_admin: string | null
  filature_pays: string | null
  created_at: string
  entreprise_pays?: string | null
  certification?: { numero: string; date_emission: string; date_validite: string } | null
}

interface Props {
  declarations: Declaration[]
  userRole: string
  entrepriseId: string
  userId: string
}

const STATUT_COLORS: Record<string, [string, string]> = {
  brouillon:      ['#F1F5F9', '#475569'],
  soumise:        ['#DBEAFE', '#1E40AF'],
  en_validation:  ['#FEF3C7', '#92400E'],
  certifiee:      ['#D1FAE5', '#065F46'],
  refusee:        ['#FEE2E2', '#991B1B'],
}

const STATUT_LABELS: Record<string, string> = {
  brouillon:      'Brouillon',
  soumise:        'Soumise',
  en_validation:  'En validation',
  certifiee:      'Certifiée',
  refusee:        'Refusée',
}

const TYPE_LABELS: Record<string, string> = {
  fil:          'Fil ETHYS',
  tissu:        'Tissu ETHYS',
  produit_fini: 'Produit fini ETHYS',
}

export default function CertificationClient({ declarations: initial, userRole, entrepriseId, userId }: Props) {
  const supabase = createClient()
  const [declarations, setDeclarations] = useState<Declaration[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Declaration | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    type_produit: 'fil',
    volume_recycle_kg: '',
    volume_vierge_kg: '',
    provenance_pays: '',
    filature_nom: '',
    filature_pays: '',
    tisseur_nom: '',
    description: '',
    declaration_honneur: false,
  })

  const isAdmin = userRole === 'admin'
  const pctRecycle = form.volume_recycle_kg && form.volume_vierge_kg
    ? Math.round(parseFloat(form.volume_recycle_kg) / (parseFloat(form.volume_recycle_kg) + parseFloat(form.volume_vierge_kg)) * 100)
    : 0
  const eligible = pctRecycle >= 51

  const soumettre = async (statut: 'brouillon' | 'soumise') => {
    if (!form.declaration_honneur && statut === 'soumise') {
      setMessage('Vous devez cocher la déclaration sur l\'honneur pour soumettre.')
      return
    }
    if (form.provenance_pays && form.filature_pays && !zonesCompatibles(form.provenance_pays, form.filature_pays)) {
      const zoneCoton = getZoneLabel(form.provenance_pays)
      const zoneFilature = getZoneLabel(form.filature_pays)
      setMessage(`Incompatibilité géographique : le coton recyclé (${form.provenance_pays} — ${zoneCoton}) ne peut pas être transformé par une filature en ${form.filature_pays} (${zoneFilature}). Le coton recyclé doit être transformé dans la même zone géographique.`)
      return
    }
    if (!eligible && statut === 'soumise') {
      setMessage('Le fil doit contenir au moins 51% de coton recyclé pour être éligible à la certification ETHYS.')
      return
    }
    setSaving(true)
    setMessage('')
    const { data, error } = await supabase
      .from('declarations_ethys')
      .insert({
        initiateur_id: userId,
        entreprise_id: entrepriseId,
        type_produit: form.type_produit,
        volume_recycle_kg: parseFloat(form.volume_recycle_kg),
        volume_vierge_kg: parseFloat(form.volume_vierge_kg),
        provenance_pays: form.provenance_pays || null,
        filature_nom: form.filature_nom || null,
        filature_pays: form.filature_pays || null,
        tisseur_nom: form.tisseur_nom || null,
        description: form.description || null,
        declaration_honneur: form.declaration_honneur,
        statut,
      })
      .select()
      .single()
    if (!error && data) {
      setDeclarations(prev => [data, ...prev])
      setShowForm(false)
      setMessage(statut === 'soumise' ? 'Déclaration soumise avec succès. TEXTILE LOOP va examiner votre demande.' : 'Brouillon sauvegardé.')
      setForm({ type_produit: 'fil', volume_recycle_kg: '', volume_vierge_kg: '', provenance_pays: '', filature_nom: '', filature_pays: '', tisseur_nom: '', description: '', declaration_honneur: false })
    } else {
      setMessage('Erreur lors de la soumission.')
    }
    setSaving(false)
  }

  const certifier = async (declaration: Declaration) => {
    setSaving(true)
    await supabase.from('declarations_ethys').update({ statut: 'certifiee' }).eq('id', declaration.id)
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const zones = ZONES[declaration.filature_pays ?? ''] ?? [1]
    const zoneCode = String(zones[0]).padStart(3, '0')
    const paysCode = PAYS_CODES[(declaration as any).entreprise?.pays ?? ''] ?? 'XX'
    const seq = String(declarations.filter(d => d.statut === 'certifiee').length + 1).padStart(4, '0')
    const numero = `ETHYS-${year}-${month}-${zoneCode}-${paysCode}-${seq}`
    await supabase.from('certifications_ethys').insert({
      declaration_id: declaration.id,
      numero,
    })
    setDeclarations(prev => prev.map(d => d.id === declaration.id ? { ...d, statut: 'certifiee' } : d))
    setSelected(null)
    setMessage(`Déclaration certifiée. Numéro : ${numero}`)
    setSaving(false)
  }

  const refuser = async (declaration: Declaration, commentaire: string) => {
    setSaving(true)
    await supabase.from('declarations_ethys').update({ statut: 'refusee', commentaire_admin: commentaire }).eq('id', declaration.id)
    setDeclarations(prev => prev.map(d => d.id === declaration.id ? { ...d, statut: 'refusee', commentaire_admin: commentaire } : d))
    setSelected(null)
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1.5px solid #E2E8F0', fontSize: 13,
    boxSizing: 'border-box' as const, outline: 'none', color: '#1A202C'
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Liste gauche */}
      <div style={{ width: 320, minWidth: 320, background: '#fff', borderRight: '1px solid #EEF0F3', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>Déclarations ETHYS</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
              <span style={{ fontWeight: 700, color: '#0A3D26' }}>{declarations.filter(d => d.statut === 'certifiee').length}</span> certifiées
              {' · '}
              <span style={{ fontWeight: 700, color: '#D97706' }}>{declarations.filter(d => d.statut === 'en_validation' || d.statut === 'soumise').length}</span> en attente
            </div>
          </div>
          {!isAdmin && (
            <button onClick={() => setShowForm(true)} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#0A3D26', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              + Nouvelle
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {declarations.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
              Aucune déclaration.<br />Cliquez sur "+ Nouvelle" pour commencer.
            </div>
          ) : declarations.map(d => {
            const [bg, tc] = STATUT_COLORS[d.statut] ?? ['#F1F5F9', '#475569']
            return (
              <div key={d.id} onClick={() => setSelected(d)} style={{ padding: '12px 16px', cursor: 'pointer', background: selected?.id === d.id ? '#F0FDF4' : 'transparent', borderLeft: `3px solid ${selected?.id === d.id ? '#0A3D26' : 'transparent'}`, borderBottom: '1px solid #F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0A3D26' }}>{TYPE_LABELS[d.type_produit]}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: bg, color: tc }}>{STATUT_LABELS[d.statut]}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748B', marginBottom: 4 }}>
                  <span>♻ {d.volume_recycle_kg.toLocaleString('fr-FR')} kg</span>
                  <span>🌿 {d.volume_vierge_kg.toLocaleString('fr-FR')} kg</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${d.pct_recycle}%`, background: d.eligible_ethys ? '#10B981' : '#F59E0B', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: d.eligible_ethys ? '#065F46' : '#92400E' }}>{d.pct_recycle}% recyclé</span>
                </div>
                <div style={{ fontSize: 10, color: '#CBD5E1', marginTop: 4 }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Zone principale */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
        {message && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: message.includes('Erreur') ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${message.includes('Erreur') ? '#FCA5A5' : '#A7F3D0'}`, fontSize: 13, color: message.includes('Erreur') ? '#DC2626' : '#065F46', marginBottom: 20 }}>
            {message}
          </div>
        )}

        {/* Formulaire nouvelle déclaration */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F3', padding: '24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0A3D26' }}>Nouvelle déclaration ETHYS</div>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#94A3B8' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Type de produit *</label>
                <select value={form.type_produit} onChange={e => setForm(f => ({ ...f, type_produit: e.target.value }))} style={inputStyle}>
                  {userRole === 'filature' && <option value="fil">Fil ETHYS</option>}
                  {userRole === 'tisseur' && <option value="fil">Fil ETHYS</option>}
                  {userRole === 'tisseur' && <option value="tissu">Tissu ETHYS</option>}
                  {userRole === 'marque' && <option value="tissu">Tissu ETHYS</option>}
                  {userRole === 'marque' && <option value="produit_fini">Produit fini ETHYS</option>}
                  {userRole === 'admin' && <><option value="fil">Fil ETHYS</option><option value="tissu">Tissu ETHYS</option><option value="produit_fini">Produit fini ETHYS</option></>}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Pays de provenance</label>
                <input value={form.provenance_pays} onChange={e => setForm(f => ({ ...f, provenance_pays: e.target.value }))} style={inputStyle} placeholder="Ex: Maroc, Turquie..." />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Volume coton recyclé (kg) *</label>
                <input type="number" value={form.volume_recycle_kg} onChange={e => setForm(f => ({ ...f, volume_recycle_kg: e.target.value }))} style={inputStyle} placeholder="0" min="0" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Volume coton vierge (kg) *</label>
                <input type="number" value={form.volume_vierge_kg} onChange={e => setForm(f => ({ ...f, volume_vierge_kg: e.target.value }))} style={inputStyle} placeholder="0" min="0" />
              </div>
            </div>

        {/* Vérification compatibilité zones */}
            {form.provenance_pays && form.filature_pays && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, background: zonesCompatibles(form.provenance_pays, form.filature_pays) ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${zonesCompatibles(form.provenance_pays, form.filature_pays) ? '#A7F3D0' : '#FCA5A5'}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: zonesCompatibles(form.provenance_pays, form.filature_pays) ? '#065F46' : '#DC2626' }}>
                  {zonesCompatibles(form.provenance_pays, form.filature_pays)
                    ? `✓ Compatible — ${form.provenance_pays} et ${form.filature_pays} sont dans la même zone`
                    : `✗ Incompatible — ${form.provenance_pays} (${getZoneLabel(form.provenance_pays)}) et ${form.filature_pays} (${getZoneLabel(form.filature_pays)}) sont dans des zones différentes`
                  }
                </div>
              </div>
            )}    
	{/* Indicateur temps réel */}
            {(form.volume_recycle_kg || form.volume_vierge_kg) && (
              <div style={{ padding: '14px 16px', borderRadius: 10, background: eligible ? '#F0FDF4' : '#FEF3C7', border: `1px solid ${eligible ? '#A7F3D0' : '#FCD34D'}`, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${pctRecycle}%`, background: eligible ? '#10B981' : '#F59E0B', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#64748B' }}>♻ Recyclé : {pctRecycle}%</span>
                      <span style={{ color: '#64748B' }}>🌿 Vierge : {100 - pctRecycle}%</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: eligible ? '#065F46' : '#92400E' }}>{pctRecycle}%</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: eligible ? '#065F46' : '#92400E' }}>
                      {eligible ? '✓ Éligible ETHYS' : '✗ Min. 51% requis'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Filature *</label>
                <input value={form.filature_nom} onChange={e => setForm(f => ({ ...f, filature_nom: e.target.value }))} style={inputStyle} placeholder="Nom de la filature" />
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Pays de la filature *</label>
                  <select value={form.filature_pays} onChange={e => setForm(f => ({ ...f, filature_pays: e.target.value }))} style={inputStyle}>
                    <option value="">Sélectionner...</option>
                    {Object.keys(PAYS_CODES).sort().map(p => (
                      <option key={p} value={p}>{p} — {getZoneLabel(p)}</option>
                    ))}
                  </select>
                </div>
                <input value={form.filature_nom} onChange={e => setForm(f => ({ ...f, filature_nom: e.target.value }))} style={inputStyle} placeholder="Nom de la filature" />
              </div>
              {(form.type_produit === 'tissu' || form.type_produit === 'produit_fini') && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Tisseur</label>
                  <input value={form.tisseur_nom} onChange={e => setForm(f => ({ ...f, tisseur_nom: e.target.value }))} style={inputStyle} placeholder="Nom du tisseur" />
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Description / Notes</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="Informations complémentaires sur le produit..." />
            </div>

            {/* Documents — beta = déclaration honneur */}
            <div style={{ padding: '14px 16px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #EEF0F3', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0A3D26', marginBottom: 8 }}>Documents justificatifs</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 10 }}>
                Phase bêta — déclaration sur l'honneur. Les documents PDF (bon de commande, bon de livraison) seront requis lors du lancement officiel.
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.declaration_honneur} onChange={e => setForm(f => ({ ...f, declaration_honneur: e.target.checked }))} style={{ accentColor: '#0A3D26', marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                  Je certifie sur l'honneur que les informations renseignées sont exactes et que le produit respecte les critères de la certification ETHYS (minimum 51% de coton recyclé, traçabilité vérifiable).
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => soumettre('brouillon')} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #EEF0F3', background: '#F8FAFC', color: '#475569', fontSize: 13, cursor: saving ? 'default' : 'pointer' }}>
                Sauvegarder en brouillon
              </button>
              <button onClick={() => soumettre('soumise')} disabled={saving || !form.declaration_honneur || !eligible} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: saving || !form.declaration_honneur || !eligible ? '#E2E8F0' : '#0A3D26', color: saving || !form.declaration_honneur || !eligible ? '#94A3B8' : '#fff', fontSize: 13, fontWeight: 700, cursor: saving || !form.declaration_honneur || !eligible ? 'default' : 'pointer' }}>
                {saving ? 'Envoi...' : 'Soumettre pour certification'}
              </button>
            </div>
          </div>
        )}

        {/* Détail déclaration sélectionnée */}
        {selected && !showForm && (
          <DetailDeclaration
            declaration={selected}
            isAdmin={isAdmin}
            onCertifier={certifier}
            onRefuser={refuser}
            saving={saving}
          />
        )}

        {/* État vide */}
        {!selected && !showForm && (
          <div style={{ textAlign: 'center', padding: '80px 40px', color: '#94A3B8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0A3D26', marginBottom: 8 }}>Certification ETHYS</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              {isAdmin
                ? 'Sélectionnez une déclaration pour la valider ou la refuser.'
                : 'Déclarez votre utilisation de fil ETHYS pour obtenir la certification et générer votre QR code consommateur.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailDeclaration({ declaration: d, isAdmin, onCertifier, onRefuser, saving }: {
  declaration: Declaration
  isAdmin: boolean
  onCertifier: (d: Declaration) => void
  onRefuser: (d: Declaration, c: string) => void
  saving: boolean
}) {
  const [commentaire, setCommentaire] = useState('')
  const [showRefus, setShowRefus] = useState(false)
  const [bg, tc] = STATUT_COLORS[d.statut] ?? ['#F1F5F9', '#475569']

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F3', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0A3D26', marginBottom: 4 }}>{TYPE_LABELS[d.type_produit]}</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>Déclarée le {new Date(d.created_at).toLocaleDateString('fr-FR')}</div>
        </div>
        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color: tc }}>{STATUT_LABELS[d.statut]}</span>
      </div>

      {/* Composition */}
      <div style={{ background: d.eligible_ethys ? '#F0FDF4' : '#FEF3C7', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0A3D26', marginBottom: 10, textTransform: 'uppercase' }}>Composition</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: d.pct_recycle, background: '#10B981', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{d.pct_recycle}%</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>♻ Recyclé</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{d.volume_recycle_kg.toLocaleString('fr-FR')} kg</div>
          </div>
          <div style={{ flex: 100 - d.pct_recycle, background: 'rgba(0,0,0,0.06)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#475569' }}>{100 - d.pct_recycle}%</div>
            <div style={{ fontSize: 10, color: '#64748B' }}>🌿 Vierge</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{d.volume_vierge_kg.toLocaleString('fr-FR')} kg</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: d.eligible_ethys ? '#065F46' : '#92400E' }}>
          {d.eligible_ethys ? '✓ Éligible à la certification ETHYS' : '✗ Non éligible — minimum 51% requis'}
        </div>
      </div>

      {/* Informations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          ['Filature', d.filature_nom ?? '-'],
          ['Tisseur', d.tisseur_nom ?? '-'],
          ['Provenance', d.provenance_pays ?? '-'],
          ['Déclaration honneur', d.declaration_honneur ? '✓ Signée' : '✗ Non signée'],
        ].map(([label, val]) => (
          <div key={label} style={{ padding: '10px 14px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #EEF0F3' }}>
            <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{val}</div>
          </div>
        ))}
      </div>

      {d.description && (
        <div style={{ padding: '12px 14px', borderRadius: 8, background: '#F8FAFC', marginBottom: 16, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
          {d.description}
        </div>
      )}

      {d.commentaire_admin && (
        <div style={{ padding: '12px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>Commentaire TEXTILE LOOP</div>
          <div style={{ fontSize: 12, color: '#991B1B' }}>{d.commentaire_admin}</div>
        </div>
      )}

      {/* Actions admin */}
      {isAdmin && d.statut === 'soumise' && (
        <div style={{ borderTop: '1px solid #EEF0F3', paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0A3D26', marginBottom: 12 }}>Décision TEXTILE LOOP</div>
          {!showRefus ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowRefus(true)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Refuser
              </button>
              <button onClick={() => onCertifier(d)} disabled={saving || !d.eligible_ethys} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: saving || !d.eligible_ethys ? '#E2E8F0' : '#0A3D26', color: saving || !d.eligible_ethys ? '#94A3B8' : '#fff', fontSize: 13, fontWeight: 700, cursor: saving || !d.eligible_ethys ? 'default' : 'pointer' }}>
                {saving ? 'Certification...' : '✓ Certifier ETHYS'}
              </button>
            </div>
          ) : (
            <div>
              <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Motif du refus..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, boxSizing: 'border-box', outline: 'none', height: 80, marginBottom: 10, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowRefus(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1.5px solid #EEF0F3', background: '#F8FAFC', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => onRefuser(d, commentaire)} disabled={saving} style={{ flex: 2, padding: '9px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Confirmer le refus
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {d.statut === 'certifiee' && (
        <div style={{ padding: '14px 16px', borderRadius: 10, background: '#D1FAE5', border: '1px solid #A7F3D0', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#065F46', marginBottom: 4 }}>🏆 Certification ETHYS obtenue</div>
          <div style={{ fontSize: 11, color: '#065F46' }}>Vous pouvez maintenant générer votre QR code depuis le module QR Code.</div>
        </div>
      )}
    </div>
  )
}
