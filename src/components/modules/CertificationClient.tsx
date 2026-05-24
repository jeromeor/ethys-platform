'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// --- Types alignés sur la vraie structure Supabase ---

interface Entreprise {
  id: string
  nom: string
}

interface Declaration {
  id: string
  statut: string | null
  type_produit: string | null
  volume_recycle_kg: number | null
  volume_vierge_kg: number | null
  pct_recycle: number | null
  provenance_pays: string | null
  filature_nom: string | null
  filature_pays: string | null
  description: string | null
  commentaire_admin: string | null
  entreprise_id: string
  initiateur_id: string
  created_at: string
  entreprise?: Entreprise | Entreprise[] | null
}

interface Certification {
  id: string
  numero: string | null
  date_emission: string | null
  date_validite: string | null
  valide: boolean
  created_at: string
  declaration?: Declaration | Declaration[] | null
}

// Déclaration soumise par la filature, pas encore certifiée
interface DeclarationEligible {
  id: string
  statut: string | null
  type_produit: string | null
  volume_recycle_kg: number | null
  volume_vierge_kg: number | null
  pct_recycle: number | null
  provenance_pays: string | null
  filature_nom: string | null
  description: string | null
  created_at: string
}

interface Props {
  certifications: Certification[]
  declarationsEnAttente: Declaration[]   // admin : déclarations à valider
  declarationsEligibles: DeclarationEligible[]  // filature : déclarations pouvant être soumises
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
  certifiee:     'Certifiée',
  refusee:       'Refusée',
}

function getDeclaration(cert: Certification): Declaration | null {
  if (!cert.declaration) return null
  if (Array.isArray(cert.declaration)) return cert.declaration[0] ?? null
  return cert.declaration
}

function getEntreprise(decl: Declaration | null): Entreprise | null {
  if (!decl?.entreprise) return null
  if (Array.isArray(decl.entreprise)) return decl.entreprise[0] ?? null
  return decl.entreprise
}

export default function CertificationClient({
  certifications: initial,
  declarationsEnAttente,
  declarationsEligibles,
  userRole,
  entrepriseId,
  userId,
}: Props) {
  const supabase = createClient()
  const [certifications, setCertifications] = useState<Certification[]>(initial)
  const [attente, setAttente] = useState<Declaration[]>(declarationsEnAttente)
  const [selected, setSelected] = useState<Certification | null>(null)
  const [selectedDecl, setSelectedDecl] = useState<Declaration | null>(null) // admin : déclaration en attente sélectionnée
  const [showForm, setShowForm] = useState(false)
  const [selectedDeclId, setSelectedDeclId] = useState('')
  const [declarationHonneur, setDeclarationHonneur] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [showRefus, setShowRefus] = useState(false)

  const isAdmin = userRole === 'admin'

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('fr-FR') : '-'

  // --- Filature : soumet une déclaration existante pour certification ---
  const demanderCertification = async () => {
    if (!selectedDeclId) {
      setMessage('Veuillez sélectionner une déclaration.')
      return
    }
    if (!declarationHonneur) {
      setMessage('Veuillez cocher la déclaration sur honneur.')
      return
    }
    setSaving(true)
    setMessage('')

    // Passe la déclaration en statut en_attente (demande de certification)
    const { error } = await supabase
      .from('declarations_ethys')
      .update({ statut: 'en_attente', declaration_honneur: true })
      .eq('id', selectedDeclId)

    if (error) {
      setMessage('Erreur : ' + error.message)
      setSaving(false)
      return
    }

    // Notifie les admins
    const { data: admins } = await supabase
      .from('profils_utilisateurs')
      .select('id')
      .eq('role', 'admin')

    const decl = declarationsEligibles.find(d => d.id === selectedDeclId)
    for (const admin of admins ?? []) {
      await supabase.from('notifications').insert({
        user_id: admin.id,
        type: 'certification',
        titre: 'Demande de certification',
        contenu: 'Déclaration soumise pour certification ETHYS — ' + (decl?.filature_nom ?? ''),
        lien: '/certification',
        lu: false,
      })
    }

    setShowForm(false)
    setSelectedDeclId('')
    setDeclarationHonneur(false)
    setMessage('Demande de certification soumise. Elle sera examinée par TEXTILE LOOP.')
    setSaving(false)
  }

  // --- Admin : certifie une déclaration ---
  const certifier = async (decl: Declaration) => {
    setSaving(true)
    const now = new Date()

    // Génère le numéro de certification
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const pays = decl.provenance_pays?.slice(0, 2).toUpperCase() ?? 'XX'
    const seq = String(certifications.length + 1).padStart(4, '0')
    const numero = `ETHYS-${year}-${month}-001-${pays}-${seq}`

    const dateEmission = now.toISOString()
    const dateValidite = new Date(now.setFullYear(now.getFullYear() + 2)).toISOString()

    // 1. Met à jour le statut de la déclaration
    await supabase
      .from('declarations_ethys')
      .update({ statut: 'certifiee' })
      .eq('id', decl.id)

    // 2. Insère dans certifications_ethys
    const { data: newCert, error } = await supabase
      .from('certifications_ethys')
      .insert({
        declaration_id: decl.id,
        numero,
        date_emission: dateEmission,
        date_validite: dateValidite,
        valide: true,
      })
      .select(`
        id, numero, date_emission, date_validite, valide, created_at,
        declaration:declarations_ethys(
          id, statut, type_produit, volume_recycle_kg, volume_vierge_kg,
          pct_recycle, provenance_pays, filature_nom, filature_pays,
          description, commentaire_admin, entreprise_id, initiateur_id, created_at,
          entreprise:entreprises!declarations_ethys_entreprise_id_fkey(id, nom)
        )
      `)
      .single()

    if (error) {
      setMessage('Erreur lors de la certification : ' + error.message)
      setSaving(false)
      return
    }

    // 3. Notifie l'initiateur
    await supabase.from('notifications').insert({
      user_id: decl.initiateur_id,
      type: 'certification',
      titre: 'Certification ETHYS obtenue !',
      contenu: `Votre déclaration a été certifiée. Numéro : ${numero}`,
      lien: '/certification',
      lu: false,
    })

    // 4. Met à jour le state
    setCertifications(prev => [newCert as Certification, ...prev])
    setAttente(prev => prev.filter(d => d.id !== decl.id))
    setSelectedDecl(null)
    setMessage('Certification accordée. Numéro : ' + numero)
    setSaving(false)
  }

  // --- Admin : refuse une déclaration ---
  const refuser = async (decl: Declaration) => {
    if (!commentaire.trim()) {
      setMessage('Veuillez indiquer un motif de refus.')
      return
    }
    setSaving(true)

    await supabase
      .from('declarations_ethys')
      .update({ statut: 'refusee', commentaire_admin: commentaire })
      .eq('id', decl.id)

    // Notifie l'initiateur
    await supabase.from('notifications').insert({
      user_id: decl.initiateur_id,
      type: 'certification',
      titre: 'Demande de certification refusée',
      contenu: commentaire,
      lien: '/certification',
      lu: false,
    })

    setAttente(prev => prev.filter(d => d.id !== decl.id))
    setSelectedDecl(null)
    setShowRefus(false)
    setCommentaire('')
    setSaving(false)
  }

  // --- Rendu liste gauche ---
  const renderListeGauche = () => (
    <div style={{ width: 320, minWidth: 320, background: '#fff', borderRight: '1px solid #e8e3d8', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f5f3ef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Certifications ETHYS</div>
          <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>
            <span style={{ fontWeight: 700, color: '#2d5016' }}>{certifications.length}</span> certifiées
            {isAdmin && (
              <>
                {' · '}
                <span style={{ fontWeight: 700, color: '#b45309' }}>{attente.length}</span> en attente
              </>
            )}
          </div>
        </div>
        {/* Bouton Demander : filature uniquement si elle a des déclarations éligibles */}
        {!isAdmin && declarationsEligibles.length > 0 && (
          <button
            onClick={() => { setShowForm(true); setSelected(null); setSelectedDecl(null) }}
            style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            + Demander
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Admin : déclarations en attente de validation en haut */}
        {isAdmin && attente.length > 0 && (
          <>
            <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 1 }}>
              À valider
            </div>
            {attente.map(decl => {
              const ent = getEntreprise(decl)
              return (
                <div
                  key={decl.id}
                  onClick={() => { setSelectedDecl(decl); setSelected(null); setShowForm(false) }}
                  style={{ padding: '12px 16px', cursor: 'pointer', background: selectedDecl?.id === decl.id ? '#fdf8ec' : 'transparent', borderLeft: '3px solid ' + (selectedDecl?.id === decl.id ? '#b45309' : 'transparent'), borderBottom: '1px solid #f5f3ef' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{ent?.nom ?? '—'}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#fdf8ec', color: '#b8860b' }}>En attente</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#4a5568' }}>
                    {decl.type_produit ?? '—'} · {decl.volume_recycle_kg ? decl.volume_recycle_kg.toLocaleString('fr-FR') + ' kg recyclé' : '—'}
                  </div>
                  <div style={{ fontSize: 10, color: '#a0aec0', marginTop: 2 }}>{formatDate(decl.created_at)}</div>
                </div>
              )
            })}
            {certifications.length > 0 && (
              <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#2d5016', textTransform: 'uppercase', letterSpacing: 1 }}>
                Certifiées
              </div>
            )}
          </>
        )}

        {/* Certifications existantes */}
        {certifications.length === 0 && attente.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: '#8b7355', fontSize: 12 }}>
            Aucune certification.
          </div>
        ) : certifications.map(cert => {
          const decl = getDeclaration(cert)
          const ent = getEntreprise(decl)
          return (
            <div
              key={cert.id}
              onClick={() => { setSelected(cert); setSelectedDecl(null); setShowForm(false) }}
              style={{ padding: '12px 16px', cursor: 'pointer', background: selected?.id === cert.id ? '#f0f4ec' : 'transparent', borderLeft: '3px solid ' + (selected?.id === cert.id ? '#2d5016' : 'transparent'), borderBottom: '1px solid #f5f3ef' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{ent?.nom ?? decl?.filature_nom ?? '—'}</span>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#f0f4ec', color: '#2d5016' }}>Certifiée</span>
              </div>
              <div style={{ fontSize: 11, color: '#4a5568' }}>
                {decl?.type_produit ?? '—'} · {decl?.volume_recycle_kg ? decl.volume_recycle_kg.toLocaleString('fr-FR') + ' kg recyclé' : '—'}
              </div>
              {cert.numero && (
                <div style={{ fontSize: 10, fontWeight: 700, color: '#2d5016', marginTop: 2 }}>{cert.numero}</div>
              )}
              <div style={{ fontSize: 10, color: '#a0aec0', marginTop: 2 }}>{formatDate(cert.date_emission)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )

  // --- Rendu panneau droit ---
  const renderPanneauDroit = () => {
    // Formulaire demande (filature)
    if (showForm) {
      const declSelectionnee = declarationsEligibles.find(d => d.id === selectedDeclId)
      return (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Demande de certification ETHYS</div>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Déclaration à certifier *</label>
              <select
                value={selectedDeclId}
                onChange={e => setSelectedDeclId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">Sélectionner une déclaration...</option>
                {declarationsEligibles.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.filature_nom ?? d.type_produit ?? d.id.slice(0, 8)} — {d.volume_recycle_kg ? d.volume_recycle_kg.toLocaleString('fr-FR') + ' kg recyclé' : '—'} — {formatDate(d.created_at)}
                  </option>
                ))}
              </select>
            </div>

            {declSelectionnee && (
              <div style={{ padding: '14px 16px', borderRadius: 8, background: '#f0f4ec', border: '1px solid #c8d8b8', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2d5016', marginBottom: 8 }}>Récapitulatif</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: '#4a5568' }}>
                  <div>Type : <strong>{declSelectionnee.type_produit ?? '—'}</strong></div>
                  <div>Volume recyclé : <strong>{declSelectionnee.volume_recycle_kg?.toLocaleString('fr-FR') ?? '—'} kg</strong></div>
                  <div>Volume vierge : <strong>{declSelectionnee.volume_vierge_kg?.toLocaleString('fr-FR') ?? '—'} kg</strong></div>
                  <div>% recyclé : <strong>{declSelectionnee.pct_recycle ?? '—'}%</strong></div>
                  <div>Filature : <strong>{declSelectionnee.filature_nom ?? '—'}</strong></div>
                  {declSelectionnee.provenance_pays && <div>Pays : <strong>{declSelectionnee.provenance_pays}</strong></div>}
                </div>
              </div>
            )}

            <div style={{ padding: '14px 16px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Déclaration sur honneur</div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={declarationHonneur} onChange={e => setDeclarationHonneur(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5 }}>
                  Je certifie sur l'honneur que les informations sont exactes et que cette déclaration respecte les critères ETHYS (minimum 51% de coton recyclé, traçabilité vérifiable).
                </span>
              </label>
            </div>

            {message && (
              <div style={{ padding: '10px 14px', borderRadius: 6, background: message.includes('Erreur') ? '#fdf0f0' : '#f0f4ec', border: '1px solid ' + (message.includes('Erreur') ? '#c8a0a0' : '#c8d8b8'), fontSize: 12, color: message.includes('Erreur') ? '#8b3a3a' : '#2d5016', marginBottom: 12 }}>
                {message}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#4a5568', fontSize: 13, cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={demanderCertification}
                disabled={saving || !selectedDeclId || !declarationHonneur}
                style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: saving || !selectedDeclId || !declarationHonneur ? '#d4c5b0' : '#1a1a1a', color: saving || !selectedDeclId || !declarationHonneur ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: saving || !selectedDeclId || !declarationHonneur ? 'default' : 'pointer' }}
              >
                {saving ? 'Envoi...' : 'Soumettre la demande'}
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Panneau déclaration en attente (admin)
    if (selectedDecl) {
      const ent = getEntreprise(selectedDecl)
      return (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          {message && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: message.includes('Erreur') ? '#fdf0f0' : '#f0f4ec', border: '1px solid ' + (message.includes('Erreur') ? '#c8a0a0' : '#c8d8b8'), fontSize: 13, color: message.includes('Erreur') ? '#8b3a3a' : '#2d5016', marginBottom: 20 }}>
              {message}
            </div>
          )}
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{ent?.nom ?? selectedDecl.filature_nom ?? '—'}</div>
                <div style={{ fontSize: 12, color: '#8b7355' }}>Soumise le {formatDate(selectedDecl.created_at)}</div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#fdf8ec', color: '#b8860b' }}>En attente</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                ['Type', selectedDecl.type_produit ?? '—'],
                ['Volume recyclé', selectedDecl.volume_recycle_kg ? selectedDecl.volume_recycle_kg.toLocaleString('fr-FR') + ' kg' : '—'],
                ['Volume vierge', selectedDecl.volume_vierge_kg ? selectedDecl.volume_vierge_kg.toLocaleString('fr-FR') + ' kg' : '—'],
                ['% recyclé', selectedDecl.pct_recycle ? selectedDecl.pct_recycle + '%' : '—'],
                ['Filature', selectedDecl.filature_nom ?? '—'],
                ['Pays', selectedDecl.provenance_pays ?? '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '10px 14px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                  <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{val}</div>
                </div>
              ))}
            </div>

            {selectedDecl.description && (
              <div style={{ padding: '12px 14px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8', marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 12, color: '#1A202C', lineHeight: 1.5 }}>{selectedDecl.description}</div>
              </div>
            )}

            <div style={{ borderTop: '1px solid #e8e3d8', paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Décision TEXTILE LOOP</div>
              {!showRefus ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowRefus(true)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #c8a0a0', background: '#fdf0f0', color: '#8b3a3a', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Refuser
                  </button>
                  <button onClick={() => certifier(selectedDecl)} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: saving ? '#d4c5b0' : '#1a1a1a', color: saving ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                    {saving ? 'Certification...' : 'Certifier ETHYS'}
                  </button>
                </div>
              ) : (
                <div>
                  <textarea
                    value={commentaire}
                    onChange={e => setCommentaire(e.target.value)}
                    placeholder="Motif du refus..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, boxSizing: 'border-box', outline: 'none', height: 80, marginBottom: 10, resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowRefus(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1.5px solid #e8e3d8', background: '#f5f3ef', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
                    <button onClick={() => refuser(selectedDecl)} disabled={saving} style={{ flex: 2, padding: '9px', borderRadius: 8, border: 'none', background: '#8b3a3a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Confirmer le refus
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    // Panneau certification existante
    if (selected) {
      const decl = getDeclaration(selected)
      const ent = getEntreprise(decl)
      return (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{ent?.nom ?? decl?.filature_nom ?? '—'}</div>
                <div style={{ fontSize: 12, color: '#8b7355' }}>Émise le {formatDate(selected.date_emission)}</div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#f0f4ec', color: '#2d5016' }}>Certifiée</span>
            </div>

            <div style={{ padding: '16px', borderRadius: 8, background: '#f0f4ec', border: '1px solid #c8d8b8', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#2d5016', marginBottom: 8 }}>Certification ETHYS obtenue</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{selected.numero}</div>
              <div style={{ fontSize: 12, color: '#4a5568' }}>
                Émise le {formatDate(selected.date_emission)} · Valide jusqu'au {formatDate(selected.date_validite)}
              </div>
            </div>

            {decl && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Type', decl.type_produit ?? '—'],
                  ['Volume recyclé', decl.volume_recycle_kg ? decl.volume_recycle_kg.toLocaleString('fr-FR') + ' kg' : '—'],
                  ['Volume vierge', decl.volume_vierge_kg ? decl.volume_vierge_kg.toLocaleString('fr-FR') + ' kg' : '—'],
                  ['% recyclé', decl.pct_recycle ? decl.pct_recycle + '%' : '—'],
                  ['Filature', decl.filature_nom ?? '—'],
                  ['Pays', decl.provenance_pays ?? '—'],
                ].map(([label, val]) => (
                  <div key={label} style={{ padding: '10px 14px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                    <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    // Aucune sélection
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '80px 40px', color: '#8b7355' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Certification ETHYS</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
            {isAdmin
              ? attente.length > 0
                ? 'Sélectionnez une demande pour la valider ou la refuser.'
                : 'Aucune demande en attente.'
              : declarationsEligibles.length > 0
                ? 'Vous avez des déclarations éligibles. Cliquez sur + Demander pour soumettre.'
                : 'Aucune déclaration éligible à certifier pour le moment.'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {renderListeGauche()}
      {renderPanneauDroit()}
    </div>
  )
}
