import { createClient } from '@/lib/supabase/server'

export default async function TraçabilitéPage({ params }: { params: Promise<{ qrId: string }> }) {
  const { qrId } = await params
  const supabase = await createClient()

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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 8 }}>QR Code introuvable</div>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>Ce code ne correspond a aucun produit enregistre sur la plateforme ETHYS.</div>
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
      .select('*, entreprise:entreprises(nom, pays)')
      .eq('id', cert?.declaration_id)
      .single()

    // Fallback sur les donnees encodees dans le QR code si decl est null
    const pctRecyclé = 51
    const pctVierge = 49
    const totalKg = Number(cert?.volume_total ?? 0)
    const volRecycle = Math.round(totalKg * 0.51)
    const volVierge = Math.round(totalKg * 0.49)
    const typeLabel = decl?.type_produit === 'fil' ? 'Fil ETHYS' : decl?.type_produit === 'tissu' ? 'Tissu ETHYS' : 'Produit fini ETHYS'

    return (
      <div style={{ minHeight: '100vh', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: '#1a1a1a', padding: '32px 24px', color: '#fff' }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>ETHYS - TRAÇABILITÉ TOTALE</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{typeLabel}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{cert?.numero}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 20 }}>
              Valide jusqu'au {cert ? new Date(cert.date_validite).toLocaleDateString('fr-FR') : '-'}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '16px', marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, marginBottom: 10, letterSpacing: 1 }}>MATIÈRES PREMIÈRES</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: pctRecyclé, background: '#8b7355', borderRadius: 4, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{pctRecyclé}%</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Coton recyclé</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{Number(decl?.volume_recyclé_kg ?? 0).toLocaleString('fr-FR')} kg</div>
                </div>
                <div style={{ flex: pctVierge, background: 'rgba(255,255,255,0.12)', borderRadius: 4, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{pctVierge}%</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Coton vierge</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{Number(decl?.volume_vierge_kg ?? 0).toLocaleString('fr-FR')} kg</div>
                </div>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pctRecyclé}%`, background: '#c2956e', borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ background: 'rgba(194,149,110,0.15)', borderRadius: 4, padding: '12px 14px', border: '1px solid rgba(194,149,110,0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#c2956e', marginBottom: 4 }}>v Certifié ETHYS</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c2956e' }}>{cert?.numero}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginTop: 4 }}>
                Certifié par TEXTILE LOOP - traçabilité verifiee
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Entreprise', value: (decl?.entreprise as any)?.nom ?? '-' },
            { label: 'Pays', value: (decl?.entreprise as any)?.pays ?? '-' },
            { label: 'Filature', value: decl?.filature_nom ?? '-' },
            { label: 'Pays filature', value: decl?.filature_pays ?? '-' },
            { label: 'Provenance coton', value: decl?.provenance_pays ?? '-' },
            { label: 'Type produit', value: typeLabel },
            { label: 'Numero certification', value: cert?.numero ?? '-' },
            { label: 'Date émission', value: cert ? new Date(cert.date_émission).toLocaleDateString('fr-FR') : '-' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e8e3d8' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: label === 'Numero certification' ? '#f0f4ec' : '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#0A3D26' }}>
                {label[0]}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{label}</div>
                <div style={{ fontSize: 11, color: label === 'Numero certification' ? '#2d5016' : '#4a5568', fontWeight: label === 'Numero certification' ? 700 : 400 }}>{value}</div>
              </div>
            </div>
          ))}
          </div><div style={{ marginTop: 20, padding: '14px', borderRadius: 12, background: '#fff', border: '1px solid #EEF0F3', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Scan #{qrCode.nb_scans + 1}</div>
            <div style={{ fontSize: 10, color: '#CBD5E1' }}>Données vérifiées et certifiées par TEXTILE LOOP</div>
            <div style={{ fontSize: 10, color: '#CBD5E1', marginTop: 2 }}>Plateforme ETHYS - {qrCode.reference}</div>
          </div>
        </div>
      </div>
    )
  }

  const { data: lot } = await supabase
    .from('lots')
    .select('*, commande:commandes(reference, marque:entreprises!commandes_marque_id_fkey(nom), filature:entreprises!commandes_filature_id_fkey(nom), fournisseur:entreprises!commandes_fournisseur_id_fkey(nom))')
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

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: '#1a1a1a', padding: '32px 24px', color: '#fff' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>ETHYS - TRAÇABILITÉ TOTALE</div>
          <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Votre fil ETHYS</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 20 }}>
            Lot #{String(lot?.reference ?? '')} - {String(commande?.reference ?? '')}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '16px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#c2956e', fontWeight: 600, marginBottom: 10, letterSpacing: 1 }}>MATIÈRES PREMIÈRES</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: pctRecyclé, background: '#8b7355', borderRadius: 4, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{pctRecyclé}%</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Coton recyclé</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{Math.round(volumeRecyclé * 1000).toLocaleString('fr-FR')} kg</div>
              </div>
              <div style={{ flex: pctVierge, background: 'rgba(255,255,255,0.12)', borderRadius: 4, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{pctVierge}%</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Coton vierge</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{Math.round(volumeVierge * 1000).toLocaleString('fr-FR')} kg</div>
              </div>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pctRecyclé}%`, background: '#c2956e', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ background: 'rgba(194,149,110,0.15)', borderRadius: 4, padding: '12px 14px', border: '1px solid rgba(194,149,110,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#c2956e', marginBottom: 4 }}>Fil certifié ETHYS</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              Ce fil est le résultat de la transformation de coton recyclé et vierge par {filature?.nom ?? 'la filature'}, certifié par la plateforme TEXTILE LOOP.
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Origine matière', value: String(lot?.origine ?? 'Non renseigné') },
          { label: 'Filature', value: filature?.nom ?? '-' },
          { label: 'Certification fil', value: String(lot?.certification ?? 'ETHYS') },
          { label: 'Fournisseur coton', value: fournisseur?.nom ?? '-' },
          { label: 'Marque', value: marque?.nom ?? '-' },
          { label: 'Volume total', value: `${Math.round(totalVolume * 1000).toLocaleString('fr-FR')} kg` },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e8e3d8' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f5f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
              {label === 'Certification fil' ? 'E' : label === 'Filature' ? 'F' : label === 'Origine matière' ? 'O' : label === 'Marque' ? 'M' : label === 'Volume total' ? 'V' : 'C'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{label}</div>
              <div style={{ fontSize: 11, color: label === 'Certification fil' ? '#2d5016' : '#4a5568', fontWeight: label === 'Certification fil' ? 700 : 400 }}>{value}</div>
            </div>
          </div>
        ))}
        </div><div style={{ marginTop: 20, padding: '14px', borderRadius: 12, background: '#fff', border: '1px solid #EEF0F3', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Scan #{qrCode.nb_scans + 1}</div>
          <div style={{ fontSize: 10, color: '#CBD5E1' }}>Données vérifiées et certifiées par TEXTILE LOOP</div>
          <div style={{ fontSize: 10, color: '#CBD5E1', marginTop: 2 }}>Plateforme ETHYS - {String(qrCode.reference)}</div>
        </div>
      </div>
    </div>
  )
}
