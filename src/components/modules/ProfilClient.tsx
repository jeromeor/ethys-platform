'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations, useLocale } from 'next-intl'

interface Props {
  user: { id: string; email?: string } | null
  profil: Record<string, string> | null
  entreprise: Record<string, string> | null
  certifications: Record<string, string>[]
  documents: Record<string, string>[]
}

export default function ProfilClient({ user, profil, entreprise, certifications, documents }: Props) {
  const supabase = createClient()
  const t = useTranslations('profil')
  const locale = useLocale()

  const [editEntreprise, setEditEntreprise] = useState(false)
  const [editContact, setEditContact] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [docs, setDocs] = useState<Record<string, string>[]>(documents ?? [])
  const [uploadForm, setUploadForm] = useState({ nom: '', type: 'kbis', date_expiration: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formEntreprise, setFormEntreprise] = useState({
    nom: entreprise?.nom ?? '',
    siret: entreprise?.siret ?? '',
    tva: entreprise?.tva ?? '',
    adresse_rue: entreprise?.adresse_rue ?? '',
    code_postal: entreprise?.code_postal ?? '',
    ville: entreprise?.ville ?? '',
    pays: entreprise?.pays ?? '',
    email_contact: entreprise?.email_contact ?? '',
    telephone: entreprise?.telephone ?? '',
    site_web: entreprise?.site_web ?? '',
    description: entreprise?.description ?? '',
    contact_nom: entreprise?.contact_nom ?? '',
    contact_prenom: entreprise?.contact_prenom ?? '',
    contact_fonction: entreprise?.contact_fonction ?? '',
  })

  const [formProfil, setFormProfil] = useState({
    prenom: profil?.prenom ?? '',
    nom: profil?.nom ?? '',
    telephone: profil?.telephone ?? '',
  })

  const sauvegarderEntreprise = async () => {
    if (!profil?.entreprise_id) return
    setSaving(true)
    await supabase.from('entreprises').update({
      ...formEntreprise,
      updated_at: new Date().toISOString(),
    }).eq('id', profil.entreprise_id)
    setSaving(false)
    setEditEntreprise(false)
    setEditContact(false)
    setSuccessMsg(t('msg.entrepriseMaj'))
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const sauvegarderProfil = async () => {
    if (!user?.id) return
    setSaving(true)
    await supabase.from('profils_utilisateurs').update({
      prenom: formProfil.prenom,
      nom: formProfil.nom,
      telephone: formProfil.telephone,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    setSaving(false)
    setEditContact(false)
    setSuccessMsg(t('msg.profilMaj'))
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const telechargerDocument = async (url: string, nom: string) => {
    const { data } = await supabase.storage.from('documents-entreprises').createSignedUrl(url, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const supprimerDocument = async (id: string, url: string) => {
    await supabase.storage.from('documents-entreprises').remove([url])
    await supabase.from('documents_entreprise').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  const uploaderDocument = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !uploadForm.nom || !profil?.entreprise_id) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = profil.entreprise_id + '/' + Date.now() + '.' + ext
    const { error: uploadError } = await supabase.storage.from('documents-entreprises').upload(path, file)
    if (!uploadError) {
      const { data: doc } = await supabase.from('documents_entreprise').insert({
        entreprise_id: profil.entreprise_id,
        nom: uploadForm.nom,
        type: uploadForm.type,
        url: path,
        taille_kb: Math.round(file.size / 1024),
        date_expiration: uploadForm.date_expiration || null,
        created_by: user?.id,
      }).select().single()
      if (doc) setDocs(prev => [...prev, doc as Record<string, string>])
      setShowUpload(false)
      setUploadForm({ nom: '', type: 'kbis', date_expiration: '' })
      if (fileInputRef.current) fileInputRef.current.value = ''
      setSuccessMsg(t('msg.documentAjoute'))
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setUploading(false)
  }

  const inputStyle = {
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: '1.5px solid #d4c5b0', fontSize: 12,
    fontFamily: 'inherit', background: '#faf9f7', boxSizing: 'border-box' as const,
  }
  const labelStyle = { fontSize: 11, color: '#8b7355', fontWeight: 600, display: 'block' as const, marginBottom: 3 }
  const fieldStyle = { marginBottom: 12 }
  const cardStyle = { background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden' as const, marginBottom: 16 }
  const cardHeaderStyle = { padding: '14px 22px', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: 700, color: '#1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
  const btnEdit = { padding: '5px 14px', borderRadius: 4, border: '1.5px solid #d4c5b0', background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#4a5568' }
  const btnSave = { padding: '5px 14px', borderRadius: 4, border: 'none', background: '#1a1a1a', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#fff' }
  const btnCancel = { padding: '5px 14px', borderRadius: 4, border: '1.5px solid #d4c5b0', background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#8b7355', marginRight: 8 }
  const rowStyle = { display: 'flex', gap: 12, marginBottom: 12 }
  const valStyle = { fontSize: 12, fontWeight: 600, color: '#1a1a1a' }
  const lblStyle = { fontSize: 12, color: '#94a3b8', width: 160, flexShrink: 0 }

  const initiales = entreprise?.nom?.slice(0, 2).toUpperCase() ?? user?.email?.slice(0, 2).toUpperCase() ?? 'TL'

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%' }}>

      {successMsg && (
        <div style={{ position: 'fixed', top: 20, right: 28, background: '#2d5016', color: '#fff', padding: '10px 20px', borderRadius: 6, fontSize: 12, fontWeight: 700, zIndex: 999 }}>
          {'OK ' + successMsg}
        </div>
      )}

      {/* Hero */}
      <div style={{ background: '#1a1a1a', borderRadius: 16, padding: '28px 32px', marginBottom: 22, color: '#fff', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, flexShrink: 0 }}>
          {initiales}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 900 }}>{entreprise?.nom ?? user?.email}</span>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: entreprise?.statut === 'verifie' ? '#2d5016' : '#b8860b', color: '#fff' }}>
              {entreprise?.statut === 'verifie' ? t('hero.verifie') : t('hero.enVerification')}
            </span>
          </div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            {(entreprise?.type ?? profil?.role) + ' · ' + (entreprise?.ville ?? '') + (entreprise?.pays ? ', ' + entreprise.pays : '')}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4 }}>{t('hero.rolePlateforme')}</div>
          <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.12)', color: '#c2956e', textTransform: 'capitalize' }}>{profil?.role}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Colonne gauche - Entreprise */}
        <div>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span>{t('entreprise.titre')}</span>
              {!editEntreprise
                ? <button style={btnEdit} onClick={() => setEditEntreprise(true)}>{t('btn.modifier')}</button>
                : <div><button style={btnCancel} onClick={() => setEditEntreprise(false)}>{t('btn.annuler')}</button><button style={btnSave} onClick={sauvegarderEntreprise} disabled={saving}>{saving ? '...' : t('btn.enregistrer')}</button></div>
              }
            </div>
            <div style={{ padding: '18px 22px' }}>
              {!editEntreprise ? (
                <>
                  {[
                    [t('entreprise.raisonSociale'), formEntreprise.nom],
                    [t('entreprise.siret'), formEntreprise.siret || '-'],
                    [t('entreprise.tva'), formEntreprise.tva || '-'],
                    [t('entreprise.adresse'), formEntreprise.adresse_rue || '-'],
                    [t('entreprise.codePostal'), formEntreprise.code_postal || '-'],
                    [t('entreprise.ville'), formEntreprise.ville || '-'],
                    [t('entreprise.pays'), formEntreprise.pays || '-'],
                  ].map(([l, v]) => (
                    <div key={l} style={rowStyle}><span style={lblStyle}>{l}</span><span style={valStyle}>{v}</span></div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fieldStyle}><label style={labelStyle}>{t('entreprise.raisonSociale')}</label><input style={inputStyle} value={formEntreprise.nom} onChange={e => setFormEntreprise(p => ({ ...p, nom: e.target.value }))} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>{t('entreprise.siret')}</label><input style={inputStyle} value={formEntreprise.siret} onChange={e => setFormEntreprise(p => ({ ...p, siret: e.target.value }))} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>{t('entreprise.tvaIntra')}</label><input style={inputStyle} value={formEntreprise.tva} onChange={e => setFormEntreprise(p => ({ ...p, tva: e.target.value }))} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>{t('entreprise.pays')}</label><input style={inputStyle} value={formEntreprise.pays} onChange={e => setFormEntreprise(p => ({ ...p, pays: e.target.value }))} /></div>
                  </div>
                  <div style={fieldStyle}><label style={labelStyle}>{t('entreprise.adresse')}</label><input style={inputStyle} value={formEntreprise.adresse_rue} onChange={e => setFormEntreprise(p => ({ ...p, adresse_rue: e.target.value }))} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                    <div style={fieldStyle}><label style={labelStyle}>{t('entreprise.codePostal')}</label><input style={inputStyle} value={formEntreprise.code_postal} onChange={e => setFormEntreprise(p => ({ ...p, code_postal: e.target.value }))} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>{t('entreprise.ville')}</label><input style={inputStyle} value={formEntreprise.ville} onChange={e => setFormEntreprise(p => ({ ...p, ville: e.target.value }))} /></div>
                  </div>
                  <div style={fieldStyle}><label style={labelStyle}>{t('entreprise.description')}</label><textarea style={{ ...inputStyle, height: 60, resize: 'vertical' }} value={formEntreprise.description} onChange={e => setFormEntreprise(p => ({ ...p, description: e.target.value }))} /></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div>

          {/* Contact entreprise */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span>{t('contact.titre')}</span>
              {!editContact
                ? <button style={btnEdit} onClick={() => setEditContact(true)}>{t('btn.modifier')}</button>
                : <div><button style={btnCancel} onClick={() => setEditContact(false)}>{t('btn.annuler')}</button><button style={btnSave} onClick={sauvegarderEntreprise} disabled={saving}>{saving ? '...' : t('btn.enregistrer')}</button></div>
              }
            </div>
            <div style={{ padding: '18px 22px' }}>
              {!editContact ? (
                <>
                  {[
                    [t('contact.email'), formEntreprise.email_contact || user?.email || '-'],
                    [t('contact.telephone'), formEntreprise.telephone || '-'],
                    [t('contact.siteWeb'), formEntreprise.site_web || '-'],
                    [t('contact.nomContact'), formEntreprise.contact_nom || '-'],
                    [t('contact.prenomContact'), formEntreprise.contact_prenom || '-'],
                    [t('contact.fonction'), formEntreprise.contact_fonction || '-'],
                  ].map(([l, v]) => (
                    <div key={l} style={rowStyle}><span style={lblStyle}>{l}</span><span style={valStyle}>{v}</span></div>
                  ))}
                </>
              ) : (
                <>
                  <div style={fieldStyle}><label style={labelStyle}>{t('contact.emailContact')}</label><input style={inputStyle} value={formEntreprise.email_contact} onChange={e => setFormEntreprise(p => ({ ...p, email_contact: e.target.value }))} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>{t('contact.telephone')}</label><input style={inputStyle} value={formEntreprise.telephone} onChange={e => setFormEntreprise(p => ({ ...p, telephone: e.target.value }))} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>{t('contact.siteWeb')}</label><input style={inputStyle} value={formEntreprise.site_web} onChange={e => setFormEntreprise(p => ({ ...p, site_web: e.target.value }))} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fieldStyle}><label style={labelStyle}>{t('contact.nomContact')}</label><input style={inputStyle} value={formEntreprise.contact_nom} onChange={e => setFormEntreprise(p => ({ ...p, contact_nom: e.target.value }))} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>{t('contact.prenomContact')}</label><input style={inputStyle} value={formEntreprise.contact_prenom} onChange={e => setFormEntreprise(p => ({ ...p, contact_prenom: e.target.value }))} /></div>
                  </div>
                  <div style={fieldStyle}><label style={labelStyle}>{t('contact.fonction')}</label><input style={inputStyle} value={formEntreprise.contact_fonction} onChange={e => setFormEntreprise(p => ({ ...p, contact_fonction: e.target.value }))} /></div>
                </>
              )}
            </div>
          </div>

          {/* Profil personnel */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span>{t('perso.titre')}</span>
              {!editContact
                ? <button style={btnEdit} onClick={() => setEditContact(true)}>{t('btn.modifier')}</button>
                : <div><button style={btnCancel} onClick={() => setEditContact(false)}>{t('btn.annuler')}</button><button style={btnSave} onClick={sauvegarderProfil} disabled={saving}>{saving ? '...' : t('btn.enregistrer')}</button></div>
              }
            </div>
            <div style={{ padding: '18px 22px' }}>
              {!editContact ? (
                <>
                  {[
                    [t('perso.prenom'), formProfil.prenom || '-'],
                    [t('perso.nom'), formProfil.nom || '-'],
                    [t('perso.telephone'), formProfil.telephone || '-'],
                    [t('perso.email'), user?.email || '-'],
                  ].map(([l, v]) => (
                    <div key={l} style={rowStyle}><span style={lblStyle}>{l}</span><span style={valStyle}>{v}</span></div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fieldStyle}><label style={labelStyle}>{t('perso.prenom')}</label><input style={inputStyle} value={formProfil.prenom} onChange={e => setFormProfil(p => ({ ...p, prenom: e.target.value }))} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>{t('perso.nom')}</label><input style={inputStyle} value={formProfil.nom} onChange={e => setFormProfil(p => ({ ...p, nom: e.target.value }))} /></div>
                  </div>
                  <div style={fieldStyle}><label style={labelStyle}>{t('perso.telephone')}</label><input style={inputStyle} value={formProfil.telephone} onChange={e => setFormProfil(p => ({ ...p, telephone: e.target.value }))} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>{t('perso.emailNonModifiable')}</label><input style={{ ...inputStyle, background: '#f5f3ef', color: '#8b7355' }} value={user?.email ?? ''} disabled /></div>
                </>
              )}
            </div>
          </div>

          {/* Certifications */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}><span>{t('certifs.titre', { count: certifications?.length ?? 0 })}</span></div>
            <div style={{ padding: '14px 18px' }}>
              {!certifications || certifications.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>{t('certifs.aucune')}</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {certifications.map((c, i) => (
                    <span key={i} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.valide ? '#d1fae5' : '#fee2e2', color: c.valide ? '#065f46' : '#991b1b' }}>
                      {(c.valide ? 'OK ' : 'KO ') + c.label + ' - ' + c.date_expiration}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span>{t('documents.titre', { count: docs.length })}</span>
              <button style={btnEdit} onClick={() => setShowUpload(true)}>{t('btn.ajouter')}</button>
            </div>
            <div style={{ padding: '14px 18px' }}>
              {docs.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>{t('documents.aucun')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {docs.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 6, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>
                          {d.type === 'kbis' ? 'KB' : d.type === 'certificat' ? 'CE' : d.type === 'assurance' ? 'AS' : 'DO'}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{d.nom}</div>
                          <div style={{ fontSize: 10, color: '#8b7355' }}>
                            {(d.type === 'kbis' ? t('documents.type.kbis') : d.type === 'certificat' ? t('documents.type.certificat') : d.type === 'assurance' ? t('documents.type.assurance') : t('documents.type.autre')) +
                              (d.date_expiration ? ' - ' + t('documents.exp') + ' ' + new Date(d.date_expiration).toLocaleDateString(locale) : '') +
                              (d.taille_kb ? ' - ' + d.taille_kb + ' ' + t('documents.ko') : '')}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => telechargerDocument(d.url, d.nom)} style={{ padding: '4px 10px', borderRadius: 4, border: '1.5px solid #d4c5b0', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#4a5568' }}>
                          {t('btn.voir')}
                        </button>
                        <button onClick={() => supprimerDocument(d.id, d.url)} style={{ padding: '4px 10px', borderRadius: 4, border: '1.5px solid #fde8e8', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#8b3a3a' }}>
                          {t('btn.supprimer')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Suppression compte */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #fde8e8', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#8b3a3a', marginBottom: 4 }}>{t('suppression.titre')}</div>
          <div style={{ fontSize: 12, color: '#8b7355' }}>{t('suppression.texte')}</div>
        </div>
        <a href="/profil/supprimer" style={{ padding: '8px 16px', borderRadius: 4, border: '1.5px solid #8b3a3a', background: '#fff', color: '#8b3a3a', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' }}>
          {t('suppression.bouton')}
        </a>
      </div>

      {/* Modal upload document */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowUpload(false)}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '28px 32px', width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{t('modal.titre')}</span>
              <button onClick={() => setShowUpload(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>x</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{t('modal.nomLabel')}</label>
              <input style={inputStyle} value={uploadForm.nom} onChange={e => setUploadForm(p => ({ ...p, nom: e.target.value }))} placeholder={t('modal.nomPlaceholder')} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{t('modal.typeLabel')}</label>
              <select style={inputStyle} value={uploadForm.type} onChange={e => setUploadForm(p => ({ ...p, type: e.target.value }))}>
                <option value="kbis">{t('documents.type.kbis')}</option>
                <option value="certificat">{t('documents.type.certificat')}</option>
                <option value="assurance">{t('modal.typeAssuranceRcPro')}</option>
                <option value="autre">{t('documents.type.autre')}</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{t('modal.dateExp')}</label>
              <input type="date" style={inputStyle} value={uploadForm.date_expiration} onChange={e => setUploadForm(p => ({ ...p, date_expiration: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{t('modal.fichier')}</label>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ ...inputStyle, padding: '6px 10px' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowUpload(false)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#8b7355', fontSize: 13, cursor: 'pointer' }}>{t('btn.annuler')}</button>
              <button onClick={uploaderDocument} disabled={uploading} style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: uploading ? '#d4c5b0' : '#1a1a1a', color: uploading ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: uploading ? 'default' : 'pointer' }}>
                {uploading ? t('modal.upload') : t('btn.enregistrer')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
