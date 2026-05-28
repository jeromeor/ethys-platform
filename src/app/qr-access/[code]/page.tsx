import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function QRAccessPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  // Récupère le transfert via le code d'accès
  const { data: transfert } = await supabase
    .from('transferts_qr')
    .select(`
      id, statut, volume_kg, date_recuperation, code_acces,
      certification:certifications_ethys(id, reference, date_emission, date_expiration, type_produit, volume_recycle_kg, volume_vierge_kg, pct_recycle),
      filature:entreprises!transferts_qr_filature_id_fkey(nom, pays),
      marque:entreprises!transferts_qr_marque_id_fkey(nom, pays),
      qr_code:qr_codes(id, reference, url_publique, nb_scans)
    `)
    .eq('code_acces', code)
    .single()

  if (!transfert) return notFound()

  const cert = transfert.certification as any
  const filature = transfert.filature as any
  const marque = transfert.marque as any
  const qrCode = transfert.qr_code as any

  // Marque le transfert comme accepté si première visite
  if (transfert.statut === 'en_attente') {
    await supabase
      .from('transferts_qr')
      .update({ statut: 'accepte', date_recuperation: new Date().toISOString() })
      .eq('id', transfert.id)

    // Crée la facture automatiquement
    const prixUnitaire = 0.50
    const montantHT = Number(transfert.volume_kg ?? 0) * prixUnitaire
    const tauxTVA = (marque?.pays === 'France' || marque?.pays === 'FR') ? 0.20 : 0
    const montantTTC = montantHT * (1 + tauxTVA)

    const annee = new Date().getFullYear()
    const { data: lastFacture } = await supabase
      .from('factures')
      .select('reference')
      .ilike('reference', `FAC-${annee}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const seq = lastFacture
      ? String(parseInt(lastFacture.reference.split('-')[2]) + 1).padStart(4, '0')
      : '0001'

    await supabase.from('factures').insert({
  reference: `FAC-${annee}-${seq}`,
  statut: 'emise',
  date_emission: new Date().toISOString().split('T')[0],
  date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  montant_ht: montantHT,
  montant_ttc: montantTTC,
  montant_tva: montantHT * tauxTVA,
  tva_pct: tauxTVA * 100,
  destinataire_id: (transfert.marque as any)?.[0]?.id ?? null,
  emetteur_id: 'a0000000-0000-0000-0000-000000000001',
  notes: `QR code ETHYS — ${cert?.reference ?? ''} — ${transfert.volume_kg} kg`,
})

    // Notifie Textile Loop
    const { data: admins } = await supabase
      .from('profils_utilisateurs')
      .select('id')
      .eq('role', 'admin')

    for (const admin of admins ?? []) {
      await supabase.from('notifications').insert({
        user_id: admin.id,
        type: 'transfert_qr',
        titre: 'QR code récupéré par une marque',
        contenu: `${marque?.nom ?? 'Marque'} a récupéré le QR ${cert?.reference ?? ''} (${transfert.volume_kg} kg) — Facture ${montantTTC.toFixed(2)}€ TTC générée`,
        lien: '/facturation',
        lu: false,
      })
    }
  }

  const dejaRecupere = transfert.statut === 'accepte' && transfert.date_recuperation

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#1a1a1a', padding: '20px 24px', color: '#fff' }}>
        <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, color: '#c2956e', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>ETHYS — QR CODE CERTIFIÉ</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{cert?.reference ?? '—'}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Transfert sécurisé · Usage unique</div>
          </div>
          <img src='/logo_ethys.png' alt='ETHYS' style={{ width: 80, height: 'auto', filter: 'invert(1)', flexShrink: 0 }} />
        </div>
      </div>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '24px' }}>

        {/* Infos certification */}
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '20px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8b7355', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Certification</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['Filature', filature?.nom ?? '—'],
              ['Marque', marque?.nom ?? '—'],
              ['Volume total', `${transfert.volume_kg} kg`],
              ['% recyclé', `${cert?.pct_recycle ?? 51}%`],
              ['Volume recyclé', `${cert?.volume_recycle_kg ?? 0} kg`],
              ['Volume vierge', `${cert?.volume_vierge_kg ?? 0} kg`],
              ['Émise le', cert?.date_emission ? new Date(cert.date_emission).toLocaleDateString('fr-FR') : '—'],
              ['Valide jusqu\'au', cert?.date_expiration ? new Date(cert.date_expiration).toLocaleDateString('fr-FR') : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: '10px 12px', borderRadius: 6, background: '#f5f3ef' }}>
                <div style={{ fontSize: 10, color: '#8b7355', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* QR code */}
        {qrCode ? (
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #c8d8b8', padding: '20px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2d5016', marginBottom: 16 }}>QR Code de traçabilité</div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCode.url_publique)}`}
              alt="QR Code ETHYS"
              style={{ width: 220, height: 220, marginBottom: 16 }}
            />
            <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 4 }}>{qrCode.reference}</div>
            <div style={{ fontSize: 11, color: '#a0aec0', marginBottom: 16 }}>{qrCode.url_publique}</div>
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrCode.url_publique)}`}
              download={`QR-ETHYS-${cert?.reference ?? 'code'}.png`}
              style={{ display: 'inline-block', padding: '12px 28px', background: '#1a1a1a', color: '#fff', textDecoration: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700 }}
            >
              Télécharger le QR code
            </a>
            {dejaRecupere && (
              <div style={{ marginTop: 12, fontSize: 11, color: '#8b7355' }}>
                Récupéré le {new Date(transfert.date_recuperation!).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: '#fdf8ec', borderRadius: 8, border: '1px solid #f0d080', padding: '20px', textAlign: 'center', color: '#b45309', fontSize: 13 }}>
            QR code non disponible. Contactez TEXTILE LOOP.
          </div>
        )}

        {/* Mentions */}
        <div style={{ fontSize: 10, color: '#a0aec0', textAlign: 'center', lineHeight: 1.6 }}>
          Ce QR code est strictement réservé à l'usage de <strong>{marque?.nom ?? 'votre marque'}</strong>.<br />
          Toute diffusion non autorisée est interdite.<br />
          Certifié par TEXTILE LOOP · <a href="https://www.ethys-textileloop.com" style={{ color: '#8b7355' }}>ethys-textileloop.com</a>
        </div>
      </div>
    </div>
  )
}
