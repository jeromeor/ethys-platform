import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const formatStatut = (s: string) => ({
  en_production: 'En production',
  livree: 'Livree',
  soumise: 'Soumise',
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

  const nomEntreprise = (profil?.entreprise as Record<string,string>)?.nom ?? ''

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: 20, fontSize: 13, color: '#8b7355' }}>
        Bienvenue{nomEntreprise ? ' — ' + nomEntreprise : ''}{isAdmin ? ' (vue Admin globale)' : ''}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Commandes actives', value: nbCommandes, color: '#0A3D26' },
          { label: 'Partenaires', value: nbPartenaires ?? 0, color: '#0A3D26' },
          { label: 'Conformite ESG', value: '94%', color: '#10B981' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '20px 22px' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9', fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>
          Commandes recentes
        </div>
        {dernierCommandes.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Aucune commande pour l'instant</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Reference', 'Statut', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 18px', fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dernierCommandes.map((c, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#0A3D26' }}>{c.reference}</td>
                  <td style={{ padding: '12px 18px', fontSize: 12, color: '#475569' }}>{formatStatut(c.statut)}</td>
                  <td style={{ padding: '12px 18px', fontSize: 12, color: '#94A3B8' }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
