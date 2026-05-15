'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  user: { id: string; email?: string } | null
  profil: Record<string, string> | null
  entreprise: Record<string, string> | null
  certifications: Record<string, string>[]
  documents: Record<string, string>[]
}

export default function ProfilClient({ user, profil, entreprise, certifications, documents }: Props) {
  const supabase = createClient()

  const [editEntreprise, setEditEntreprise] = useState(false)
  const [editContact, setEditContact] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

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
    setSuccessMsg('Entreprise mise à jour')
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
    setSuccessMsg('Profil mis à jour')
    setTimeout(() => setSuccessMsg(''), 3000)
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
          ✓ {successMsg}
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
              {entreprise?.statut === 'verifie' ? '✓ Profil vérifié' : '⏳ En cours de vérification'}
            </span>
          </div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            {entreprise?.type ?? profil?.role} · {entreprise?.ville ?? ''}{entreprise?.pays ? ', ' + entreprise.pays : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4 }}>Rôle plateforme</div>
          <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.12)', color: '#c2956e', textTransform: 'capitalize' }}>{profil?.role}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Colonne gauche - Entreprise */}
        <div>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span>Informations légales & adresse</span>
              {!editEntreprise
                ? <button style={btnEdit} onClick={() => setEditEntreprise(true)}>Modifier</button>
                : <div><button style={btnCancel} onClick={() => setEditEntreprise(false)}>Annuler</button><button style={btnSave} onClick={sauvegarderEntreprise} disabled={saving}>{saving ? '...' : 'Enregistrer'}</button></div>
              }
            </div>
            <div style={{ padding: '18px 22px' }}>
              {!editEntreprise ? (
                <>
                  {[
                    ['Raison sociale', formEntreprise.nom],
                    ['SIRET', formEntreprise.siret || '—'],
                    ['TVA', formEntreprise.tva || '—'],
                    ['Adresse', formEntreprise.adresse_rue || '—'],
                    ['Code postal', formEntreprise.code_postal || '—'],
                    ['Ville', formEntreprise.ville || '—'],
                    ['Pays', formEntreprise.pays || '—'],
                  ].map(([l, v]) => (
                    <div key={l} style={rowStyle}><span style={lblStyle}>{l}</span><span style={valStyle}>{v}</span></div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fieldStyle}><label style={labelStyle}>Raison sociale</label><input style={inputStyle} value={formEntreprise.nom} onChange={e => setFormEntreprise(p => ({ ...p, nom: e.target.value }))} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>SIRET</label><input style={inputStyle} value={formEntreprise.siret} onChange={e => setFormEntreprise(p => ({ ...p, siret: e.target.value }))} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>TVA intracommunautaire</label><input style={inputStyle} value={formEntreprise.tva} onChange={e => setFormEntreprise(p => ({ ...p, tva: e.target.value }))} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>Pays</label><input style={inputStyle} value={formEntreprise.pays} onChange={e => setFormEntreprise(p => ({ ...p, pays: e.target.value }))} /></div>
                  </div>
                  <div style={fieldStyle}><label style={labelStyle}>Adresse</label><input style={inputStyle} value={formEntreprise.adresse_rue} onChange={e => setFormEntreprise(p => ({ ...p, adresse_rue: e.target.value }))} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                    <div style={fieldStyle}><label style={labelStyle}>Code postal</label><input style={inputStyle} value={formEntreprise.code_postal} onChange={e => setFormEntreprise(p => ({ ...p, code_postal: e.target.value }))} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>Ville</label><input style={inputStyle} value={formEntreprise.ville} onChange={e => setFormEntreprise(p => ({ ...p, ville: e.target.value }))} /></div>
                  </div>
                  <div style={fieldStyle}><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, height: 60, resize: 'vertical' }} value={formEntreprise.description} onChange={e => setFormEntreprise(p => ({ ...p, description: e.target.value }))} /></div>
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
              <span>Contact entreprise</span>
              {!editContact
                ? <button style={btnEdit} onClick={() => setEditContact(true)}>Modifier</button>
                : <div><button style={btnCancel} onClick={() => setEditContact(false)}>Annuler</button><button style={btnSave} onClick={sauvegarderEntreprise} disabled={saving}>{saving ? '...' : 'Enregistrer'}</button></div>
              }
            </div>
            <div style={{ padding: '18px 22px' }}>
              {!editContact ? (
                <>
                  {[
                    ['Email', formEntreprise.email_contact || user?.email || '—'],
                    ['Téléphone', formEntreprise.telephone || '—'],
                    ['Site web', formEntreprise.site_web || '—'],
                    ['Nom contact', formEntreprise.contact_nom || '—'],
                    ['Prénom contact', formEntreprise.contact_prenom || '—'],
                    ['Fonction', formEntreprise.contact_fonction || '—'],
                  ].map(([l, v]) => (
                    <div key={l} style={rowStyle}><span style={lblStyle}>{l}</span><span style={valStyle}>{v}</span></div>
                  ))}
                </>
              ) : (
                <>
                  <div style={fieldStyle}><label style={labelStyle}>Email contact</label><input style={inputStyle} value={formEntreprise.email_contact} onChange={e => setFormEntreprise(p => ({ ...p, email_contact: e.target.value }))} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>Téléphone</label><input style={inputStyle} value={formEntreprise.telephone} onChange={e => setFormEntreprise(p => ({ ...p, telephone: e.target.value }))} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>Site web</label><input style={inputStyle} value={formEntreprise.site_web} onChange={e => setFormEntreprise(p => ({ ...p, site_web: e.target.value }))} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fieldStyle}><label style={labelStyle}>Nom contact</label><input style={inputStyle} value={formEntreprise.contact_nom} onChange={e => setFormEntreprise(p => ({ ...p, contact_nom: e.target.value }))} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>Prénom contact</label><input style={inputStyle} value={formEntreprise.contact_prenom} onChange={e => setFormEntreprise(p => ({ ...p, contact_prenom: e.target.value }))} /></div>
                  </div>
                  <div style={fieldStyle}><label style={labelStyle}>Fonction</label><input style={inputStyle} value={formEntreprise.contact_fonction} onChange={e => setFormEntreprise(p => ({ ...p, contact_fonction: e.target.value }))} /></div>
                </>
              )}
            </div>
          </div>

          {/* Profil personnel */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span>Mon profil personnel</span>
              {!editContact
                ? <button style={btnEdit} onClick={() => setEditContact(true)}>Modifier</button>
                : <div><button style={btnCancel} onClick={() => setEditContact(false)}>Annuler</button><button style={btnSave} onClick={sauvegarderProfil} disabled={saving}>{saving ? '...' : 'Enregistrer'}</button></div>
              }
            </div>
            <div style={{ padding: '18px 22px' }}>
              {!editContact ? (
                <>
                  {[
                    ['Prénom', formProfil.prenom || '—'],
                    ['Nom', formProfil.nom || '—'],
                    ['Téléphone', formProfil.telephone || '—'],
                    ['Email', user?.email || '—'],
                  ].map(([l, v]) => (
                    <div key={l} style={rowStyle}><span style={lblStyle}>{l}</span><span style={valStyle}>{v}</span></div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={fieldStyle}><label style={labelStyle}>Prénom</label><input style={inputStyle} value={formProfil.prenom} onChange={e => setFormProfil(p => ({ ...p, prenom: e.target.value }))} /></div>
                    <div style={fieldStyle}><label style={labelStyle}>Nom</label><input style={inputStyle} value={formProfil.nom} onChange={e => setFormProfil(p => ({ ...p, nom: e.target.value }))} /></div>
                  </div>
                  <div style={fieldStyle}><label style={labelStyle}>Téléphone</label><input style={inputStyle} value={formProfil.telephone} onChange={e => setFormProfil(p => ({ ...p, telephone: e.target.value }))} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>Email (non modifiable)</label><input style={{ ...inputStyle, background: '#f5f3ef', color: '#8b7355' }} value={user?.email ?? ''} disabled /></div>
                </>
              )}
            </div>
          </div>

          {/* Certifications */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}><span>Certifications ({certifications?.length ?? 0})</span></div>
            <div style={{ padding: '14px 18px' }}>
              {!certifications || certifications.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>Aucune certification enregistrée</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {certifications.map((c, i) => (
                    <span key={i} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.valide ? '#d1fae5' : '#fee2e2', color: c.valide ? '#065f46' : '#991b1b' }}>
                      {c.valide ? '✓' : '✕'} {c.label} — {c.date_expiration}
                    </span>
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
          <div style={{ fontSize: 14, fontWeight: 700, color: '#8b3a3a', marginBottom: 4 }}>Supprimer mon compte</div>
          <div style={{ fontSize: 12, color: '#8b7355' }}>Cette action est irréversible. Toutes vos données seront supprimées conformément au RGPD.</div>
        </div>
        <a href="/profil/supprimer" style={{ padding: '8px 16px', borderRadius: 4, border: '1.5px solid #8b3a3a', background: '#fff', color: '#8b3a3a', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' }}>
          Supprimer mon compte
        </a>
      </div>
    </div>
  )
}
