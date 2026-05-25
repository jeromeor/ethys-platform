'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  reference: string | null
  statut: string | null
  date_emission: string | null
  date_expiration: string | null
  created_at: string
  // Données de la déclaration associée (stockées côté client après certification)
  declaration?: Declaration | Declaration[] | null
  // Données directes de la certification
  filature_nom?: string | null
  type_produit?: string | null
  volume_recycle_kg?: number | null
  volume_vierge_kg?: number | null
  pct_recycle?: number | null
}

// Commande éligible à la certification (production 100%, pas de certif en cours)
interface CommandeEligible {
  id: string
  reference: string
  volume_recycle_kg: number
  volume_vierge_kg: number
  pct_recycle: number
  filature_nom: string
  marque_nom: string
}

interface Props {
  certifications: Certification[]
  declarationsEnAttente: Declaration[]
  commandesEligibles: CommandeEligible[]
  userRole: string
  entrepriseId: string
  userId: string
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

function formatDate(s: string | null | undefined): string {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('fr-FR')
}

export default function CertificationClient({
  certifications: initial,
  declarationsEnAttente,
  commandesEligibles,
  userRole,
  entrepriseId,
  userId,
}: Props) {
  const supabase = createClient()
  const [certifications, setCertifications] = useState<Certification[]>(initial)
  const [attente, setAttente] = useState<Declaration[]>(declarationsEnAttente)
  const [selected, setSelected] = useState<Certification | null>(null)
  const [selectedDecl, setSelectedDecl] = useState<Declaration | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [showRefus, setShowRefus] = useState(false)
  const [declarationHonneur, setDeclarationHonneur] = useState(false)
  const [selectedCommandeId, setSelectedCommandeId] = useState('')

  const isAdmin = userRole === 'admin'

  // --- Filature : demande de certification liée à une commande ---
  const demanderCertification = async () => {
    if (!selectedCommandeId) {
      setMessage('Veuillez sélectionner une commande.')
      return
    }
    if (!declarationHonneur) {
      setMessage('Veuillez cocher la déclaration sur honneur.')
      return
    }
    setSaving(true)
    setMessage('')

    const commande = commandesEligibles.find(c => c.id === selectedCommandeId)
    if (!commande) {
      setMessage('Commande introuvable.')
      setSaving(false)
      return
    }

    // Crée une déclaration liée à la commande
    const { error } = await supabase
      .from('declarations_ethys')
      .insert({
        statut: 'en_attente',
        declaration_honneur: true,
        type_produit: 'Fil ETHYS',
        volume_recycle_kg: commande.volume_recycle_kg,
        volume_vierge_kg: commande.volume_vierge_kg,
        pct_recycle: commande.pct_recycle,
        filature_nom: commande.filature_nom,
        entreprise_id: entrepriseId,
        initiateur_id: userId,
        eligible_ethys: true,
      })

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

    for (const admin of admins ?? []) {
      await supabase.from('notifications').insert({
        user_id: admin.id,
        type: 'certification',
        titre: 'Demande de certification',
        contenu: 'Demande de certification ETHYS — ' + commande.reference + ' (' + commande.filature_nom + ')',
        lien: '/certification',
        lu: false,
      })
    }

    setShowForm(false)
    setSelectedCommandeId('')
    setDeclarationHonneur(false)
    setMessage('Demande de certification soumise. Elle sera examinée par TEXTILE LOOP.')
    setSaving(false)
  }

  // --- Admin : certifie une déclaration ---
  const certifier = async (decl: Declaration) => {
    setSaving(true)
    const now = new Date()

    const year = now.getFullYear()
    const seq = String(certifications.length + 1).padStart(4, '0')
    const reference = `CER-${year}-${seq}`

    const dateEmission = now.toISOString()
    const dateExpiration = new Date(new Date().setFullYear(now.getFullYear() + 2)).toISOString()

    await supabase
      .from('declarations_ethys')
      .update({ statut: 'certifiee' })
      .eq('id', decl.id)

    const { data: newCert, error } = await supabase
      .from('certifications_ethys')
      .insert({
        reference,
        filature_id: decl.entreprise_id,
        type_produit: decl.type_produit ?? 'Fil ETHYS',
        volume_recycle_kg: decl.volume_recycle_kg ? Math.round(decl.volume_recycle_kg) : null,
        volume_vierge_kg: decl.volume_vierge_kg ? Math.round(decl.volume_vierge_kg) : null,
        pct_recycle: 51, // toujours fixe : 51% recyclé / 49% vierge
        date_emission: dateEmission,
        date_expiration: dateExpiration,
        statut: 'certifiee',
        created_by: userId,
      })
      .select('id, reference, statut, date_emission, date_expiration, created_at')
      .single()

    if (error) {
  console.log('CERTIF ERROR:', error)
  setMessage('Erreur lors de la certification : ' + error.message)
  setSaving(false)
  return
}
    
console.log('CERTIF OK:', newCert)

    await supabase.from('notifications').insert({
      user_id: decl.initiateur_id,
      type: 'certification',
      titre: 'Certification ETHYS obtenue !',
      contenu: `Votre demande a été certifiée. Numéro : ${reference}`,
      lien: '/certification',
      lu: false,
    })

    // Ajoute la nouvelle certification avec les données de la déclaration pour l'affichage
    const certAvecDecl: Certification = {
      ...(newCert as any),
      declaration: decl,
    }
    setCertifications(prev => [certAvecDecl, ...prev])
    setAttente(prev => prev.filter(d => d.id !== decl.id))
    setSelectedDecl(null)
    setMessage('Certification accordée. Numéro : ' + reference)
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
        {!isAdmin && commandesEligibles.length > 0 && (
          <button
            onClick={() => { setShowForm(true); setSelected(null); setSelectedDecl(null) }}
            style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            + Demander
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
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
                    {decl.type_produit ?? '—'} · {decl.volume_recycle_kg ? Math.round(decl.volume_recycle_kg).toLocaleString('fr-FR') + ' kg recyclé' : '—'}
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

        {certifications.length === 0 && attente.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: '#8b7355', fontSize: 12 }}>
            Aucune certification.
          </div>
        ) : certifications.map(cert => {
          return (
            <div
              key={cert.id}
              onClick={() => { setSelected(cert); setSelectedDecl(null); setShowForm(false) }}
              style={{ padding: '12px 16px', cursor: 'pointer', background: selected?.id === cert.id ? '#f0f4ec' : 'transparent', borderLeft: '3px solid ' + (selected?.id === cert.id ? '#2d5016' : 'transparent'), borderBottom: '1px solid #f5f3ef' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>
                  {(() => {
                    const decl = getDeclaration(cert)
                    const ent = getEntreprise(decl)
                    return ent?.nom ?? (cert as any).filature?.nom ?? decl?.filature_nom ?? '—'
                  })()}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#f0f4ec', color: '#2d5016' }}>Certifiée</span>
              </div>
              <div style={{ fontSize: 11, color: '#4a5568' }}>
                {(() => {
                  const decl = getDeclaration(cert)
                  return (decl?.type_produit ?? cert.type_produit ?? '—') + ' · ' + (decl?.volume_recycle_kg ?? cert.volume_recycle_kg ? ((decl?.volume_recycle_kg ?? cert.volume_recycle_kg)!).toLocaleString('fr-FR') + ' kg recyclé' : '—')
                })()}
              </div>
              {cert.reference && (
                <div style={{ fontSize: 10, fontWeight: 700, color: '#2d5016', marginTop: 2 }}>{cert.reference}</div>
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
      const commandeSelectionnee = commandesEligibles.find(c => c.id === selectedCommandeId)
      return (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Demande de certification ETHYS</div>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Commande à certifier *</label>
              <select
                value={selectedCommandeId}
                onChange={e => setSelectedCommandeId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">Sélectionner une commande...</option>
                {commandesEligibles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.reference} — {Math.round(c.volume_recycle_kg + c.volume_vierge_kg).toLocaleString('fr-FR')} kg — {c.marque_nom}
                  </option>
                ))}
              </select>
            </div>

            {commandeSelectionnee && (
              <div style={{ padding: '14px 16px', borderRadius: 8, background: '#f0f4ec', border: '1px solid #c8d8b8', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2d5016', marginBottom: 8 }}>Récapitulatif</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: '#4a5568' }}>
                  <div>Type : <strong>Fil ETHYS</strong></div>
                  <div>% recyclé : <strong>{commandeSelectionnee.pct_recycle}%</strong></div>
                  <div>Volume recyclé : <strong>{Math.round(commandeSelectionnee.volume_recycle_kg).toLocaleString('fr-FR')} kg</strong></div>
                  <div>Volume vierge : <strong>{Math.round(commandeSelectionnee.volume_vierge_kg).toLocaleString('fr-FR')} kg</strong></div>
                  <div>Filature : <strong>{commandeSelectionnee.filature_nom}</strong></div>
                  <div>Marque : <strong>{commandeSelectionnee.marque_nom}</strong></div>
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
                disabled={saving || !selectedCommandeId || !declarationHonneur}
                style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: saving || !selectedCommandeId || !declarationHonneur ? '#d4c5b0' : '#1a1a1a', color: saving || !selectedCommandeId || !declarationHonneur ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: saving || !selectedCommandeId || !declarationHonneur ? 'default' : 'pointer' }}
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
                ['Volume recyclé', selectedDecl.volume_recycle_kg ? Math.round(selectedDecl.volume_recycle_kg).toLocaleString('fr-FR') + ' kg' : '—'],
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
      const filatureNom = (selected as any).filature?.nom ?? decl?.filature_nom ?? selected.filature_nom ?? '—'
      const typeP = decl?.type_produit ?? selected.type_produit ?? '—'
      const volR = decl?.volume_recycle_kg ?? selected.volume_recycle_kg
      const volV = decl?.volume_vierge_kg ?? selected.volume_vierge_kg
      const pct = decl?.pct_recycle ?? selected.pct_recycle
      return (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{filatureNom}</div>
                <div style={{ fontSize: 12, color: '#8b7355' }}>Émise le {formatDate(selected.date_emission)}</div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#f0f4ec', color: '#2d5016' }}>Certifiée</span>
            </div>

            <div style={{ padding: '16px', borderRadius: 8, background: '#f0f4ec', border: '1px solid #c8d8b8', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#2d5016', marginBottom: 8 }}>Certification ETHYS obtenue</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{selected.reference}</div>
              <div style={{ fontSize: 12, color: '#4a5568' }}>
                Émise le {formatDate(selected.date_emission)} · Valide jusqu'au {formatDate(selected.date_expiration)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['Type', typeP],
                ['Volume recyclé', volR ? Math.round(volR).toLocaleString('fr-FR') + ' kg' : '—'],
                ['Volume vierge', volV ? Math.round(volV).toLocaleString('fr-FR') + ' kg' : '—'],
                ['% recyclé', pct ? pct + '%' : '—'],
                ['Filature', filatureNom],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '10px 14px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                  <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{val}</div>
                </div>
              ))}
            </div>
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
              : commandesEligibles.length > 0
                ? 'Vous avez des commandes éligibles. Cliquez sur + Demander pour soumettre.'
                : 'Aucune commande éligible à certifier pour le moment.'}
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
