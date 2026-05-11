import { createClient } from '@/lib/supabase/server'


const formatStatut = (s: string) => ({
  en_production: 'En production',
  livree: 'Livrée',
  soumise: 'Soumise',
  validation_filature: 'Val. filature',
  validation_finale: 'Val. finale',
  annulee: 'Annulée',
}[s] ?? s)

export default async function DashboardPage() {
  const supabase = await createClient()

  const { count: nbCommandes } = await supabase
    .from('commandes')
    .select('*', { count: 'exact', head: true })

  const { count: nbPartenaires } = await supabase
    .from('entreprises')
    .select('*', { count: 'exact', head: true })
    .neq('type', 'plateforme')

  const { data: dernierCommandes } = await supabase
    .from('commandes')
    .select('reference, statut, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Commandes actives', value: nbCommandes ?? 0, color: '#0A3D26' },
          { label: 'Partenaires', value: nbPartenaires ?? 0, color: '#0A3D26' },
          { label: 'Conformité ESG', value: '94%', color: '#10B981' },
        ].map((k, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3',
            padding: '20px 22px'
          }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {k.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Commandes récentes */}
      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9', fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>
          Commandes récentes
        </div>
        {!dernierCommandes || dernierCommandes.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
            Aucune commande pour l'instant
          </div>
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
                  <td style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#0A3D26' }}>{c.reference}</td>
                  <td style={{ padding: '12px 18px', fontSize: 12, color: '#475569' }}>{formatStatut(c.statut)}</td>
                  <td style={{ padding: '12px 18px', fontSize: 12, color: '#94A3B8' }}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}