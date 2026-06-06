import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import MapTraceabilite from '@/components/MapTraceabilite'

export default async function TracabilitePage({ params }: { params: Promise<{ qrId: string }> }) {
  const { qrId } = await params
  const supabase = await createClient()
  const t = await getTranslations('tracabilite')

  const { data: qrCode } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('reference', qrId)
    .single()

  if (!qrCode) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8FA', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>?</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>{t('introuvableTitre')}</div>
          <div style={{ fontSize: 13, color: '#8b7355' }}>{t('introuvableTexte')}</div>
        </div>
      </div>
    )
  }

  const isCertification = !!qrCode.certification_id

  if (isCertification) {
    const { data: cert } = await supabase
      .from('certifications_ethys')
      .select('*')
      .eq('id', qrCode.certification_id)
      .single()

    const { data: decl } = await supabase
      .from('declarations_ethys')
      .select('*, entreprise:entreprises(nom, pays, ville, latitude, longitude)')
      .eq('id', cert?.declaration_id)
      .single()

    const pctRecyclé = 51
    const pctVierge = 49
    const totalKg = Number(cert?.volume_total ?? 0)
    const volRecycle = Math.round(totalKg * 0.51)
    const volVierge = Math.round(totalKg * 0.49)
    const typeLabel = decl?.type_produit === 'fil' ? t('typeFil') : decl?.type_produit === 'tissu' ? t('typeTissu') : t('typeProduitFini')

    const entDecl = decl?.entreprise as any
    const certActeurs = [
      entDecl?.latitude ? {
        type: 'filature',
        nom: entDecl?.nom || '-',
        ville: entDecl?.ville || '',
        latitude: Number(entDecl?.latitude),
        longitude: Number(entDecl?.longitude),
      } : null,
    ].filter(Boolean)

    return (
      <div style={{ minHeight: '100vh', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: '#1a1a1a', padding: '20px 24px 24px', color: '#fff' }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 9, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>{t('certBadge')}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 2 }}>{t('certTitre')}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{cert?.numero}</div>
            </div>
            <img src='/logo_ethys.png' alt='ETHYS' style={{ width: 90, height: 'auto', filter: 'invert(1)', flexShrink: 0 }} />
          </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '16px', marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, marginBottom: 10, letterSpacing: 1 }}>{t('matieres')}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: pctRecyclé, background: '#8b7355', borderRadius: 4, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{pctRecyclé}%</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{t('cotonRecycle')}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{Number(decl?.volume_recyclé_kg ?? 0).toLocaleString('fr-FR')} kg</div>
                </div>
                <div style={{ flex: pctVierge, background: 'rgba(255,255,255,0.12)', borderRadius: 4, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{pctVierge}%</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{t('cotonVierge')}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{Number(decl?.volume_vierge_kg ?? 0).toLocaleString('fr-FR')} kg</div>
                </div>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pctRecyclé + '%', background: '#c2956e', borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ background: 'rgba(194,149,110,0.15)', borderRadius: 4, padding: '12px 14px', border: '1px solid rgba(194,149,110,0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#c2956e', marginBottom: 4 }}>{t('certifieBadge')}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c2956e' }}>{cert?.numero}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginTop: 4 }}>
                {t('certifieParTL')}
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px' }}>

          <MapTraceabilite acteurs={certActeurs as any} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { key: 'entreprise', label: t('lblEntreprise'), value: (decl?.entreprise as any)?.nom ?? '-' },
            { key: 'pays', label: t('lblPays'), value: (decl?.entreprise as any)?.pays ?? '-' },
            { key: 'filature', label: t('lblFilature'), value: decl?.filature_nom ?? '-' },
            { key: 'paysFilature', label: t('lblPaysFilature'), value: decl?.filature_pays ?? '-' },
            { key: 'provenance', label: t('lblProvenance'), value: decl?.provenance_pays ?? '-' },
            { key: 'typeProduit', label: t('lblTypeProduit'), value: typeLabel },
            { key: 'numeroCert', label: t('lblNumeroCert'), value: cert?.numero ?? '-' },
            { key: 'dateEmission', label: t('lblDateEmission'), value: cert ? new Date(cert.date_émission).toLocaleDateString('fr-FR') : '-' },
          ].map(({ key, label, value }) => (
            <div key={key} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e8e3d8' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: key === 'numeroCert' ? '#f0f4ec' : '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>
                {label[0]}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{label}</div>
                <div style={{ fontSize: 11, color: key === 'numeroCert' ? '#2d5016' : '#4a5568', fontWeight: key === 'numeroCert' ? 700 : 400 }}>{value}</div>
              </div>
            </div>
          ))}
          </div><div style={{ marginTop: 20, padding: '14px', borderRadius: 4, background: '#fff', border: '1px solid #e8e3d8', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 4 }}>{t('scan', { n: qrCode.nb_scans + 1 })}</div>
            <div style={{ fontSize: 10, color: '#d4c5b0' }}>{t('donneesVerifiees')}</div>
            <div style={{ fontSize: 10, color: '#d4c5b0', marginTop: 2 }}>{t('plateforme')} {qrCode.reference}</div>
          </div>
        </div>
      </div>
    )
  }

  const { data: lot } = await supabase
    .from('lots')
    .select('*, commande:commandes(reference, marque:entreprises!commandes_marque_id_fkey(nom, ville, latitude, longitude), filature:entreprises!commandes_filature_id_fkey(nom, ville, latitude, longitude), fournisseur:entreprises!commandes_fournisseur_id_fkey(nom, ville, latitude, longitude))')
    .eq('id', qrCode.lot_id)
    .single()

  const commande = lot?.commande as any
  const filature = commande?.filature as Record<string, string>
  const fournisseur = commande?.fournisseur as Record<string, string>
  const marque = commande?.marque as Record<string, string>
  const totalVolume = Number(lot?.volume_tonnes) ?? 0
  const volumeRecyclé = Math.round(totalVolume * 0.51)
  const volumeVierge = Math.round(totalVolume * 0.49)
  const pctRecyclé = 51
  const pctVierge = 49

  const lotActeurs = [
    fournisseur?.latitude ? {
      type: 'coton',
      nom: fournisseur.nom || '-',
      ville: fournisseur.ville || '',
      latitude: Number(fournisseur.latitude),
      longitude: Number(fournisseur.longitude),
    } : null,
    filature?.latitude ? {
      type: 'filature',
      nom: filature.nom || '-',
      ville: filature.ville || '',
      latitude: Number(filature.latitude),
      longitude: Number(filature.longitude),
    } : null,
    marque?.latitude ? {
      type: 'marque',
      nom: marque.nom || '-',
      ville: marque.ville || '',
      latitude: Number(marque.latitude),
      longitude: Number(marque.longitude),
    } : null,
  ].filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: '#1a1a1a', padding: '20px 24px 24px', color: '#fff' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 9, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>{t('tracaBadge')}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>{t('tracaTitre')}</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{t('lotLabel')} #{String(lot?.reference ?? '')} - {String(commande?.reference ?? '')}</div>
            </div>
            <img src='/logo_ethys.png' alt='ETHYS' style={{ width: 90, height: 'auto', filter: 'invert(1)', flexShrink: 0 }} />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '16px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, marginBottom: 10, letterSpacing: 1 }}>{t('matieres')}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: pctRecyclé, background: '#8b7355', borderRadius: 4, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{pctRecyclé}%</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{t('cotonRecycle')}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{Math.round(volumeRecyclé * 1000).toLocaleString('fr-FR')} kg</div>
              </div>
              <div style={{ flex: pctVierge, background: 'rgba(255,255,255,0.12)', borderRadius: 4, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{pctVierge}%</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{t('cotonVierge')}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{Math.round(volumeVierge * 1000).toLocaleString('fr-FR')} kg</div>
              </div>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pctRecyclé + '%', background: '#c2956e', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ background: 'rgba(194,149,110,0.15)', borderRadius: 4, padding: '12px 14px', border: '1px solid rgba(194,149,110,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#c2956e', marginBottom: 4 }}>{t('filCertifie')}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              {t('descriptionFil', { filature: filature?.nom ?? t('laFilature') })}
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px' }}>

        <MapTraceabilite acteurs={lotActeurs as any} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { key: 'origine', label: t('lblOrigine'), value: String(lot?.origine ?? t('nonRenseigne')) },
          { key: 'filature', label: t('lblFilature'), value: filature?.nom ?? '-' },
          { key: 'certificationFil', label: t('lblCertificationFil'), value: String(lot?.certification ?? 'ETHYS') },
          { key: 'fournisseur', label: t('lblFournisseur'), value: fournisseur?.nom ?? '-' },
          { key: 'marque', label: t('lblMarque'), value: marque?.nom ?? '-' },
          { key: 'volumeTotal', label: t('lblVolumeTotal'), value: Math.round(totalVolume * 1000).toLocaleString('fr-FR') + ' kg' },
        ].map(({ key, label, value }) => (
          <div key={key} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e8e3d8' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
              {key === 'certificationFil' ? 'E' : key === 'filature' ? 'F' : key === 'origine' ? 'O' : key === 'marque' ? 'M' : key === 'volumeTotal' ? 'V' : 'C'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{label}</div>
              <div style={{ fontSize: 11, color: key === 'certificationFil' ? '#2d5016' : '#4a5568', fontWeight: key === 'certificationFil' ? 700 : 400 }}>{value}</div>
            </div>
          </div>
        ))}
        </div><div style={{ marginTop: 20, padding: '14px', borderRadius: 4, background: '#fff', border: '1px solid #e8e3d8', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 4 }}>{t('scan', { n: qrCode.nb_scans + 1 })}</div>
          <div style={{ fontSize: 10, color: '#d4c5b0' }}>{t('donneesVerifiees')}</div>
          <div style={{ fontSize: 10, color: '#d4c5b0', marginTop: 2 }}>{t('plateforme')} {String(qrCode.reference)}</div>
        </div>
      </div>
    </div>
  )
}
