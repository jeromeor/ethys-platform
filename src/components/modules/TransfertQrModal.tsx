'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface QRCodeData {
  id: string
  reference: string
  url_publique: string
  nb_scans: number
  actif: boolean
  created_at: string
}

interface Certification {
  id: string
  numero: string
  date_emission: string
  date_validite: string
  declaration: {
    type_produit: string
    volume_recycle_kg: number
    volume_vierge_kg: number
    pct_recycle: number
    provenance_pays: string | null
    filature_nom: string | null
    filature_pays: string | null
    description: string | null
    entreprise: { nom: string; pays: string } | null
  } | null
  qr_codes: QRCodeData[]
}

interface Props {
  onClose: () => void
  marques: { id: string; nom: string }[]
  selectedCert: Certification
  profil: { role: string; entreprise_id: string }
}

export default function TransfertQrModal({ onClose, marques, selectedCert, profil }: Props) {
  const t = useTranslations('qrcode')
  const [transfertMarqueId, setTransfertMarqueId] = useState('')
  const [transfertMarqueEmail, setTransfertMarqueEmail] = useState('')
  const [transfertNouvelleMarque, setTransfertNouvelleMarque] = useState(false)
  const [transfertSaving, setTransfertSaving] = useState(false)
  const [transfertMessage, setTransfertMessage] = useState('')
  const [transfertMessageType, setTransfertMessageType] = useState<'error' | 'ok' | ''>('')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: '28px 24px', width: 440, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{t('transfert.titre')}</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>×</button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', fontSize: 13 }}>
          <input type="checkbox" checked={transfertNouvelleMarque} onChange={e => setTransfertNouvelleMarque(e.target.checked)} />
          {t('transfert.marqueNonEnreg')}
        </label>

        {transfertNouvelleMarque ? (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('transfert.emailLabel')}</label>
            <input
              type="email"
              value={transfertMarqueEmail}
              onChange={e => setTransfertMarqueEmail(e.target.value)}
              placeholder="contact@marque.com"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: '#8b7355', marginTop: 6 }}>{t('transfert.emailInfo')}</div>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>{t('transfert.selectLabel')}</label>
            <select
              value={transfertMarqueId}
              onChange={e => setTransfertMarqueId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            >
              <option value="">{t('transfert.selectPlaceholder')}</option>
              {marques.map((m: any) => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
          </div>
        )}

        {transfertMessage && (
          <div style={{ padding: '10px 14px', borderRadius: 6, background: transfertMessageType === 'error' ? '#fdf0f0' : '#f0f4ec', border: '1px solid ' + (transfertMessageType === 'error' ? '#c8a0a0' : '#c8d8b8'), fontSize: 12, color: transfertMessageType === 'error' ? '#8b3a3a' : '#2d5016', marginBottom: 12, whiteSpace: 'pre-line' }}>
            {transfertMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#4a5568', fontSize: 13, cursor: 'pointer' }}>{t('annuler')}</button>
          <button
            disabled={transfertSaving || (!transfertNouvelleMarque && !transfertMarqueId) || (transfertNouvelleMarque && !transfertMarqueEmail)}
            onClick={async () => {
              // Double confirmation avant envoi
              const marqueLabel = transfertNouvelleMarque
                ? transfertMarqueEmail
                : (marques.find((m: any) => m.id === transfertMarqueId)?.nom ?? '')
              const confirme = window.confirm(t('transfert.confirm', { marque: marqueLabel }))
              if (!confirme) return

              setTransfertSaving(true)
              setTransfertMessage('')
              const marqueSelectionnee = marques.find((m: any) => m.id === transfertMarqueId)
              const res = await fetch('/api/qr-transfert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  certification_id: selectedCert.id,
                  qr_code_id: selectedCert.qr_codes[0].id,
                  filature_id: profil.entreprise_id,
                  filature_nom: selectedCert.declaration?.filature_nom ?? '',
                  marque_id: transfertNouvelleMarque ? null : transfertMarqueId,
                  marque_email: transfertNouvelleMarque ? transfertMarqueEmail : null,
                  marque_nom: transfertNouvelleMarque ? transfertMarqueEmail : (marqueSelectionnee?.nom ?? ''),
                  volume_kg: (selectedCert.declaration?.volume_recycle_kg ?? 0) + (selectedCert.declaration?.volume_vierge_kg ?? 0),
                  certification_reference: selectedCert.numero,
                })
              })
              const result = await res.json()
              if (result.success) {
                setTransfertMessageType('ok'); setTransfertMessage(result.nouvelle_marque ? t('transfert.msgInvitation') : t('transfert.msgTransfere'))
                setTransfertSaving(false)
                setTimeout(() => onClose(), 2000)
              } else {
                setTransfertMessageType('error'); setTransfertMessage(t('transfert.erreurPrefix') + (result.error ?? t('transfert.inconnue')))
                setTransfertSaving(false)
              }
            }}
            style={{ flex: 2, padding: '10px', borderRadius: 4, border: 'none', background: transfertSaving ? '#d4c5b0' : '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: transfertSaving ? 'default' : 'pointer' }}
          >
            {transfertSaving ? t('btn.envoi') : t('transfert.envoyer')}
          </button>
        </div>
      </div>
    </div>
  )
}
