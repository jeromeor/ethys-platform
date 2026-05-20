import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import QRActivateRow from '@/components/QRActivateRow'

const formatStatut = (s: string) => ({
  en_production: 'En production',
  livree: 'Livree',
  soumise: 'Transmise',
  validation_filature: 'Val. filature',
  validation_finale: 'Val. finale',
  annulee: 'Annulee',
}[s] ?? s)

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('*, entreprise:entreprises(*)')
    .eq('id', user.id)
    .single()

  const entrepriseId = profil?.entreprise_id ?? null
  const isAdmin = profil?.role === 'admin'

  if (!entrepriseId && !isAdmin) {
    return (
      <div style={{ padding: '48px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 40 }}>🏢</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Votre compte est en cours de configuration</div>
        <div style={{ fontSize: 13, color: '#8b7355', textAlign: 'center', maxWidth: 420 }}>
          Votre entreprise n'est pas encore associee. L'equipe ETHYS va finaliser votre configuration tres prochainement.
        </div>
        <a href='/profil' style={{ marginTop: 8, padding: '10px 24px', borderRadius: 6, background: '#1a1a1a', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          Completer mon profil
        </a>
      </div>
    )
  }

  let nbCommandes = 0
  let dernierCommandes: { reference: string; statut: string; created_at: string }[] = []

  if (isAdmin) {
    const { count } = await supabase.from('commandes').select('*', { count: 'exact', head: true })
    nbCommandes = count ?? 0
    const { data } = await supabase.from('commandes').select('reference, statut, created_at').order('created_at', { ascending: false }).limit(5)
    dernierCommandes = data ?? []
  } else if (entrepriseId) {
    const filtre = 'acheteur_id.eq.' + entrepriseId + ',vendeur_id.eq.' + entrepriseId
    const { count } = await supabase.from('commandes').select('*', { count: 'exact', head: true }).or(filtre)
    nbCommandes = count ?? 0
    const { data } = await supabase.from('commandes').select('reference, statut, created_at').or(filtre).order('created_at', { ascending: false }).limit(5)
    dernierCommandes = data ?? []
  }

  const { count: nbPartenaires } = await supabase
    .from('entreprises')
    .select('*', { count: 'exact', head: true })
    .neq('type', 'plateforme')

  // Partenariats de l'entreprise connectée
  let nbPartenariatsActifs = 0
  let demandesRecues: { id: string; nom: string; type: string }[] = []
  let demandesEnvoyees: { id: string; nom: string; type: string }[] = []

  if (entrepriseId) {
    // Partenariats acceptés
    const { count } = await supabase
      .from('partnerships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${entrepriseId},receiver_id.eq.${entrepriseId}`)
    nbPartenariatsActifs = count ?? 0

    // Demandes reçues en attente (l'entreprise est receiver)
    const { data: recues } = await supabase
      .from('partnerships')
      .select('id, requester:requester_id(id, nom, type)')
      .eq('status', 'pending')
      .eq('receiver_id', entrepriseId)
    demandesRecues = (recues ?? []).map((p: any) => ({
      id: p.id,
      nom: p.requester?.nom ?? '',
      type: p.requester?.type ?? '',
    }))

    // Demandes envoyées en attente (l'entreprise est requester)
    const { data: envoyees } = await supabase
      .from('partnerships')
      .select('id, receiver:receiver_id(id, nom, type)')
      .eq('status', 'pending')
      .eq('requester_id', entrepriseId)
    demandesEnvoyees = (envoyees ?? []).map((p: any) => ({
      id: p.id,
      nom: p.receiver?.nom ?? '',
      type: p.receiver?.type ?? '',
    }))
  }

  const nomEntreprise = (profil?.entreprise as Record<string, string>)?.nom ?? ''

// QR codes à valider (visible uniquement pour Textile Loop)
  let qrAValider: { id: string; reference: string; lot_reference: string | null; entreprise_nom: string | null }[] = []

  if (nomEntreprise.toLowerCase() === 'textile loop') {
    const { data: qrData } = await supabase
      .from('qr_codes')
      .select('id, reference, lot:lots(reference, commande:commandes(acheteur:acheteur_id(nom)))')
      .eq('actif', false)

    qrAValider = (qrData ?? []).map((q: any) => ({
      id: q.id,
      reference: q.reference,
      lot_reference: q.lot?.reference ?? null,
      entreprise_nom: q.lot?.commande?.acheteur?.nom ?? null,
    }))
  }
  
  const typeLabels: Record<string, string> = {
    marque: 'Marque', filature: 'Filature', fournisseur_coton: 'Fournisseur',
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20, fontSize: 13, color: '#8b7355' }}>
        Bienvenue{nomEntreprise ? ' — ' + nomEntreprise : ''}{isAdmin ? ' (vue Admin globale)' : ''}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: nomEntreprise.toLowerCase() === 'textile loop' ? 'repeat(5,1fr)' : 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
  { label: 'Commandes actives', value: nbCommandes },
  { label: 'Partenaires actifs', value: nbPartenariatsActifs },
  { label: 'Annuaire', value: nbPartenaires ?? 0 },
  { label: 'Conformité ESG', value: '94%' },
  ...(nomEntreprise.toLowerCase() === 'textile loop' ? [{ label: 'QR code à valider', value: qrAValider.length }] : []),
].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '20px 22px' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0A3D26' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Demandes reçues */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>Demandes reçues</span>
            {demandesRecues.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: '#b8860b', color: '#fff', borderRadius: 10, padding: '2px 8px' }}>{demandesRecues.length}</span>
            )}
          </div>
          {demandesRecues.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Aucune demande en attente</div>
          ) : (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {demandesRecues.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: '#fdf8ec', border: '1px solid #e8d9a0' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{d.nom}</div>
                    <div style={{ fontSize: 11, color: '#8b7355' }}>{typeLabels[d.type] ?? d.type}</div>
                  </div>
                  <Link href="/annuaire" style={{ fontSize: 11, fontWeight: 700, color: '#2d5016', textDecoration: 'none', padding: '4px 10px', borderRadius: 6, border: '1px solid #2d5016' }}>
                    Répondre →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demandes envoyées */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>Demandes envoyées</span>
          </div>
          {demandesEnvoyees.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Aucune demande en cours</div>
          ) : (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {demandesEnvoyees.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: '#f5f3ef', border: '1px solid #e8e3d8' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{d.nom}</div>
                    <div style={{ fontSize: 11, color: '#8b7355' }}>{typeLabels[d.type] ?? d.type}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#b8860b', fontWeight: 700 }}>⏳ En attente</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commandes récentes */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9', fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>
          Commandes récentes
        </div>
        {dernierCommandes.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Aucune commande pour l'instant</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Référence', 'Statut', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 18px', fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dernierCommandes.map((c, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#0A3D26' }}>{c.référence}</td>
                  <td style={{ padding: '12px 18px', fontSize: 12, color: '#475569' }}>{formatStatut(c.statut)}</td>
                  <td style={{ padding: '12px 18px', fontSize: 12, color: '#94A3B8' }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* QR Codes à valider — Textile Loop uniquement */}
      {nomEntreprise.toLowerCase() === 'textile loop' && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden', marginTop: 16 }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>QR Codes à valider</span>
            {qrAValider.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: '#b8860b', color: '#fff', borderRadius: 10, padding: '2px 8px' }}>{qrAValider.length}</span>
            )}
          </div>
          {qrAValider.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Aucun QR code en attente</div>
          ) : (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {qrAValider.map(q => (
                <QRActivateRow key={q.id} qr={q} />
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
