'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface Commande {
  statut: string
  volume_total_tonnes: number
  pct_recycle: number
  created_at: string
  priorite: string
}

interface Facture {
  montant_ttc: number
  statut: string
  date_emission: string
}

interface Entreprise {
  type: string
  statut: string
  pays: string
}

interface Lot {
  type_coton: string
  volume_tonnes: number
  statut: string
}

interface Props {
  commandes: Commande[]
  factures: Facture[]
  entreprises: Entreprise[]
  lots: Lot[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const TABS = ['Vue globale', 'Volumes', 'Finances', 'Partenaires']
const COLORS = ['#0A3D26', '#10B981', '#6EE7B7', '#CBD5E1', '#F59E0B']

export default function ReportingClient({ commandes, factures, entreprises, lots }: Props) {
  const [activeTab, setActiveTab] = useState('Vue globale')

  const totalVolume = commandes.reduce((s, c) => s + (c.volume_total_tonnes ?? 0), 0)
  const totalCA = factures.reduce((s, f) => s + f.montant_ttc, 0)
  const totalRecycle = lots.filter(l => l.type_coton === 'Recyclé').reduce((s, l) => s + l.volume_tonnes, 0)
  const totalVierge = lots.filter(l => l.type_coton === 'Vierge').reduce((s, l) => s + l.volume_tonnes, 0)
  const pctRecycleGlobal = totalVolume > 0 ? Math.round(commandes.reduce((s, c) => s + c.pct_recycle, 0) / commandes.length) : 0

  // Données par mois
  const parMois = useMemo(() => {
    const map: Record<string, { mois: string; volume: number; ca: number; commandes: number }> = {}
    commandes.forEach(c => {
      const mois = new Date(c.created_at).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      if (!map[mois]) map[mois] = { mois, volume: 0, ca: 0, commandes: 0 }
      map[mois].volume += c.volume_total_tonnes ?? 0
      map[mois].commandes += 1
    })
    factures.forEach(f => {
      const mois = new Date(f.date_emission).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      if (!map[mois]) map[mois] = { mois, volume: 0, ca: 0, commandes: 0 }
      map[mois].ca += f.montant_ttc
    })
    return Object.values(map)
  }, [commandes, factures])

  // Répartition Statuts commandes
  const statutsData = useMemo(() => {
    const map: Record<string, number> = {}
    commandes.forEach(c => { map[c.statut] = (map[c.statut] ?? 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [commandes])

  // Répartition pays partenaires
  const paysData = useMemo(() => {
    const map: Record<string, number> = {}
    entreprises.forEach(e => { map[e.pays] = (map[e.pays] ?? 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [entreprises])

  // Répartition types partenaires
  const typesData = useMemo(() => {
    const map: Record<string, number> = {}
    entreprises.forEach(e => { map[e.type] = (map[e.type] ?? 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({
      name: name === 'marque' ? 'Marques' : name === 'filature' ? 'Filatures' : 'Fournisseurs',
      value
    }))
  }, [entreprises])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '16px 22px', flexShrink: 0 }}>
        {[
          { label: 'Volume total', value: `${Math.round(totalVolume * 1000).toLocaleString('fr-FR')} kg`, delta: `${commandes.length} commandes` },
          { label: 'CA total', value: fmt(totalCA), delta: `${factures.length} factures` },
          { label: '% Coton recyclé', value: `${pctRecycleGlobal}%`, delta: `${Math.round(totalRecycle * 1000).toLocaleString('fr-FR')} kg recyclés` },
          { label: 'Partenaires', value: `${entreprises.length}`, delta: `${entreprises.filter(e => e.statut === 'Vérifié').length} Vérifiés` },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0A3D26' }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #EEF0F3', padding: '0 22px', flexShrink: 0, background: '#fff' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === t ? 700 : 500,
            color: activeTab === t ? '#0A3D26' : '#94A3B8',
            borderBottom: activeTab === t ? '2px solid #0A3D26' : '2px solid transparent',
            marginBottom: -2
          }}>{t}</button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 22px' }}>

        {/* Vue globale */}
        {activeTab === 'Vue globale' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>Volumes mensuels (kg)</div>
              </div>
              {parMois.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: 12 }}>Aucune donnée</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={parMois}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #EEF0F3', fontSize: 12 }} />
                    <Bar dataKey="volume" name="Volume (T)" fill="#0A3D26" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 14 }}>
                  Statuts commandes
                </div>
                {statutsData.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Aucune donnée</div>
                ) : (
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={statutsData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                        {statutsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div style={{ background: 'linear-gradient(135deg,#0A3D26,#0D5C3A)', borderRadius: 14, padding: '18px 22px', color: '#fff' }}>
                <div style={{ fontSize: 11, color: '#6EE7B7', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
                  Composition coton
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#6EE7B7' }}>{Math.round(totalRecycle * 1000).toLocaleString('fr-FR')} kg</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>♻ recyclés</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{Math.round(totalVierge)}T</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>🌿 Vierge</div>
                  </div>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3 }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: '#6EE7B7',
                    width: totalRecycle + totalVierge > 0 ? `${Math.round(totalRecycle / (totalRecycle + totalVierge) * 100)}%` : '0%'
                  }} />
                </div>
              </div>
            </div>

            {/* Table commandes récentes */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden', gridColumn: '1 / -1' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', fontSize: 13, fontWeight: 700, color: '#0A3D26' }}>
                Résumé des commandes
              </div>
              {commandes.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Aucune commande</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Statut', 'Nb commandes', 'Volume total', '% recyclé moy.'].map(h => (
                        <th key={h} style={{ padding: '9px 16px', fontSize: 11, fontWeight: 600, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {statutsData.map((s, i) => {
                      const cmds = commandes.filter(c => c.statut === s.name)
                      const vol = cmds.reduce((sum, c) => sum + (c.volume_total_tonnes ?? 0), 0)
                      const pct = cmds.length > 0 ? Math.round(cmds.reduce((sum, c) => sum + c.pct_recycle, 0) / cmds.length) : 0
                      return (
                        <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#0A3D26', textTransform: 'capitalize' }}>
                            {s.name.replace(/_/g, ' ')}
                          </td>
                          <td style={{ padding: '11px 16px', fontSize: 12 }}>{s.value}</td>
                          <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600 }}>{Math.round(vol * 1000).toLocaleString('fr-FR')} kg</td>
                          <td style={{ padding: '11px 16px', fontSize: 12, color: '#059669', fontWeight: 600 }}>{pct}% ♻</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Volumes */}
        {activeTab === 'Volumes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>Évolution volumes</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={parMois}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="volume" name="Volume (T)" stroke="#0A3D26" strokeWidth={2.5} dot={{ r: 4, fill: '#0A3D26' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>Recyclé vs Vierge</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                    { name: '♻ Recyclés', value: Math.round(totalRecycle * 1000) },
                      { name: '🌿 Vierge', value: Math.round(totalVierge) },
                    ]}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    dataKey="value" paddingAngle={4}
                  >
                    <Cell fill="#0A3D26" />
                    <Cell fill="#CBD5E1" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={v => `${v} T`} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {[
              { label: 'Volume total', value: `${Math.round(totalVolume * 1000).toLocaleString('fr-FR')} kg`, badge: `${commandes.length} commandes`, bg: '#D1FAE5', tc: '#065F46' },
          { label: 'Volume Recyclé', value: `${Math.round(totalRecycle * 1000).toLocaleString('fr-FR')} kg`, badge: `${pctRecycleGlobal}% du total`, bg: '#D1FAE5', tc: '#065F46' },
          { label: 'Volume Vierge', value: `${Math.round(totalVierge * 1000).toLocaleString('fr-FR')} kg`, badge: `${100 - pctRecycleGlobal}% du total`, bg: '#F1F5F9', tc: '#475569' },
          { label: 'Lots actifs', value: `${lots.filter(l => l.statut !== 'livre').length}`, badge: `${lots.length} lots total`, bg: '#DBEAFE', tc: '#1E40AF' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '16px 20px' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0A3D26', marginBottom: 6 }}>{s.value}</div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.tc, fontWeight: 600 }}>{s.badge}</span>
              </div>
            ))}
          </div>
        )}

{/* Finances */}
{activeTab === 'Finances' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>CA mensuel</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={parMois}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => fmt(Number(v))} />
                  <Bar dataKey="ca" name="CA en euros" fill="#0A3D26" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'CA total', value: fmt(totalCA) },
                { label: 'Factures payées', value: `${factures.filter(f => f.statut === 'payee').length}` },
                { label: 'Factures en attente', value: `${factures.filter(f => f.statut === 'en_attente' || f.statut === 'emise').length}` },
                { label: 'Taux encaissement', value: totalCA > 0 ? `${Math.round(factures.filter(f => f.statut === 'payee').reduce((s, f) => s + f.montant_ttc, 0) / totalCA * 100)}%` : 'â€”' },
              ].map((k, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #EEF0F3', padding: '14px 18px' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0A3D26' }}>{k.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partenaires */}
        {activeTab === 'Partenaires' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>Répartition par pays</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={paysData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" name="Partenaires" fill="#0A3D26" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>Répartition par type</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={typesData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={3}>
                    {typesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {[
              { label: 'Total partenaires', value: `${entreprises.length}` },
              { label: 'Vérifiés', value: `${entreprises.filter(e => e.statut === 'Vérifié').length}` },
              { label: 'En cours', value: `${entreprises.filter(e => e.statut === 'en_cours').length}` },
              { label: 'Pays couverts', value: `${new Set(entreprises.map(e => e.pays)).size}` },
            ].map((k, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #EEF0F3', padding: '14px 18px' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0A3D26' }}>{k.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


