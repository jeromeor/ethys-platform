'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations, useLocale } from 'next-intl'

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
  commande_reference: string | null
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
  onClose: () => void
  commandesDispos: CommandeEligible[]
  setCommandesDispos: React.Dispatch<React.SetStateAction<CommandeEligible[]>>
  setDeclsFilature: React.Dispatch<React.SetStateAction<Declaration[]>>
  entrepriseId: string
  userId: string
  initialCommandeId?: string
}

export default function DemandeCertificationForm({ onClose, commandesDispos, setCommandesDispos, setDeclsFilature, entrepriseId, userId, initialCommandeId }: Props) {
  const supabase = createClient()
  const t = useTranslations('certification')
  const locale = useLocale()

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'ok' | ''>('')
  const [declarationHonneur, setDeclarationHonneur] = useState(false)
  const [selectedCommandeId, setSelectedCommandeId] = useState(initialCommandeId ?? '')

  const commandeSelectionnee = commandesDispos.find(c => c.id === selectedCommandeId)

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

    setSelectedCommandeId('')
    setDeclarationHonneur(false)
    onClose()
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '24px', maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{t('form.titre')}</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#8b7355' }}>×</button>
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
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', color: '#4a5568', fontSize: 13, cursor: 'pointer' }}>{t('annuler')}</button>
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
