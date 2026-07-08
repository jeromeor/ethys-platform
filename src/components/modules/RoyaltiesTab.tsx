'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

interface Entreprise {
  id: string
  nom: string
  type: string
}

interface Royalty {
  id: string
  facture_id: string
  filature_id: string
  marque_id: string
  montant_ht_facture: number
  taux_royalty: number
  montant_royalty: number
  interets_retard: number
  montant_total_du: number
  statut: string
  date_facture: string
  date_encaissement: string | null
  date_echeance: string | null
  date_limite_contestation: string | null
  created_at: string
  filature: { nom: string } | null
  marque: { nom: string } | null
  facture: { reference: string } | null
}

interface Props {
  royalties: Royalty[]
  entreprises: Entreprise[]
}

export default function RoyaltiesTab({ royalties, entreprises }: Props) {
  const t = useTranslations('admin')
  const supabase = createClient()
  const [royaltyFiltre, setRoyaltyFiltre] = useState('')
  const [royaltyDateDebut, setRoyaltyDateDebut] = useState('')
  const [royaltyDateFin, setRoyaltyDateFin] = useState('')
  const [exportingRoyalties, setExportingRoyalties] = useState(false)

  const exportRoyaltiesExcel = async () => {
    setExportingRoyalties(true)
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs' as any)

      const royaltiesFiltrees = royalties.filter(r =>
        !royaltyFiltre || r.filature?.nom?.toLowerCase().includes(royaltyFiltre.toLowerCase())
      )

      const lignes = royaltiesFiltrees.map(r => ({
        [t('xlsRefFacture')]:        r.facture?.reference ?? '-',
        [t('xlsFilature')]:          r.filature?.nom ?? '-',
        [t('xlsMarque')]:            r.marque?.nom ?? '-',
        [t('xlsDateFacture')]:       r.date_facture ?? '-',
        [t('xlsDateEncaissement')]:  r.date_encaissement ?? '-',
        [t('xlsDateEcheance')]:      r.date_echeance ?? '-',
        [t('xlsMontantHT')]:         Number(r.montant_ht_facture),
        [t('xlsTauxRoyalty')]:       '1%',
        [t('xlsMontantRoyalty')]:    Number(r.montant_royalty),
        [t('xlsInterets')]:          Number(r.interets_retard),
        [t('xlsTotalDu')]:           Number(r.montant_total_du),
        [t('xlsStatut')]:            r.statut,
      }))

      const cumuls = Object.values(
        royaltiesFiltrees.reduce((acc, r) => {
          const nom = r.filature?.nom ?? t('inconnu')
          if (!acc[nom]) acc[nom] = { filature: nom, total_royalty: 0, total_du: 0, nb: 0 }
          acc[nom].total_royalty += Number(r.montant_royalty)
          acc[nom].total_du     += Number(r.montant_total_du)
          acc[nom].nb           += 1
          return acc
        }, {} as Record<string, { filature: string; total_royalty: number; total_du: number; nb: number }>)
      ).map(c => ({
        [t('xlsFilature')]:          c.filature,
        [t('xlsNbReleves')]:         c.nb,
        [t('xlsTotalRoyalties')]:    c.total_royalty,
        [t('xlsTotalDuInterets')]:   c.total_du,
      }))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lignes),  t('xlsSheetDetail'))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cumuls), t('xlsSheetCumul'))
      XLSX.writeFile(wb, `royalties_filatures_${new Date().toISOString().slice(0,10)}.xlsx`)
    } catch (e) {
      alert(t('erreurExportExcel'))
    }
    setExportingRoyalties(false)
  }

  const marquerRoyaltyPayee = async (id: string) => {
    await supabase.from('royalties_filatures').update({ statut: 'payé' }).eq('id', id)
    window.location.reload()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <select
          value={royaltyFiltre}
          onChange={e => setRoyaltyFiltre(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none', minWidth: 200 }}
        >
          <option value="">{t('toutes')}</option>
          {entreprises
            .filter(e => e.type === 'filature')
            .sort((a, b) => a.nom.localeCompare(b.nom))
            .map(e => <option key={e.id} value={e.nom}>{e.nom}</option>)
          }
        </select>
        <input
          type="date"
          value={royaltyDateDebut}
          onChange={e => setRoyaltyDateDebut(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }}
        />
        <span style={{ fontSize: 12, color: '#8b7355' }}>→</span>
        <input
          type="date"
          value={royaltyDateFin}
          onChange={e => setRoyaltyDateFin(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }}
        />
        <button
          onClick={exportRoyaltiesExcel}
          disabled={exportingRoyalties}
          style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: exportingRoyalties ? '#d4c5b0' : '#2d5016', color: '#fff', fontSize: 12, fontWeight: 700, cursor: exportingRoyalties ? 'default' : 'pointer' }}
        >
          {exportingRoyalties ? t('exportEnCours') : t('exportExcel')}
        </button>
        <span style={{ fontSize: 12, color: '#8b7355', marginLeft: 'auto' }}>
          {royalties.filter(r =>
            (!royaltyFiltre || r.filature?.nom === royaltyFiltre) &&
            (!royaltyDateDebut || (r.date_facture ?? '') >= royaltyDateDebut) &&
            (!royaltyDateFin   || (r.date_facture ?? '') <= royaltyDateFin)
          ).length} {t('releves')}
        </span>
      </div>

      {royalties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#8b7355' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{t('aucuneRoyalty')}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{t('royaltiesAuto')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {royalties
            .filter(r =>
              (!royaltyFiltre || r.filature?.nom === royaltyFiltre) &&
              (!royaltyDateDebut || (r.date_facture ?? '') >= royaltyDateDebut) &&
              (!royaltyDateFin   || (r.date_facture ?? '') <= royaltyDateFin)
            )
            .map((r, i) => {
              const statutColors: Record<string, [string, string]> = {
                'en_attente': ['#fdf8ec', '#b8860b'],
                'validé':     ['#DBEAFE', '#1E40AF'],
                'contesté':   ['#FEE2E2', '#991B1B'],
                'payé':       ['#f0f4ec', '#2d5016'],
              }
              const [sbg, stc] = statutColors[r.statut] ?? ['#f5f3ef', '#4a5568']
              const enRetard = r.date_echeance && new Date(r.date_echeance) < new Date() && r.statut !== 'payé'
              return (
                <div key={i} style={{ background: '#fff', borderRadius: 8, border: `1.5px solid ${enRetard ? '#EF4444' : '#e8e3d8'}`, padding: '14px 18px', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 2 }}>{t('rFilature')}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{r.filature?.nom ?? '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 2 }}>{t('rMarqueFacture')}</div>
                    <div style={{ fontSize: 12, color: '#4a5568' }}>{r.marque?.nom ?? '-'} · {r.facture?.reference ?? '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 2 }}>{t('rHTFacture')}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{Number(r.montant_ht_facture).toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 2 }}>{t('rRoyalty')}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#2d5016' }}>{Number(r.montant_royalty).toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 2 }}>{t('rTotalDu')}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: enRetard ? '#991B1B' : '#1a1a1a' }}>{Number(r.montant_total_du).toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 2 }}>{t('rEcheance')}</div>
                    <div style={{ fontSize: 11, color: enRetard ? '#991B1B' : '#4a5568', fontWeight: enRetard ? 700 : 400 }}>
                      {r.date_echeance ? new Date(r.date_echeance).toLocaleDateString() : '-'}
                      {enRetard && ' ⚠'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: sbg, color: stc }}>{r.statut}</span>
                    {r.statut !== 'payé' && (
                      <button
                        onClick={() => marquerRoyaltyPayee(r.id)}
                        style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {t('marquerPaye')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
