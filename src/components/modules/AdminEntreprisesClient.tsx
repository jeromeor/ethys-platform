'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Entreprise {
  id: string
  nom: string
  type: string
  statut: string
  ville: string | null
  pays: string | null
  siret: string | null
  tva: string | null
  email_contact: string | null
  telephone: string | null
  site_web: string | null
  adresse_rue: string | null
  code_postal: string | null
  created_at: string
}

interface Props {
  entreprises: Entreprise[]
}

const TYPE_COLORS: Record<string, [string, string]> = {
  marque:           ['#DBEAFE', '#1E40AF'],
  filature:         ['#f0f4ec', '#2d5016'],
  fournisseur_coton:['#fdf8ec', '#b8860b'],
  autre:            ['#f5f3ef', '#4a5568'],
}

const TYPE_LABELS: Record<string, string> = {
  marque:            'Marque',
  filature:          'Filature',
  fournisseur_coton: 'Fournisseur coton',
  autre:             'Autre',
}

const STATUT_COLORS: Record<string, [string, string]> = {
  actif:    ['#f0f4ec', '#2d5016'],
  inactif:  ['#f5f3ef', '#8b7355'],
  verifie:  ['#f0f4ec', '#2d5016'],
  en_cours: ['#fdf8ec', '#b8860b'],
}

const FORM_VIDE = {
  nom: '', type: 'marque', statut: 'actif',
  ville: '', pays: '', siret: '', tva: '',
  email_contact: '', telephone: '', site_web: '',
  adresse_rue: '', code_postal: '',
}

export default function AdminEntreprisesClient({ entreprises: initial }: Props) {
  const supabase = createClient()
  const [entreprises, setEntreprises] = useState<Entreprise[]>(initial)
  const [filterType, setFilterType] = useState('tous')
  const [filterSearch, setFilterSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Entreprise | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Entreprise | null>(null)
  const [deleteConfirm1, setDeleteConfirm1] = useState(false)
  const [deleteConfirm2, setDeleteConfirm2] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ ...FORM_VIDE })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const filtrees = entreprises.filter(e => {
    if (filterType !== 'tous' && e.type !== filterType) return false
    if (filterSearch && !e.nom.toLowerCase().includes(filterSearch.toLowerCase())) return false
    return true
  })

  const ouvrirCreation = () => {
    setEditTarget(null)
    setForm({ ...FORM_VIDE })
    setShowForm(true)
  }

  const ouvrirModification = (e: Entreprise) => {
    setEditTarget(e)
    setForm({
      nom: e.nom ?? '',
      type: e.type ?? 'marque',
      statut: e.statut ?? 'actif',
      ville: e.ville ?? '',
      pays: e.pays ?? '',
      siret: e.siret ?? '',
      tva: e.tva ?? '',
      email_contact: e.email_contact ?? '',
      telephone: e.telephone ?? '',
      site_web: e.site_web ?? '',
      adresse_rue: e.adresse_rue ?? '',
      code_postal: e.code_postal ?? '',
    })
    setShowForm(true)
  }

  const sauvegarder = async () => {
    if (!form.nom) return
    setSaving(true)
    if (editTarget) {
      const { data, error } = await supabase
        .from('entreprises')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', editTarget.id)
        .select()
        .single()
      if (!error && data) {
        setEntreprises(prev => prev.map(e => e.id === editTarget.id ? data as Entreprise : e))
        setMessage('Entreprise mise a jour')
      }
    } else {
      const { data, error } = await supabase
        .from('entreprises')
        .insert({ ...form })
        .select()
        .single()
      if (!error && data) {
        setEntreprises(prev => [data as Entreprise, ...prev])
        setMessage('Entreprise creee')
      }
    }
    setSaving(false)
    setShowForm(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const initierSuppression = (e: Entreprise) => {
    setDeleteTarget(e)
    setDeleteConfirm1(false)
    setDeleteConfirm2(false)
  }

  const confirmerSuppression = async () => {
    if (!deleteTarget || !deleteConfirm1 || !deleteConfirm2) return
    const { error } = await supabase.from('entreprises').delete().eq('id', deleteTarget.id)
    if (!error) {
      setEntreprises(prev => prev.filter(e => e.id !== deleteTarget.id))
      setMessage('Entreprise supprimee')
      setTimeout(() => setMessage(''), 3000)
    }
    setDeleteTarget(null)
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 6,
    border: '1.5px solid #d4c5b0', fontSize: 12,
    boxSizing: 'border-box' as const, outline: 'none', background: '#faf9f7',
  }
  const labelStyle = { fontSize: 11, color: '#8b7355', fontWeight: 600, display: 'block' as const, marginBottom: 4 }
  const fieldStyle = { marginBottom: 12 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {message && (
        <div style={{ position: 'fixed', top: 20, right: 28, background: '#2d5016', color: '#fff', padding: '10px 20px', borderRadius: 6, fontSize: 12, fontWeight: 700, zIndex: 999 }}>
          {'OK ' + message}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '12px 22px', flexShrink: 0 }}>
        {[
          { label: 'Total entreprises', value: '' + entreprises.length },
          { label: 'Marques', value: '' + entreprises.filter(e => e.type === 'marque').length },
          { label: 'Filatures', value: '' + entreprises.filter(e => e.type === 'filature').length },
          { label: 'Fournisseurs', value: '' + entreprises.filter(e => e.type === 'fournisseur_coton').length },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 6, border: '1px solid #e8e3d8', padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 2, textTransform: 'uppercase' }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Barre outils */}
      <div style={{ padding: '10px 22px', background: '#fff', borderBottom: '1px solid #e8e3d8', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <input
          type="text"
          placeholder="Rechercher une entreprise..."
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', width: 220 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['tous', 'marque', 'filature', 'fournisseur_coton'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '5px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: filterType === t ? 700 : 500,
              background: filterType === t ? '#1a1a1a' : '#f5f3ef',
              color: filterType === t ? '#fff' : '#4a5568'
            }}>
              {t === 'tous' ? 'Toutes' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={ouvrirCreation} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          + Nouvelle entreprise
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>
        {filtrees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#8b7355', fontSize: 13 }}>Aucune entreprise</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f3ef' }}>
                  {['Nom', 'Type', 'Ville', 'Pays', 'Email', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#8b7355', textAlign: 'left', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrees.map((e, i) => {
                  const [tbg, ttc] = TYPE_COLORS[e.type] ?? ['#f5f3ef', '#4a5568']
                  const [sbg, stc] = STATUT_COLORS[e.statut] ?? ['#f5f3ef', '#8b7355']
                  return (
                    <tr key={i}
                      style={{ borderTop: '1px solid #f5f3ef' }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = '#f5f3ef'}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{e.nom}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: tbg, color: ttc }}>{TYPE_LABELS[e.type] ?? e.type}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#4a5568' }}>{e.ville ?? '-'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#4a5568' }}>{e.pays ?? '-'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#4a5568' }}>{e.email_contact ?? '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: sbg, color: stc }}>{e.statut}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => ouvrirModification(e)} style={{ padding: '4px 10px', borderRadius: 6, border: '1.5px solid #e8e3d8', background: '#f5f3ef', fontSize: 11, cursor: 'pointer', color: '#4a5568' }}>
                            Modifier
                          </button>
                          <button onClick={() => initierSuppression(e)} style={{ padding: '4px 10px', borderRadius: 6, border: '1.5px solid #fde8e8', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#8b3a3a' }}>
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal creation / modification */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }} onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 26px', borderBottom: '1px solid #f5f3ef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{editTarget ? 'Modifier ' + editTarget.nom : 'Nouvelle entreprise'}</span>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>x</button>
            </div>
            <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 4 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Nom *</label>
                  <input style={inputStyle} value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Nom de l'entreprise" />
                </div>
                <div>
                  <label style={labelStyle}>Type *</label>
                  <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
                    <option value="marque">Marque</option>
                    <option value="filature">Filature</option>
                    <option value="fournisseur_coton">Fournisseur coton</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>SIRET</label>
                  <input style={inputStyle} value={form.siret} onChange={e => set('siret', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>TVA intracommunautaire</label>
                  <input style={inputStyle} value={form.tva} onChange={e => set('tva', e.target.value)} />
                </div>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Adresse</label>
                <input style={inputStyle} value={form.adresse_rue} onChange={e => set('adresse_rue', e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Code postal</label>
                  <input style={inputStyle} value={form.code_postal} onChange={e => set('code_postal', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input style={inputStyle} value={form.ville} onChange={e => set('ville', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Pays</label>
                  <input style={inputStyle} value={form.pays} onChange={e => set('pays', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Email contact</label>
                  <input style={inputStyle} value={form.email_contact} onChange={e => set('email_contact', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Telephone</label>
                  <input style={inputStyle} value={form.telephone} onChange={e => set('telephone', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Site web</label>
                  <input style={inputStyle} value={form.site_web} onChange={e => set('site_web', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Statut</label>
                  <select style={inputStyle} value={form.statut} onChange={e => set('statut', e.target.value)}>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="verifie">Verifie</option>
                    <option value="en_cours">En cours</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#8b7355', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button onClick={sauvegarder} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: saving ? '#d4c5b0' : '#1a1a1a', color: saving ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                  {saving ? 'Enregistrement...' : (editTarget ? 'Enregistrer les modifications' : 'Creer l\'entreprise')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression double confirmation */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }} onClick={() => setDeleteTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 26px', borderBottom: '1px solid #fde8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#8b3a3a' }}>Supprimer une entreprise</span>
              <button onClick={() => setDeleteTarget(null)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>x</button>
            </div>
            <div style={{ padding: '20px 26px' }}>
              <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fdf0f0', border: '1px solid #c8a0a0', fontSize: 13, color: '#8b3a3a', fontWeight: 600, marginBottom: 20 }}>
                {'Vous allez supprimer : ' + deleteTarget.nom}
              </div>
              <div style={{ fontSize: 12, color: '#4a5568', marginBottom: 16 }}>
                Cette action est irreversible. Les utilisateurs associes a cette entreprise perdront leur association. Veuillez confirmer deux fois.
              </div>

              <div onClick={() => setDeleteConfirm1(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8, border: '1.5px solid ' + (deleteConfirm1 ? '#8b3a3a' : '#e8e3d8'), background: deleteConfirm1 ? '#fdf0f0' : '#f5f3ef', cursor: 'pointer', marginBottom: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid ' + (deleteConfirm1 ? '#8b3a3a' : '#d4c5b0'), background: deleteConfirm1 ? '#8b3a3a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {deleteConfirm1 && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>x</span>}
                </div>
                <span style={{ fontSize: 12, color: '#4a5568' }}>Je confirme vouloir supprimer cette entreprise</span>
              </div>

              <div onClick={() => setDeleteConfirm2(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8, border: '1.5px solid ' + (deleteConfirm2 ? '#8b3a3a' : '#e8e3d8'), background: deleteConfirm2 ? '#fdf0f0' : '#f5f3ef', cursor: 'pointer', marginBottom: 20 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid ' + (deleteConfirm2 ? '#8b3a3a' : '#d4c5b0'), background: deleteConfirm2 ? '#8b3a3a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {deleteConfirm2 && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>x</span>}
                </div>
                <span style={{ fontSize: 12, color: '#4a5568' }}>Je comprends que cette action est irreversible</span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#8b7355', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button onClick={confirmerSuppression} disabled={!deleteConfirm1 || !deleteConfirm2} style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: (!deleteConfirm1 || !deleteConfirm2) ? '#d4c5b0' : '#8b3a3a', color: (!deleteConfirm1 || !deleteConfirm2) ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: (!deleteConfirm1 || !deleteConfirm2) ? 'default' : 'pointer' }}>
                  Supprimer definitivement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
