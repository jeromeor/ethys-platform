'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

interface Entreprise { id: string; nom: string; type: string; pays?: string | null }

interface AccordCommercial {
  id: string
  entreprise_id: string
  prix_base_kg: number
  remise_volume_annuel_pct: number
  seuil_volume_annuel_tonnes: number
  date_debut: string
  date_fin: string | null
  notes: string | null
  entreprise: { nom: string } | null
}

interface Props {
  accords: AccordCommercial[]
  setAccords: React.Dispatch<React.SetStateAction<AccordCommercial[]>>
  entreprises: Entreprise[]
  user: { id: string }
}

export default function AccordsCommerciaux({ accords, setAccords, entreprises, user }: Props) {
  const t = useTranslations('facturation')
  const supabase = createClient()
  const [showAccordForm, setShowAccordForm] = useState(false)
  const [accordForm, setAccordForm] = useState({
    entreprise_id: '', prix_base_kg: '', remise_volume_annuel_pct: '',
    seuil_volume_annuel_tonnes: '', date_fin: '', notes: ''
  })

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '16px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{t('accords.titre')}</div>
        <button onClick={() => setShowAccordForm(true)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ {t('boutons.nouvelAccord')}</button>
      </div>
      {accords.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b7355', fontSize: 13 }}>{t('accords.aucun')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {accords.map(a => (
            <div key={a.id} style={{ background: '#fff', borderRadius: 6, border: '1px solid #e8e3d8', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{a.entreprise?.nom ?? '-'}</div>
                  <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>
                    {t('accords.du', { debut: new Date(a.date_debut).toLocaleDateString('fr-FR') })}
                    {a.date_fin ? ' ' + t('accords.auDate', { fin: new Date(a.date_fin).toLocaleDateString('fr-FR') }) : ' ' + t('accords.illimite')}
                  </div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#f0f4ec', color: '#2d5016' }}>{t('accords.actif')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F0FDF4' }}>
                  <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 2 }}>{t('accords.prixNegocieKg')}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>{Number(a.prix_base_kg).toFixed(4)}€</div>
                  <div style={{ fontSize: 10, color: '#8b7355' }}>{t('accords.base', { prix: '0.60' })}</div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fdf8ec' }}>
                  <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 2 }}>{t('accords.remiseVolumeAnnuel')}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#b8860b' }}>{a.remise_volume_annuel_pct}%</div>
                  <div style={{ fontSize: 10, color: '#8b7355' }}>{t('accords.desSeuil', { seuil: a.seuil_volume_annuel_tonnes })}</div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f5f3ef' }}>
                  <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 2 }}>{t('accords.remisePalierCommande')}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4a5568' }}>{t('accords.remisePalierDetail')}</div>
                  <div style={{ fontSize: 10, color: '#8b7355' }}>{t('accords.standardEthys')}</div>
                </div>
              </div>
              {a.notes && <div style={{ fontSize: 11, color: '#4a5568', marginTop: 10, fontStyle: 'italic', padding: '8px 10px', borderRadius: 6, background: '#f5f3ef' }}>{a.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Modal nouvel accord */}
      {showAccordForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowAccordForm(false)}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '28px 32px', width: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{t('formAccord.titre')}</span>
              <button onClick={() => setShowAccordForm(false)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>x</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formAccord.marque')}</label>
              <select value={accordForm.entreprise_id} onChange={e => setAccordForm(f => ({ ...f, entreprise_id: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }}>
                <option value="">{t('formAccord.selectMarque')}</option>
                {entreprises.filter(e => e.type === 'marque').map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formAccord.prixNegocie')}</label>
                <input type="number" step="0.0001" value={accordForm.prix_base_kg} onChange={e => setAccordForm(f => ({ ...f, prix_base_kg: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formAccord.remiseAnnuelle')}</label>
                <input type="number" step="0.01" value={accordForm.remise_volume_annuel_pct} onChange={e => setAccordForm(f => ({ ...f, remise_volume_annuel_pct: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formAccord.seuilVolume')}</label>
                <input type="number" value={accordForm.seuil_volume_annuel_tonnes} onChange={e => setAccordForm(f => ({ ...f, seuil_volume_annuel_tonnes: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formAccord.dateFin')}</label>
                <input type="date" value={accordForm.date_fin} onChange={e => setAccordForm(f => ({ ...f, date_fin: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('formAccord.notes')}</label>
              <textarea value={accordForm.notes} onChange={e => setAccordForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', resize: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <button onClick={async () => {
              if (!accordForm.entreprise_id || !accordForm.prix_base_kg) return
              const { data, error } = await supabase.from('accords_commerciaux').insert({
                entreprise_id: accordForm.entreprise_id,
                prix_base_kg: parseFloat(accordForm.prix_base_kg),
                remise_volume_annuel_pct: parseFloat(accordForm.remise_volume_annuel_pct) || 0,
                seuil_volume_annuel_tonnes: parseFloat(accordForm.seuil_volume_annuel_tonnes) || 0,
                date_debut: new Date().toISOString().split('T')[0],
                date_fin: accordForm.date_fin || null,
                notes: accordForm.notes || null,
                created_by: user.id
              }).select('*, entreprise:entreprises(nom)').single()
              if (!error && data) {
                setAccords(prev => [data as AccordCommercial, ...prev])
                setShowAccordForm(false)
              }
            }} style={{ width: '100%', padding: '11px', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('formAccord.enregistrer')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
