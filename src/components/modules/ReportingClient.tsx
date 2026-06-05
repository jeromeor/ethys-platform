'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, LabelList,
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
  montant_ht: number
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

const COLORS = ['#1a1a1a', '#2d5016', '#c2956e', '#CBD5E1', '#F59E0B']

export default function ReportingClient({ commandes, factures, entreprises, lots }: Props) {
  const t = useTranslations('reporting')

  // Onglets : clé stable pour l'état, libellé traduit pour l'affichage
  const TABS = [
    { key: 'vueGlobale', label: t('tabs.vueGlobale') },
    { key: 'volumes', label: t('tabs.volumes') },
    { key: 'finances', label: t('tabs.finances') },
    { key: 'partenaires', label: t('tabs.partenaires') },
  ]

  const [activeTab, setActiveTab] = useState('vueGlobale')

  const totalVolume = commandes.reduce((s, c) => s + (c.volume_total_tonnes ?? 0), 0)
  const totalCA = factures.reduce((s, f) => s + f.montant_ht, 0)
  const totalRecycle = lots.filter(l => l.type_coton === 'Recyclé').reduce((s, l) => s + l.volume_tonnes, 0)
  const totalVierge = lots.filter(l => l.type_coton === 'Vierge').reduce((s, l) => s + l.volume_tonnes, 0)
  const pctRecycleGlobal = totalVolume > 0 ? Math.round(commandes.reduce((s, c) => s + c.pct_recycle, 0) / commandes.length) : 0

  // Données par mois
  const parMois = useMemo(() => {
    const map: Record<string, { mois: string; volume: number; ca: number; commandes: number }> = {}
    commandes.forEach(c => {
      const mois = new Date(c.created_at).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      if (!map[mois]) map[mois] = { mois, volume: 0, ca: 0, commandes: 0 }
      map[mois].volume += (c.volume_total_tonnes ?? 0)
      map[mois].commandes += 1
    })
    factures.forEach(f => {
      const mois = new Date(f.date_emission).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      if (!map[mois]) map[mois] = { mois, volume: 0, ca: 0, commandes: 0 }
      map[mois].ca += f.montant_ht
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
      name: name === 'marque' ? t('types.marques') : name === 'filature' ? t('types.filatures') : t('types.fournisseurs'),
      value
    }))
  }, [entreprises, t])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '16px 22px', flexShrink: 0 }}>
        {[
          { label: t('kpi.volumeTotal'), value: `${Math.round(totalVolume * 1000).toLocaleString('fr-FR')} kg`, delta: t('kpi.commandes', { count: commandes.length }) },
          { label: t('kpi.caTotal'), value: fmt(totalCA), delta: t('kpi.factures', { count: factures.length }) },
          { label: t('kpi.pctCotonRecycle'), value: `${pctRecycleGlobal}%`, delta: '' },
          { label: t('kpi.partenaires'), value: `${entreprises.length}`, delta: t('kpi.verifies', { count: entreprises.filter(e => e.statut === 'Vérifié').length }) },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#8b7355', marginTop: 4 }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e8e3d8', padding: '0 22px', flexShrink: 0, background: '#fff' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
            color: activeTab === tab.key ? '#1a1a1a' : '#8b7355',
            borderBottom: activeTab === tab.key ? '2px solid #1a1a1a' : '2px solid transparent',
            marginBottom: -2
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 22px' }}>

        {/* Vue globale */}
        {activeTab === 'vueGlobale' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>{t('vueGlobale.volumesMensuels')}</div>
              </div>
              {parMois.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#8b7355', fontSize: 12 }}>{t('aucuneDonnee')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={parMois} margin={{ top: 30, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ef" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} tickFormatter={v => `${Math.round(v * 1000 / 1000)} k`} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8e3d8', fontSize: 12 }} />
                    <Bar dataKey="volume" name={t('vueGlobale.volumeSerie')} fill="#1a1a1a" radius={[4, 4, 0, 0]}><LabelList dataKey="volume" position="top" style={{ fontSize: 11, fill: '#1a1a1a', fontWeight: 700 }} formatter={(v: unknown) => Number(v) >= 0 ? `${Math.round(Number(v) * 1000).toLocaleString('fr-FR')} kg` : ''} /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>
                  {t('vueGlobale.statutsCommandes')}
                </div>
                {statutsData.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#8b7355', fontSize: 12 }}>{t('aucuneDonnee')}</div>
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

            </div>

            {/* Table commandes récentes */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden', gridColumn: '1 / -1' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f5f3ef', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
                {t('vueGlobale.resumeCommandes')}
              </div>
              {commandes.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#8b7355', fontSize: 12 }}>{t('aucuneCommande')}</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f5f3ef' }}>
                      {[t('vueGlobale.colStatut'), t('vueGlobale.colNbCommandes'), t('vueGlobale.colVolumeTotal'), t('vueGlobale.colPctRecycle')].map((h, i) => (
                        <th key={i} style={{ padding: '9px 16px', fontSize: 11, fontWeight: 600, color: '#8b7355', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {statutsData.map((s, i) => {
                      const cmds = commandes.filter(c => c.statut === s.name)
                      const vol = cmds.reduce((sum, c) => sum + (c.volume_total_tonnes ?? 0), 0)
                      const pct = cmds.length > 0 ? Math.round(cmds.reduce((sum, c) => sum + c.pct_recycle, 0) / cmds.length) : 0
                      return (
                        <tr key={i} style={{ borderTop: '1px solid #f5f3ef' }}>
                          <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#1a1a1a', textTransform: 'capitalize' }}>
                            {s.name.replace(/_/g, ' ')}
                          </td>
                          <td style={{ padding: '11px 16px', fontSize: 12 }}>{s.value}</td>
                          <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600 }}>{Math.round(vol * 1000).toLocaleString('fr-FR')} kg</td>
                          <td style={{ padding: '11px 16px', fontSize: 12, color: '#059669', fontWeight: 600 }}>{pct}% </td>
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
        {activeTab === 'volumes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>{t('volumes.evolution')}</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={parMois}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ef" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="volume" name={t('volumes.volumeSerie')} stroke="#1a1a1a" strokeWidth={2.5} dot={{ r: 4, fill: '#1a1a1a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>


            {[
              { label: t('volumes.volumeTotal'), value: `${Math.round(totalVolume * 1000).toLocaleString('fr-FR')} kg`, badge: t('kpi.commandes', { count: commandes.length }), bg: '#f0f4ec', tc: '#2d5016' },
          { label: t('volumes.lotsActifs'), value: `${lots.filter(l => l.statut !== 'livre').length}`, badge: t('volumes.lotsTotal', { count: lots.length }), bg: '#DBEAFE', tc: '#1E40AF' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '16px 20px' }}>
                <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>{s.value}</div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.tc, fontWeight: 600 }}>{s.badge}</span>
              </div>
            ))}
          </div>
        )}

{/* Finances */}
{activeTab === 'finances' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>{t('finances.caMensuel')}</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={parMois} margin={{ top: 30, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ef" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => fmt(Number(v))} />
                  <Bar dataKey="ca" name={t('finances.caSerie')} fill="#1a1a1a" radius={[6, 6, 0, 0]}><LabelList dataKey="ca" position="top" style={{ fontSize: 11, fill: '#1a1a1a', fontWeight: 700 }} formatter={(v: unknown) => Number(v) >= 0 ? `${Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}` : ''} /></Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: t('finances.caTotal'), value: fmt(totalCA) },
                { label: t('finances.facturesPayees'), value: `${factures.filter(f => f.statut === 'payee').length}` },
                { label: t('finances.facturesAttente'), value: `${factures.filter(f => f.statut === 'en_attente' || f.statut === 'emise').length}` },
                { label: t('finances.tauxEncaissement'), value: totalCA > 0 ? `${Math.round(factures.filter(f => f.statut === 'payee').reduce((s, f) => s + f.montant_ht, 0) / totalCA * 100)}%` : '—' },
              ].map((k, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 6, border: '1px solid #e8e3d8', padding: '14px 18px' }}>
                  <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>{k.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partenaires */}
        {activeTab === 'partenaires' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>{t('partenaires.parPays')}</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={paysData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ef" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" name={t('partenaires.partenairesSerie')} fill="#1a1a1a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>{t('partenaires.parType')}</div>
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
              { label: t('partenaires.totalPartenaires'), value: `${entreprises.length}` },
              { label: t('partenaires.verifies'), value: `${entreprises.filter(e => e.statut === 'Vérifié').length}` },
              { label: t('partenaires.enCours'), value: `${entreprises.filter(e => e.statut === 'en_cours').length}` },
              { label: t('partenaires.paysCouverts'), value: `${new Set(entreprises.map(e => e.pays)).size}` },
            ].map((k, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 6, border: '1px solid #e8e3d8', padding: '14px 18px' }}>
                <div style={{ fontSize: 11, color: '#8b7355', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>{k.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
