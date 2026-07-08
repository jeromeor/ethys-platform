'use client'
import { useTranslations } from 'next-intl'

interface QRCodeData {
  id: string
  reference: string
  url_publique: string
  nb_scans: number
  actif: boolean
  created_at: string
}

interface Lot {
  id: string
  reference: string
  type_coton: string
  volume_tonnes: number
  origine: string | null
  certification: string | null
  statut: string
  avancement_pct: number
  avancement_commande_pct?: number
  commande: {
    reference: string
    titre: string | null
    marque: { nom: string } | null
    filature: { nom: string } | null
    fournisseur: { nom: string } | null
  } | null
  qr_codes: QRCodeData[]
}

interface Props {
  onClose: () => void
  selected: Lot
  qrActif: QRCodeData
  qrDataUrl: string | null
}

export default function ApercuPublicModal({ onClose, selected, qrActif, qrDataUrl }: Props) {
  const t = useTranslations('qrcode')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)', borderRadius: '12px 12px 0 0', padding: '16px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>{t('public.tracabilite')}</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{t('public.votreFil')}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{t('public.lot') + ' #' + selected.reference}</div>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>x</button>
          </div>

          {qrDataUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ background: '#fff', padding: 10, borderRadius: 4 }}>
                <img src={qrDataUrl} alt="QR" style={{ width: 100, height: 100, display: 'block' }} />
              </div>
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '14px', marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, marginBottom: 10, letterSpacing: 1 }}>{t('public.matieres')}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 51, background: '#8b7355', borderRadius: 6, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>51%</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{t('public.cotonRecycle')}</div>
              </div>
              <div style={{ flex: 49, background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>49%</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{t('public.cotonVierge')}</div>
              </div>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '51%', background: '#c2956e', borderRadius: 3 }} />
            </div>
          </div>

          <div style={{ background: 'rgba(110,231,183,0.2)', borderRadius: 4, padding: '12px 14px', border: '1px solid rgba(110,231,183,0.4)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#c2956e', marginBottom: 4 }}>{t('public.filCertifie')}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              {t('public.description', { filature: selected.commande?.filature?.nom ?? t('public.laFilature') })}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {[
            ['origine', t('public.origineMatiere'), selected.origine ?? t('public.nonRenseigne')],
            ['filature', t('labels.filature'), selected.commande?.filature?.nom ?? '-'],
            ['certif', t('public.certifFil'), 'ETHYS'],
            ['fournisseur', t('public.fournisseurCoton'), selected.commande?.fournisseur?.nom ?? '-'],
          ].map(([key, label, val]) => (
            <div key={key} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f3ef' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: key === 'certif' ? '#f0f4ec' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>
                {key === 'certif' ? 'E' : key === 'filature' ? 'F' : key === 'origine' ? 'O' : 'C'}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 11, color: key === 'certif' ? '#2d5016' : '#4a5568', fontWeight: key === 'certif' ? 700 : 400 }}>{val}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 4, background: '#f5f3ef', fontSize: 10, color: '#8b7355', textAlign: 'center' }}>
            {t('public.donneesVerifiees')}
            <br />{t('public.plateforme') + ' · ' + qrActif.reference}
          </div>
          <button onClick={() => window.open(qrActif.url_publique, '_blank')} style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 4, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {t('public.ouvrirPage')}
          </button>
        </div>
      </div>
    </div>
  )
}
