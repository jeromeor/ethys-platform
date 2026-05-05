'use client'

import { useState, useMemo } from 'react'

const INDICATIFS: Record<string, string> = {
  'France': '+33', 'Turquie': '+90', 'Maroc': '+212',
  'Portugal': '+351', 'Espagne': '+34', 'Italie': '+39',
  'Tunisie': '+216', 'Bangladesh': '+880', 'Inde': '+91',
  'Allemagne': '+49', 'Belgique': '+32', 'Pays-Bas': '+31',
  'Royaume-Uni': '+44', 'Suisse': '+41', 'Chine': '+86',
}

const certColors: Record<string, [string, string]> = {
  GOTS: ['#D1FAE5', '#065F46'], GRS: ['#DBEAFE', '#1E40AF'],
  'OCS 100': ['#FEF3C7', '#92400E'], BCI: ['#F3E8FF', '#6B21A8'],
  'ISO 14001': ['#F1F5F9', '#475569'], ETHYS: ['#D1FAE5', '#065F46'],
}

const typeColors: Record<string, [string, string]> = {
  marque: ['#DBEAFE', '#1E40AF'],
  filature: ['#D1FAE5', '#065F46'],
  fournisseur_coton: ['#FEF3C7', '#92400E'],
}

const typeLabels: Record<string, string> = {
  marque: 'Marque', filature: 'Filature', fournisseur_coton: 'Fournisseur',
}

interface Partenaire {
  id: string; nom: string; type: string; statut: string; pays: string; ville: string
  adresse: string | null; adresse_rue: string | null; code_postal: string | null
  description: string | null; capacite_annuelle_tonnes: number | null
  email_contact: string | null; telephone: string | null; telephone_indicatif: string | null
  site_web: string | null; contact_nom: string | null; contact_prenom: string | null
  contact_fonction: string | null; contact_visible: boolean
  certifications: { label: string; valide: boolean }[]
  notations: { note_moyenne: number }[]
}

interface Props {
  partenaires: Partenaire[]
  paysList: string[]
  userRole: string
}

export default function AnnuaireClient({ partenaires, paysList, userRole }: Props) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('Tous')
  const [filterPays, setFilterPays] = useState('Tous')
  const [selected, setSelected] = useState<Partenaire | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Partenaire>>({})

  const filtered = useMemo(() => partenaires.filter(p => {
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase()) && !p.ville?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType !== 'Tous' && p.type !== filterType) return false
    if (filterPays !== 'Tous' && p.pays !== filterPays) return false
    return true
  }), [partenaires, search, filterType, filterPays])

  const noteMoyenne = (p: Partenaire) => {
    if (!p.notations?.length) return null
    return (p.notations.reduce((s, n) => s + n.note_moyenne, 0) / p.notations.length).toFixed(1)
  }

  const ouvrirEdition = (p: Partenaire) => {
    setForm({
      adresse_rue: p.adresse_rue ?? '',
      code_postal: p.code_postal ?? '',
      telephone: p.telephone ?? '',
      telephone_indicatif: p.telephone_indicatif ?? INDICATIFS[p.pays] ?? '+33',
      site_web: p.site_web ?? '',
      email_contact: p.email_contact ?? '',
      contact_nom: p.contact_nom ?? '',
      contact_prenom: p.contact_prenom ?? '',
      contact_fonction: p.contact_fonction ?? '',
      contact_visible: p.contact_visible ?? false,
    })
    setEditMode(true)
  }

  const sauvegarder = async () => {
    if (!selected) return
    setSaving(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('entreprises').update({
      adresse_rue: form.adresse_rue || null,
      code_postal: form.code_postal || null,
      telephone: form.telephone || null,
      telephone_indicatif: form.telephone_indicatif || null,
      site_web: form.site_web || null,
      email_contact: form.email_contact || null,
      contact_nom: form.contact_nom || null,
      contact_prenom: form.contact_prenom || null,
      contact_fonction: form.contact_fonction || null,
      contact_visible: form.contact_visible ?? false,
    }).eq('id', selected.id)
    setSaving(false)
    setEditMode(false)
    window.location.reload()
  }

  const afficherContact = (p: Partenaire) => userRole === 'admin' || p.contact_visible

  const inputStyle = {
    width: '100%', padding: '7px 10px', borderRadius: 8,
    border: '1.5px solid #E2E8F0', fontSize: 12,
    boxSizing: 'border-box' as const, outline: 'none', color: '#1A202C'
  }

  const contacter = (p: Partenaire) => {
    if (!p.email_contact) return
    window.location.href = `mailto:${p.email_contact}?cc=contact@textile-loop.fr&subject=Contact via plateforme ETHYS - ${p.nom}&body=Bonjour,%0D%0A%0D%0AJe vous contacte via la plateforme ETHYS de TEXTILE LOOP.%0D%0A%0D%0ACordialement`
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      <div style={{ width: 220, minWidth: 220, background: '#fff', borderRight: '1px solid #EEF0F3', padding: '16px 14px', overflowY: 'auto' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, ville..." style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, boxSizing: 'border-box', outline: 'none', color: '#1A202C', marginBottom: 16 }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' }}>Type</div>
        {['Tous', 'marque', 'filature', 'fournisseur_coton'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, marginBottom: 2, background: filterType === t ? '#D1FAE5' : 'transparent', color: filterType === t ? '#065F46' : '#64748B', fontWeight: filterType === t ? 700 : 400 }}>
            {t === 'Tous' ? 'Tous' : typeLabels[t] ?? t}
          </button>
        ))}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', margin: '14px 0 6px', textTransform: 'uppercase' }}>Pays</div>
        <select value={filterPays} onChange={e => setFilterPays(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, background: '#F8FAFC', outline: 'none', marginBottom: 12 }}>
          <option>Tous</option>
          {paysList.map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ fontSize: 11, color: '#94A3B8' }}><span style={{ fontWeight: 700, color: '#0A3D26' }}>{filtered.length}</span> resultat(s)</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 18px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Aucun partenaire trouve</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr' : '1fr 1fr', gap: 12 }}>
            {filtered.map(p => {
              const [tbg, ttc] = typeColors[p.type] ?? ['#F1F5F9', '#475569']
              const note = noteMoyenne(p)
              return (
                <div key={p.id} onClick={() => { setSelected(p); setEditMode(false) }} style={{ background: '#fff', borderRadius: 12, border: `2px solid ${selected?.id === p.id ? '#0A3D26' : '#EEF0F3'}`, padding: '14px 16px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A202C' }}>{p.nom}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.ville}, {p.pays}</div>
                    </div>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: p.statut === 'verifie' ? '#D1FAE5' : '#FEF3C7', color: p.statut === 'verifie' ? '#065F46' : '#92400E', height: 'fit-content' }}>
                      {p.statut === 'verifie' ? 'Verifie' : 'En cours'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: tbg, color: ttc }}>{typeLabels[p.type] ?? p.type}</span>
                    {p.certifications?.filter(c => c.valide).slice(0, 3).map(c => {
                      const [bg, tc] = certColors[c.label] ?? ['#F1F5F9', '#475569']
                      return <span key={c.label} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: bg, color: tc }}>{c.label}</span>
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    {note ? <span style={{ color: '#F59E0B', fontWeight: 700 }}>★ {note}</span> : <span style={{ color: '#CBD5E1' }}>Non note</span>}
                    {p.capacite_annuelle_tonnes && <span style={{ color: '#64748B' }}>{p.capacite_annuelle_tonnes}T/an</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selected && (
        <div style={{ width: 320, minWidth: 320, background: '#fff', borderLeft: '1px solid #EEF0F3', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#0A3D26' }}>Fiche partenaire</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {userRole === 'admin' && !editMode && (
                <button onClick={() => ouvrirEdition(selected)} style={{ padding: '4px 10px', borderRadius: 7, border: '1.5px solid #EEF0F3', background: '#F8FAFC', fontSize: 11, cursor: 'pointer', color: '#475569' }}>Modifier</button>
              )}
              <button onClick={() => { setSelected(null); setEditMode(false) }} style={{ border: 'none', background: 'none', fontSize: 16, color: '#94A3B8', cursor: 'pointer' }}>x</button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '18px' }}>
            {!editMode ? (
              <>
                <div style={{ background: 'linear-gradient(135deg,#0A3D26,#0D5C3A)', borderRadius: 12, padding: '18px', marginBottom: 14, color: '#fff' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{selected.nom}</div>
                  <div style={{ fontSize: 11, opacity: 0.75 }}>{typeLabels[selected.type] ?? selected.type} · {selected.ville}, {selected.pays}</div>
                  {selected.capacite_annuelle_tonnes && (
                    <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#6EE7B7' }}>{selected.capacite_annuelle_tonnes}T</div>
                      <div style={{ fontSize: 10, opacity: 0.65 }}>Capacite annuelle</div>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0A3D26', marginBottom: 8, textTransform: 'uppercase' }}>Adresse</div>
                  {selected.adresse_rue && <div style={{ fontSize: 12, color: '#475569', marginBottom: 2 }}>{selected.adresse_rue}</div>}
                  {(selected.code_postal || selected.ville) && <div style={{ fontSize: 12, color: '#475569', marginBottom: 2 }}>{selected.code_postal} {selected.ville}</div>}
                  <div style={{ fontSize: 12, color: '#475569' }}>{selected.pays}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0A3D26', marginBottom: 8, textTransform: 'uppercase' }}>Contact</div>
                  {selected.email_contact && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#94A3B8', width: 60, flexShrink: 0 }}>Email</span>
                      <a href={`mailto:${selected.email_contact}`} style={{ fontSize: 12, color: '#0A3D26', fontWeight: 600, textDecoration: 'none' }}>{selected.email_contact}</a>
                    </div>
                  )}
                  {selected.telephone && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#94A3B8', width: 60, flexShrink: 0 }}>Tel</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{selected.telephone_indicatif} {selected.telephone}</span>
                    </div>
                  )}
                  {selected.site_web && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#94A3B8', width: 60, flexShrink: 0 }}>Web</span>
                      <a href={selected.site_web.startsWith('http') ? selected.site_web : `https://${selected.site_web}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0A3D26', fontWeight: 600, textDecoration: 'none' }}>{selected.site_web}</a>
                    </div>
                  )}
                </div>

                {afficherContact(selected) && (selected.contact_nom || selected.contact_prenom) && (
                  <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #A7F3D0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', marginBottom: 6, textTransform: 'uppercase' }}>
                      Personne de contact
                      {!selected.contact_visible && userRole === 'admin' && (
                        <span style={{ fontSize: 9, background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: 10, marginLeft: 6 }}>Admin uniquement</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>{selected.contact_prenom} {selected.contact_nom}</div>
                    {selected.contact_fonction && <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{selected.contact_fonction}</div>}
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0A3D26', marginBottom: 8, textTransform: 'uppercase' }}>Certifications</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {!selected.certifications?.length ? (
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>Aucune certification</span>
                    ) : selected.certifications.filter(c => c.valide).map(c => {
                      const [bg, tc] = certColors[c.label] ?? ['#F1F5F9', '#475569']
                      return <span key={c.label} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color: tc }}>v {c.label}</span>
                    })}
                  </div>
                </div>

                {selected.description && <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>{selected.description}</p>}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 4 }}>Modifier la fiche</div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Adresse (rue)</label>
                  <input value={form.adresse_rue ?? ''} onChange={e => setForm(f => ({ ...f, adresse_rue: e.target.value }))} style={inputStyle} placeholder="12 rue de la Paix" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Code postal</label>
                    <input value={form.code_postal ?? ''} onChange={e => setForm(f => ({ ...f, code_postal: e.target.value }))} style={inputStyle} placeholder="75001" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Email contact</label>
                    <input type="email" value={form.email_contact ?? ''} onChange={e => setForm(f => ({ ...f, email_contact: e.target.value }))} style={inputStyle} placeholder="contact@entreprise.com" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Telephone</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select value={form.telephone_indicatif ?? '+33'} onChange={e => setForm(f => ({ ...f, telephone_indicatif: e.target.value }))} style={{ ...inputStyle, width: 110, flexShrink: 0 }}>
                      {Object.entries(INDICATIFS).map(([pays, ind]) => (
                        <option key={pays} value={ind}>{ind} {pays}</option>
                      ))}
                    </select>
                    <input value={form.telephone ?? ''} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} placeholder="06 12 34 56 78" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Site web</label>
                  <input value={form.site_web ?? ''} onChange={e => setForm(f => ({ ...f, site_web: e.target.value }))} style={inputStyle} placeholder="www.entreprise.com" />
                </div>
                <div style={{ padding: '12px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #EEF0F3' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0A3D26', marginBottom: 10, textTransform: 'uppercase' }}>Personne de contact</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Prenom</label>
                      <input value={form.contact_prenom ?? ''} onChange={e => setForm(f => ({ ...f, contact_prenom: e.target.value }))} style={inputStyle} placeholder="Marie" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Nom</label>
                      <input value={form.contact_nom ?? ''} onChange={e => setForm(f => ({ ...f, contact_nom: e.target.value }))} style={inputStyle} placeholder="Dupont" />
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Fonction</label>
                    <input value={form.contact_fonction ?? ''} onChange={e => setForm(f => ({ ...f, contact_fonction: e.target.value }))} style={inputStyle} placeholder="Directeur commercial" />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.contact_visible ?? false} onChange={e => setForm(f => ({ ...f, contact_visible: e.target.checked }))} style={{ accentColor: '#0A3D26', width: 14, height: 14 }} />
                    <span style={{ fontSize: 12, color: '#475569' }}>Rendre ce contact visible par tous les utilisateurs</span>
                  </label>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>Si non coche, visible uniquement par les administrateurs.</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid #EEF0F3', background: '#F8FAFC', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
                  <button onClick={sauvegarder} disabled={saving} style={{ flex: 2, padding: '8px', borderRadius: 8, border: 'none', background: saving ? '#E2E8F0' : '#0A3D26', color: saving ? '#94A3B8' : '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {!editMode && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid #F1F5F9' }}>
              <button
                onClick={() => contacter(selected)}
                style={{ width: '100%', padding: '9px', borderRadius: 10, border: 'none', background: selected.email_contact ? '#0A3D26' : '#E2E8F0', color: selected.email_contact ? '#fff' : '#94A3B8', fontSize: 12, fontWeight: 700, cursor: selected.email_contact ? 'pointer' : 'default' }}
              >
                {selected.email_contact ? 'Contacter' : 'Pas de contact disponible'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
