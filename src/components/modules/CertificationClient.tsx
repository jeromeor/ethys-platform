'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations, useLocale } from 'next-intl'

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
  commande_id: string | null
  commande_reference: string | null  // jointure depuis page.tsx
  entreprise?: Entreprise | Entreprise[] | null
}

interface Certification {
  id: string
  reference: string | null
  statut: string | null
  date_emission: string | null
  date_expiration: string | null
  created_at: string
  declaration?: Declaration | Declaration[] | null
  filature_nom?: string | null
  filature?: { id: string; nom: string } | null
  type_produit?: string | null
  volume_recycle_kg?: number | null
  volume_vierge_kg?: number | null
  pct_recycle?: number | null
}

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
  declarationsFilature: Declaration[]
  commandesEligibles: CommandeEligible[]
  userRole: string
  entrepriseId: string
  userId: string
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
  declarationsFilature: initialDeclsFilature,
  commandesEligibles,
  userRole,
  entrepriseId,
  userId,
}: Props) {
  const supabase = createClient()
  const t = useTranslations('certification')
  const locale = useLocale()
  const formatDate = (s: string | null | undefined): string => {
    if (!s) return '—'
    return new Date(s).toLocaleDateString(locale)
  }
  const searchParams = useSearchParams()
  const [certifications, setCertifications] = useState<Certification[]>(initial)
  const [attente, setAttente] = useState<Declaration[]>(declarationsEnAttente)
  const [declsFilature, setDeclsFilature] = useState<Declaration[]>(initialDeclsFilature)
  const [selected, setSelected] = useState<Certification | null>(null)
  const [selectedDecl, setSelectedDecl] = useState<Declaration | null>(null)
  const [selectedDeclFilature, setSelectedDeclFilature] = useState<Declaration | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'ok' | ''>('')
  const [commentaire, setCommentaire] = useState('')
  const [showRefus, setShowRefus] = useState(false)
  const [declarationHonneur, setDeclarationHonneur] = useState(false)
  const [selectedCommandeId, setSelectedCommandeId] = useState('')
  // State local pour filtrer les commandes après soumission sans recharger la page
  const [commandesDispos, setCommandesDispos] = useState<CommandeEligible[]>(commandesEligibles)
  const [qrCode, setQrCode] = useState<{ url_publique: string; data_encodee: string; reference: string } | null>(null)

  const isAdmin = userRole === 'admin'

  // Marque les notifs certification comme lues à l'ouverture de la page
  useEffect(() => {
    if (!userId) return
    supabase
      .from('notifications')
      .update({ lu: true })
      .eq('user_id', userId)
      .eq('type', 'certification')
      .eq('lu', false)
      .then(() => {})
  }, [userId])

  // Pré-remplit et ouvre le formulaire si commande_id en query param
  useEffect(() => {
    const commandeId = searchParams.get('commande_id')
    if (commandeId && commandesDispos.find(c => c.id === commandeId)) {
      setSelectedCommandeId(commandeId)
      setShowForm(true)
    }
  }, [])

  // Charge le QR code lié à la certification sélectionnée
  useEffect(() => {
    if (!selected?.id) {
      setQrCode(null)
      return
    }
    supabase
      .from('qr_codes')
      .select('url_publique, data_encodee, reference')
      .eq('certification_id', selected.id)
      .eq('actif', true)
      .maybeSingle()
      .then(({ data }) => setQrCode(data as any))
  }, [selected?.id])
  
  // --- Filature : demande de certification liée à une commande ---
  const demanderCertification = async () => {
    if (!selectedCommandeId) {
      setMessageType('error'); setMessage(t('msg.selectCommande'))
      return
    }
    if (!declarationHonneur) {
      setMessageType('error'); setMessage(t('msg.cocherHonneur'))
      return
    }
    setSaving(true)
    setMessageType(''); setMessage('')

    const commande = commandesDispos.find(c => c.id === selectedCommandeId)
    if (!commande) {
      setMessageType('error'); setMessage(t('msg.commandeIntrouvable'))
      setSaving(false)
      return
    }

    const { data: newDecl, error } = await supabase
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
        commande_id: selectedCommandeId,
      })
      .select('id, statut, type_produit, volume_recycle_kg, volume_vierge_kg, pct_recycle, created_at, entreprise_id, initiateur_id, filature_nom, commande_id')
      .single()

    if (error) {
      setMessageType('error'); setMessage(t('erreurPrefix') + error.message)
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

    // Ajoute la demande dans la liste "en cours" avec la référence commande
    if (newDecl) {
      setDeclsFilature(prev => [{
        ...(newDecl as Declaration),
        commande_reference: commande.reference,
      }, ...prev])
    }

    // Retire la commande soumise du select pour empêcher les doublons
    setCommandesDispos(prev => prev.filter(c => c.id !== selectedCommandeId))

    setShowForm(false)
    setSelectedCommandeId('')
    setDeclarationHonneur(false)
    setMessageType('ok'); setMessage(t('msg.demandeSoumise'))
    setSaving(false)
  }

  // --- Admin : demande les duplicatas à la filature ---
  const demanderDuplicatas = async (decl: Declaration) => {
    setSaving(true)
    setMessageType(''); setMessage('')

    const { error } = await supabase
      .from('declarations_ethys')
      .update({ statut: 'duplicatas_demandes' })
      .eq('id', decl.id)

    if (error) {
      setMessageType('error'); setMessage(t('erreurPrefix') + error.message)
      setSaving(false)
      return
    }

    // Notifie la filature
    await supabase.from('notifications').insert({
      user_id: decl.initiateur_id,
      type: 'certification',
      titre: 'Duplicatas demandés',
      contenu: 'TEXTILE LOOP vous demande les duplicatas de vos commandes de coton recyclé et vierge pour finaliser votre certification.',
      lien: '/certification',
      lu: false,
    })

    // Envoie l'email
    const ent = getEntreprise(decl)
    await fetch('/api/certification-duplicatas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filature_nom: ent?.nom ?? decl.filature_nom ?? 'Filature',
        declaration_id: decl.id,
      }),
    })

    setAttente(prev => prev.map(d =>
      d.id === decl.id ? { ...d, statut: 'duplicatas_demandes' } : d
    ))
    setSelectedDecl({ ...decl, statut: 'duplicatas_demandes' })
    setMessageType('ok'); setMessage(t('msg.duplicatasEnvoyes'))
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
        pct_recycle: 51,
        date_emission: dateEmission,
        date_expiration: dateExpiration,
        statut: 'certifiee',
        created_by: userId,
      })
      .select('id, reference, statut, date_emission, date_expiration, created_at, type_produit, volume_recycle_kg, volume_vierge_kg, pct_recycle')
      .single()

    if (error) {
      setMessageType('error'); setMessage(t('msg.erreurCertif') + error.message)
      setSaving(false)
      return
    }

    await supabase.from('notifications').insert({
      user_id: decl.initiateur_id,
      type: 'certification',
      titre: 'Certification ETHYS obtenue !',
      contenu: `Votre demande a été certifiée. Numéro : ${reference}`,
      lien: '/certification',
      lu: false,
    })

    // Génère automatiquement le QR code après certification
    if (newCert) {
      await fetch('/api/qr-certification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certification_id: newCert.id,
          numero: reference,
          data_encodee: JSON.stringify({
            reference,
            filature_id: decl.entreprise_id,
            type_produit: decl.type_produit ?? 'Fil ETHYS',
            volume_recycle_kg: decl.volume_recycle_kg,
            volume_vierge_kg: decl.volume_vierge_kg,
          }),
        }),
      })
    }

    const certAvecDecl: Certification = {
      ...(newCert as any),
      declaration: decl,
    }
    setCertifications(prev => [certAvecDecl, ...prev])
    setAttente(prev => prev.filter(d => d.id !== decl.id))
    setSelectedDecl(null)
    setMessageType('ok'); setMessage(t('msg.certifAccordee') + reference)
    setSaving(false)
  }

  // --- Admin : refuse une déclaration ---
  const refuser = async (decl: Declaration) => {
    if (!commentaire.trim()) {
      setMessageType('error'); setMessage(t('msg.motifRefus'))
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
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{t('listeTitre')}</div>
          <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>
            <span style={{ fontWeight: 700, color: '#2d5016' }}>{certifications.length}</span> {t('suffix.certifiees')}
            {isAdmin && attente.length > 0 && (
              <>{' · '}<span style={{ fontWeight: 700, color: '#b45309' }}>{attente.length}</span> {t('suffix.enAttenteCount')}</>
            )}
            {!isAdmin && declsFilature.length > 0 && (
              <>{' · '}<span style={{ fontWeight: 700, color: '#b45309' }}>{declsFilature.length}</span> {t('suffix.enCours')}</>
            )}
          </div>
        </div>
        {!isAdmin && commandesDispos.length > 0 && (
          <button
            onClick={() => { setShowForm(true); setSelected(null); setSelectedDecl(null); setSelectedDeclFilature(null) }}
            style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {t('demander')}
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Section admin : demandes à valider */}
        {isAdmin && attente.length > 0 && (
          <>
            <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 1 }}>{t('section.aValider')}</div>
            {attente.map(decl => {
              const ent = getEntreprise(decl)
              return (
                <div
                  key={decl.id}
                  onClick={() => { setSelectedDecl(decl); setSelected(null); setShowForm(false); setSelectedDeclFilature(null) }}
                  style={{ padding: '12px 16px', cursor: 'pointer', background: selectedDecl?.id === decl.id ? '#fdf8ec' : 'transparent', borderLeft: '3px solid ' + (selectedDecl?.id === decl.id ? '#b45309' : 'transparent'), borderBottom: '1px solid #f5f3ef' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{ent?.nom ?? '—'}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      background: decl.statut === 'duplicatas_demandes' ? '#fdf0e8' : '#fdf8ec',
                      color: decl.statut === 'duplicatas_demandes' ? '#c2440e' : '#b8860b'
                    }}>
                      {decl.statut === 'duplicatas_demandes' ? t('statut.duplicatasCourt') : t('statut.enAttente')}
                    </span>
                  </div>
                  {decl.commande_reference && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#2d5016', marginBottom: 2 }}>{decl.commande_reference}</div>
                  )}
                  <div style={{ fontSize: 11, color: '#4a5568' }}>
                    {decl.type_produit ?? '—'} · {decl.volume_recycle_kg && decl.volume_vierge_kg
                      ? Math.round(decl.volume_recycle_kg + decl.volume_vierge_kg).toLocaleString(locale) + ' kg'
                      : decl.volume_recycle_kg ? Math.round(decl.volume_recycle_kg).toLocaleString(locale) + ' kg' : '—'}
                  </div>
                  <div style={{ fontSize: 10, color: '#a0aec0', marginTop: 2 }}>{formatDate(decl.created_at)}</div>
                </div>
              )
            })}
          </>
        )}

        {/* Section filature : demandes en cours */}
        {!isAdmin && declsFilature.length > 0 && (
          <>
            <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 1 }}>{t('section.enCoursExamen')}</div>
            {declsFilature.map(decl => (
              <div
                key={decl.id}
                onClick={() => { setSelectedDeclFilature(decl); setSelected(null); setSelectedDecl(null); setShowForm(false) }}
                style={{ padding: '12px 16px', cursor: 'pointer', background: selectedDeclFilature?.id === decl.id ? '#fdf8ec' : 'transparent', borderLeft: '3px solid ' + (selectedDeclFilature?.id === decl.id ? '#b45309' : 'transparent'), borderBottom: '1px solid #f5f3ef' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{decl.type_produit ?? 'Fil ETHYS'}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    background: decl.statut === 'duplicatas_demandes' ? '#fdf0e8' : '#fdf8ec',
                    color: decl.statut === 'duplicatas_demandes' ? '#c2440e' : '#b8860b'
                  }}>
                    {decl.statut === 'duplicatas_demandes' ? t('statut.duplicatasDemandes') : t('statut.enAttente')}
                  </span>
                </div>
                {decl.commande_reference && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#2d5016', marginBottom: 2 }}>{decl.commande_reference}</div>
                )}
                <div style={{ fontSize: 11, color: '#4a5568' }}>
                  {decl.volume_recycle_kg && decl.volume_vierge_kg
                    ? Math.round(decl.volume_recycle_kg + decl.volume_vierge_kg).toLocaleString(locale) + ' kg total'
                    : decl.volume_recycle_kg ? Math.round(decl.volume_recycle_kg).toLocaleString(locale) + ' kg' : '—'}
                </div>
                <div style={{ fontSize: 10, color: '#a0aec0', marginTop: 2 }}>{formatDate(decl.created_at)}</div>
              </div>
            ))}
          </>
        )}

        {/* Séparateur certifiées */}
        {((isAdmin && certifications.length > 0 && attente.length > 0) || (!isAdmin && certifications.length > 0 && declsFilature.length > 0)) && (
          <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#2d5016', textTransform: 'uppercase', letterSpacing: 1 }}>{t('section.certifiees')}</div>
        )}

        {certifications.length === 0 && attente.length === 0 && declsFilature.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: '#8b7355', fontSize: 12 }}>{t('aucuneCertif')}</div>
        ) : certifications.map(cert => {
          const decl = getDeclaration(cert)
          return (
            <div
              key={cert.id}
              onClick={() => { setSelected(cert); setSelectedDecl(null); setShowForm(false); setSelectedDeclFilature(null) }}
              style={{ padding: '12px 16px', cursor: 'pointer', background: selected?.id === cert.id ? '#f0f4ec' : 'transparent', borderLeft: '3px solid ' + (selected?.id === cert.id ? '#2d5016' : 'transparent'), borderBottom: '1px solid #f5f3ef' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>
                  {(cert as any).filature?.nom ?? decl?.filature_nom ?? cert.filature_nom ?? '—'}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#f0f4ec', color: '#2d5016' }}>{t('statut.certifiee')}</span>
              </div>
              <div style={{ fontSize: 11, color: '#4a5568' }}>
                {(decl?.type_produit ?? cert.type_produit ?? '—') + ' · '}
                {(decl?.volume_recycle_kg ?? cert.volume_recycle_kg)
                  ? Math.round(decl?.volume_recycle_kg ?? cert.volume_recycle_kg ?? 0).toLocaleString(locale) + ' ' + t('suffix.kgRecycle')
                  : '—'}
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
      const commandeSelectionnee = commandesDispos.find(c => c.id === selectedCommandeId)
      return (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{t('form.titre')}</div>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('form.commandeLabel')}</label>
              <select
                value={selectedCommandeId}
                onChange={e => setSelectedCommandeId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">{t('form.selectCommande')}</option>
                {commandesDispos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.reference} — {Math.round(c.volume_recycle_kg + c.volume_vierge_kg).toLocaleString(locale)} kg — {c.marque_nom}
                  </option>
                ))}
              </select>
            </div>

            {commandeSelectionnee && (
              <div style={{ padding: '14px 16px', borderRadius: 8, background: '#f0f4ec', border: '1px solid #c8d8b8', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2d5016', marginBottom: 8 }}>{t('form.recap')} — {commandeSelectionnee.reference}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>
                  {t('form.volumeTotal')} : {Math.round(commandeSelectionnee.volume_recycle_kg + commandeSelectionnee.volume_vierge_kg).toLocaleString(locale)} kg
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: '#4a5568' }}>
                  <div>{t('form.type')} : <strong>{t('filEthys')}</strong></div>
                  <div>{t('form.pctRecycle')} : <strong>{commandeSelectionnee.pct_recycle}%</strong></div>
                  <div>{t('form.volumeRecycle')} : <strong>{Math.round(commandeSelectionnee.volume_recycle_kg).toLocaleString(locale)} kg</strong></div>
                  <div>{t('form.volumeVierge')} : <strong>{Math.round(commandeSelectionnee.volume_vierge_kg).toLocaleString(locale)} kg</strong></div>
                  <div>{t('form.filature')} : <strong>{commandeSelectionnee.filature_nom}</strong></div>
                  <div>{t('form.marque')} : <strong>{commandeSelectionnee.marque_nom}</strong></div>
                </div>
              </div>
            )}

            <div style={{ padding: '14px 16px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>{t('form.honneurTitre')}</div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={declarationHonneur} onChange={e => setDeclarationHonneur(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5 }}>
                  {t('form.honneurTexte')}
                </span>
              </label>
            </div>

            {message && (
              <div style={{ padding: '10px 14px', borderRadius: 6, background: messageType === 'error' ? '#fdf0f0' : '#f0f4ec', border: '1px solid ' + (messageType === 'error' ? '#c8a0a0' : '#c8d8b8'), fontSize: 12, color: messageType === 'error' ? '#8b3a3a' : '#2d5016', marginBottom: 12 }}>
                {message}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#4a5568', fontSize: 13, cursor: 'pointer' }}>{t('annuler')}</button>
              <button
                onClick={demanderCertification}
                disabled={saving || !selectedCommandeId || !declarationHonneur}
                style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: saving || !selectedCommandeId || !declarationHonneur ? '#d4c5b0' : '#1a1a1a', color: saving || !selectedCommandeId || !declarationHonneur ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: saving || !selectedCommandeId || !declarationHonneur ? 'default' : 'pointer' }}
              >
                {saving ? t('form.envoi') : t('form.soumettre')}
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Panneau déclaration en attente filature (lecture seule)
    if (selectedDeclFilature) {
      return (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{t('declFilature.titre')}</div>
                {selectedDeclFilature.commande_reference && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2d5016', marginBottom: 2 }}>{t('commandePrefix')} {selectedDeclFilature.commande_reference}</div>
                )}
                <div style={{ fontSize: 12, color: '#8b7355' }}>{t('soumiseLe')} {formatDate(selectedDeclFilature.created_at)}</div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                background: selectedDeclFilature.statut === 'duplicatas_demandes' ? '#fdf0e8' : '#fdf8ec',
                color: selectedDeclFilature.statut === 'duplicatas_demandes' ? '#c2440e' : '#b8860b'
              }}>
                {selectedDeclFilature.statut === 'duplicatas_demandes' ? t('statut.duplicatasDemandes') : t('statut.enAttente')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                [t('labels.type'), selectedDeclFilature.type_produit ?? '—'],
                [t('labels.volumeTotal'), selectedDeclFilature.volume_recycle_kg && selectedDeclFilature.volume_vierge_kg ? Math.round(selectedDeclFilature.volume_recycle_kg + selectedDeclFilature.volume_vierge_kg).toLocaleString(locale) + ' kg' : '—'],
                [t('labels.volumeRecycle'), selectedDeclFilature.volume_recycle_kg ? Math.round(selectedDeclFilature.volume_recycle_kg).toLocaleString(locale) + ' kg' : '—'],
                [t('labels.volumeVierge'), selectedDeclFilature.volume_vierge_kg ? Math.round(selectedDeclFilature.volume_vierge_kg).toLocaleString(locale) + ' kg' : '—'],
                [t('labels.pctRecycle'), selectedDeclFilature.pct_recycle ? selectedDeclFilature.pct_recycle + '%' : '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '10px 14px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                  <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 8, fontSize: 12,
              background: selectedDeclFilature.statut === 'duplicatas_demandes' ? '#fdf0e8' : '#fdf8ec',
              border: '1px solid ' + (selectedDeclFilature.statut === 'duplicatas_demandes' ? '#f0c0a0' : '#f0d080'),
              color: selectedDeclFilature.statut === 'duplicatas_demandes' ? '#c2440e' : '#b45309'
            }}>
              {selectedDeclFilature.statut === 'duplicatas_demandes'
                ? <>{t('declFilature.dupMsg1')}<br />{t('declFilature.dupMsg2')} <strong>contact@ethys-textileloop.com</strong></>
                : <>{t('declFilature.attMsg1')}<br />{t('declFilature.attMsg2')}</>
              }
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
            <div style={{ padding: '12px 16px', borderRadius: 8, background: messageType === 'error' ? '#fdf0f0' : '#f0f4ec', border: '1px solid ' + (messageType === 'error' ? '#c8a0a0' : '#c8d8b8'), fontSize: 13, color: messageType === 'error' ? '#8b3a3a' : '#2d5016', marginBottom: 20 }}>
              {message}
            </div>
          )}
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{ent?.nom ?? selectedDecl.filature_nom ?? '—'}</div>
                {selectedDecl.commande_reference && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2d5016', marginBottom: 2 }}>{t('commandePrefix')} {selectedDecl.commande_reference}</div>
                )}
                <div style={{ fontSize: 12, color: '#8b7355' }}>{t('soumiseLe')} {formatDate(selectedDecl.created_at)}</div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                background: selectedDecl.statut === 'duplicatas_demandes' ? '#fdf0e8' : '#fdf8ec',
                color: selectedDecl.statut === 'duplicatas_demandes' ? '#c2440e' : '#b8860b'
              }}>
                {selectedDecl.statut === 'duplicatas_demandes' ? t('statut.duplicatasDemandes') : t('statut.enAttente')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                [t('labels.type'), selectedDecl.type_produit ?? '—'],
                [t('labels.volumeTotal'), selectedDecl.volume_recycle_kg && selectedDecl.volume_vierge_kg ? Math.round(selectedDecl.volume_recycle_kg + selectedDecl.volume_vierge_kg).toLocaleString(locale) + ' kg' : '—'],
                [t('labels.volumeRecycle'), selectedDecl.volume_recycle_kg ? Math.round(selectedDecl.volume_recycle_kg).toLocaleString(locale) + ' kg' : '—'],
                [t('labels.volumeVierge'), selectedDecl.volume_vierge_kg ? Math.round(selectedDecl.volume_vierge_kg).toLocaleString(locale) + ' kg' : '—'],
                [t('labels.pctRecycle'), selectedDecl.pct_recycle ? selectedDecl.pct_recycle + '%' : '—'],
                [t('labels.filature'), selectedDecl.filature_nom ?? '—'],
                [t('labels.pays'), selectedDecl.provenance_pays ?? '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '10px 14px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                  <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e8e3d8', paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>{t('decisionTitre')}</div>
              {!showRefus ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedDecl.statut !== 'duplicatas_demandes' && (
                    <button
                      onClick={() => demanderDuplicatas(selectedDecl)}
                      disabled={saving}
                      style={{ width: '100%', padding: '10px', borderRadius: 4, border: '1.5px solid #d4c5b0', background: '#f5f3ef', color: '#4a5568', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}
                    >
                      {saving ? '...' : t('demanderDuplicatas')}
                    </button>
                  )}
                  {selectedDecl.statut === 'duplicatas_demandes' && (
                    <div style={{ padding: '10px 14px', borderRadius: 6, background: '#fdf8ec', border: '1px solid #f0d080', fontSize: 12, color: '#b45309', textAlign: 'center' }}>
                      {t('duplicatasAttente')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowRefus(true)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #c8a0a0', background: '#fdf0f0', color: '#8b3a3a', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      {t('refuser')}
                    </button>
                    <button onClick={() => certifier(selectedDecl)} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: saving ? '#d4c5b0' : '#1a1a1a', color: saving ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                      {saving ? t('certifEnCours') : t('certifierEthys')}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <textarea
                    value={commentaire}
                    onChange={e => setCommentaire(e.target.value)}
                    placeholder={t("motifPlaceholder")}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, boxSizing: 'border-box', outline: 'none', height: 80, marginBottom: 10, resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowRefus(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1.5px solid #e8e3d8', background: '#f5f3ef', fontSize: 12, cursor: 'pointer' }}>{t('annuler')}</button>
                    <button onClick={() => refuser(selectedDecl)} disabled={saving} style={{ flex: 2, padding: '9px', borderRadius: 8, border: 'none', background: '#8b3a3a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {t('confirmerRefus')}
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
      const typeP = selected.type_produit ?? decl?.type_produit ?? '—'
      const volR = selected.volume_recycle_kg ?? decl?.volume_recycle_kg
      const volV = selected.volume_vierge_kg ?? decl?.volume_vierge_kg
      const pct = selected.pct_recycle ?? decl?.pct_recycle
      return (
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{filatureNom}</div>
                <div style={{ fontSize: 12, color: '#8b7355' }}>{t('emiseLe')} {formatDate(selected.date_emission)}</div>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#f0f4ec', color: '#2d5016' }}>{t('statut.certifiee')}</span>
            </div>

            <div style={{ padding: '16px', borderRadius: 8, background: '#f0f4ec', border: '1px solid #c8d8b8', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#2d5016', marginBottom: 8 }}>{t('certifObtenue')}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{selected.reference}</div>
              <div style={{ fontSize: 12, color: '#4a5568' }}>
                {t('emiseLe')} {formatDate(selected.date_emission)} · {t('valideJusqu')} {formatDate(selected.date_expiration)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                [t('labels.type'), typeP],
                [t('labels.volumeRecycle'), volR != null ? Math.round(volR).toLocaleString(locale) + ' kg' : '—'],
                [t('labels.volumeVierge'), volV != null ? Math.round(volV).toLocaleString(locale) + ' kg' : '—'],
                [t('labels.pctRecycle'), pct != null ? pct + '%' : '—'],
                [t('labels.filature'), filatureNom],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '10px 14px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                  <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{val}</div>
                </div>
             ))}
            </div>

            {qrCode && (
              <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <img
                    src={qrCode.data_encodee}
                    alt="QR code"
                    style={{ width: 120, height: 120, borderRadius: 4, background: '#fff', padding: 6, border: '1px solid #e8e3d8' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 4 }}>{"Page publique de tra\u00e7abilit\u00e9"}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C', marginBottom: 10, wordBreak: 'break-all' }}>{qrCode.reference}</div>
                    
                      <a href={qrCode.url_publique} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '8px 14px', borderRadius: 4, background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                      {"Voir page publique \u2192"}
                    </a>
                  </div>
                </div>
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
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>{t('emptyTitre')}</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
            {isAdmin
              ? attente.length > 0
                ? t('empty.adminAValider')
                : t('empty.adminVide')
              : commandesDispos.length > 0
                ? t('empty.filatureEligibles')
                : declsFilature.length > 0
                  ? t('empty.filatureVoir')
                  : t('empty.filatureVide')}
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
