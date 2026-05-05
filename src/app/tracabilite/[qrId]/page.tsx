import { createClient } from '@/lib/supabase/server'

export default async function TracabilitePage({ params }: { params: Promise<{ qrId: string }> }) {
  const { qrId } = await params
  const supabase = await createClient()

  const { data: qrCode } = await supabase
    .from('qr_codes')
    .select(`
      *,
      lot:lots(
        *,
        commande:commandes(
          reference,
          marque:entreprises!commandes_marque_id_fkey(nom),
          filature:entreprises!commandes_filature_id_fkey(nom),
          fournisseur:entreprises!commandes_fournisseur_id_fkey(nom)
        )
      )
    `)
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

  const lot = qrCode.lot as Record<string, unknown>
  const commande = lot?.commande as Record<string, unknown>
  const marque = commande?.marque as Record<string, string>
  const filature = commande?.filature as Record<string, string>
  const fournisseur = commande?.fournisseur as Record<string, string>

  const volumeRecycle = lot?.type_coton === 'recycle' ? Number(lot?.volume_tonnes) : 0
  const volumeVierge = lot?.type_coton === 'vierge' ? Number(lot?.volume_tonnes) : 0
  const totalVolume = Number(lot?.volume_tonnes) ?? 0
  const pctRecycle = totalVolume > 0 ? Math.round(volumeRecycle / totalVolume * 100) : 51
  const pctVierge = 100 - pctRecycle

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header vert */}
      <div style={{ background: 'linear-gradient(135deg,#0A3D26,#0D5C3A)', padding: '32px 24px', color: '#fff' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 10, color: '#6EE7B7', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>
            ETHYS · TRACABILITE TOTALE
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Votre fil ETHYS</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 20 }}>
            Lot #{String(lot?.reference ?? '')} · {String(commande?.reference ?? '')}
          </div>

          {/* Matieres premieres */}
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#6EE7B7', fontWeight: 600, marginBottom: 10, letterSpacing: 1 }}>MATIERES PREMIERES</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: pctRecycle, background: '#10B981', borderRadius: 6, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{pctRecycle}%</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Coton recycle</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{Math.round(volumeRecycle * 1000).toLocaleString('fr-FR')} kg</div>
              </div>
              <div style={{ flex: pctVierge, background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{pctVierge}%</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Coton vierge</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{Math.round(volumeVierge * 1000).toLocaleString('fr-FR')} kg</div>
              </div>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pctRecycle}%`, background: '#6EE7B7', borderRadius: 3 }} />
            </div>
          </div>

          {/* Certification fil ETHYS */}
          <div style={{ background: 'rgba(110,231,183,0.2)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(110,231,183,0.4)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#6EE7B7', marginBottom: 4 }}>Fil certifie ETHYS</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              Ce fil est le resultat de la transformation de coton recycle et vierge par {filature?.nom ?? 'la filature'}, certifie par la plateforme TEXTILE LOOP.
            </div>
          </div>
        </div>
      </div>

      {/* Informations */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px' }}>
        {[
          { label: 'Origine matiere', value: String(lot?.origine ?? 'Non renseigne') },
          { label: 'Filature', value: filature?.nom ?? '-' },
          { label: 'Certification fil', value: String(lot?.certification ?? 'ETHYS') },
          { label: 'Fournisseur coton', value: fournisseur?.nom ?? '-' },
          { label: 'Marque', value: marque?.nom ?? '-' },
          { label: 'Volume total', value: `${Math.round(totalVolume * 1000).toLocaleString('fr-FR')} kg` },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #EEF0F3' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: label === 'Certification fil' ? '#D1FAE5' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
              {label === 'Certification fil' ? 'E' : label === 'Filature' ? 'F' : label === 'Origine matiere' ? 'O' : label === 'Marque' ? 'M' : label === 'Volume total' ? 'V' : 'C'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{label}</div>
              <div style={{ fontSize: 11, color: label === 'Certification fil' ? '#065F46' : '#64748B', fontWeight: label === 'Certification fil' ? 700 : 400 }}>{value}</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 20, padding: '14px', borderRadius: 12, background: '#fff', border: '1px solid #EEF0F3', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Scan #{qrCode.nb_scans + 1}</div>
          <div style={{ fontSize: 10, color: '#CBD5E1' }}>
            Donnees verifiees et certifiees par TEXTILE LOOP
          </div>
          <div style={{ fontSize: 10, color: '#CBD5E1', marginTop: 2 }}>
            Plateforme ETHYS · {String(qrCode.reference)}
          </div>
        </div>
      </div>
    </div>
  )
}