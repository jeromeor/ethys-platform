'use client'

import { useState, useMemo } from 'react'
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

const TABS = ['Vue globale', 'Volumes', 'Finances', 'Partenaires']
const COLORS = ['#1a1a1a', '#2d5016', '#c2956e', '#CBD5E1', '#F59E0B']

export default function ReportingClient({ commandes, factures, entreprises, lots }: Props) {
  const [activeTab, setActiveTab] = useState('Vue globale')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  const commandesFiltrees = useMemo(() => commandes.filter(c => {
    if (dateDebut && new Date(c.created_at) < new Date(dateDebut)) return false
    if (dateFin && new Date(c.created_at) > new Date(dateFin)) return false
    return true
  }), [commandes, dateDebut, dateFin])

  const facturesFiltrees = useMemo(() => factures.filter(f => {
    if (dateDebut && new Date(f.date_emission) < new Date(dateDebut)) return false
    if (dateFin && new Date(f.date_emission) > new Date(dateFin)) return false
    return true
  }), [factures, dateDebut, dateFin])

  const totalVolume = commandesFiltrees.reduce((s, c) => s + (c.volume_total_tonnes ?? 0), 0)
  const totalCA = facturesFiltrees.reduce((s, f) => s + f.montant_ht, 0)
  const totalRecycle = lots.filter(l => l.type_coton === 'Recycle').reduce((s, l) => s + l.volume_tonnes, 0)
  const totalVierge = lots.filter(l => l.type_coton === 'Vierge').reduce((s, l) => s + l.volume_tonnes, 0)
  const pctRecycleGlobal = totalVolume > 0 ? Math.round(commandesFiltrees.reduce((s, c) => s + c.pct_recycle, 0) / commandesFiltrees.length) : 0

  const parMois = useMemo(() => {
    const map: Record<string, { mois: string; volume: number; ca: number; commandes: number }> = {}
    commandesFiltrees.forEach(c => {
      const mois = new Date(c.created_at).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      if (!map[mois]) map[mois] = { mois, volume: 0, ca: 0, commandes: 0 }
      map[mois].volume += (c.volume_total_tonnes ?? 0)
      map[mois].commandes += 1
    })
    facturesFiltrees.forEach(f => {
      const mois = new Date(f.date_emission).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      if (!map[mois]) map[mois] = { mois, volume: 0, ca: 0, commandes: 0 }
      map[mois].ca += f.montant_ht
    })
    return Object.values(map)
  }, [commandesFiltrees, facturesFiltrees])

  const exportCSV = () => {
    const lignes = [
      ['Mois', 'Volume (kg)', 'CA (EUR)', 'Nb commandes'],
      ...parMois.map(r => [r.mois, Math.round(r.volume * 1000), Math.round(r.ca), r.commandes])
    ]
    const csv = lignes.map(l => l.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reporting-ethys-' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const statutsData = useMemo(() => {
    const map: Record<string, number> = {}
    commandesFiltrees.forEach(c => { map[c.statut] = (map[c.statut] ?? 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [commandesFiltrees])

  const paysData = useMemo(() => {
    const map: Record<string, number> = {}
    entreprises.forEach(e => { map[e.pays] = (map[e.pays] ?? 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [entreprises])

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

      {/* Barre filtres + export */}
      <div style={{ padding: '10px 22px', background: '#fff', borderBottom: '1px solid #e8e3d8', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5568' }}>Periode :</div>
        <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }} />
        <div style={{ fontSize: 12, color: '#8b7355' }}>au</div>
        <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid #d4c5b0', fontSize: 12, outline: 'none' }} />
        {(dateDebut || dateFin) && (
          <button onClick={() => { setDateDebut(''); setDateFin('') }} style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid #e8e3d8', background: '#f5f3ef', fontSize: 11, color: '#8b7355', cursor: 'pointer' }}>
            Reinitialiser
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={exportCSV} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Exporter CSV
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '16px 22px', flexShrink: 0 }}>
        {[
          { label: 'Volume total', value: (Math.round(totalVolume * 1000).toLocaleString('fr-FR') + ' kg'), delta: commandesFiltrees.length + ' commandes' },
          { label: 'CA total', value: fmt(totalCA), delta: facturesFiltrees.length + ' factures' },
          { label: '% Coton recycle', value: pctRecycleGlobal + '%', delta: '' },
          { label: 'Partenaires', value: '' + entreprises.length, delta: entreprises.filter(e => e.statut === 'Verifie').length + ' Verifies' },
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
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === t ? 700 : 500,
            color: activeTab === t ? '#1a1a1a' : '#8b7355',
            borderBottom: activeTab === t ? '2px solid #1a1a1a' : '2px solid transparent',
            marginBottom: -2
          }}>{t}</button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 22px' }}>

        {/* Vue globale */}
        {activeTab === 'Vue globale' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Volumes mensuels (milliers de kg)</div>
              {parMois.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#8b7355', fontSize: 12 }}>Aucune donnee</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={parMois} margin={{ top: 30, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ef" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} tickFormatter={v => (Math.round(v * 1000 / 1000) + ' k')} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e8e3d8', fontSize: 12 }} />
                    <Bar dataKey="volume" name="Volume (milliers de kg)" fill="#1a1a1a" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="volume" position="top" style={{ fontSize: 11, fill: '#1a1a1a', fontWeight: 700 }} formatter={(v: unknown) => Number(v) >= 0 ? (Math.round(Number(v) * 1000).toLocaleString('fr-FR') + ' kg') : ''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>Statuts commandes</div>
                {statutsData.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#8b7355', fontSize: 12 }}>Aucune donnee</div>
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

            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden', gridColumn: '1 / -1' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f5f3ef', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
                Resume des commandes
              </div>
              {commandesFiltrees.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#8b7355', fontSize: 12 }}>Aucune commande</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f5f3ef' }}>
                      {['Statut', 'Nb commandes', 'Volume total', '% recycle moy.'].map(h => (
                        <th key={h} style={{ padding: '9px 16px', fontSize: 11, fontWeight: 600, color: '#8b7355', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {statutsData.map((s, i) => {
                      const cmds = commandesFiltrees.filter(c => c.statut === s.name)
                      const vol = cmds.reduce((sum, c) => sum + (c.volume_total_tonnes ?? 0), 0)
                      const pct = cmds.length > 0 ? Math.round(cmds.reduce((sum, c) => sum + c.pct_recycle, 0) / cmds.length) : 0
                      return (
                        <tr key={i} style={{ borderTop: '1px solid #f5f3ef' }}>
                          <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#1a1a1a', textTransform: 'capitalize' }}>
                            {s.name.replace(/_/g, ' ')}
                          </td>
                          <td style={{ padding: '11px 16px', fontSize: 12 }}>{s.value}</td>
                          <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600 }}>{Math.round(vol * 1000).toLocaleString('fr-FR') + ' kg'}</td>
                          <td style={{ padding: '11px 16px', fontSize: 12, color: '#059669', fontWeight: 600 }}>{pct + '%'}</td>
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
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Evolution volumes</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={parMois}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ef" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="volume" name="Volume (T)" stroke="#1a1a1a" strokeWidth={2.5} dot={{ r: 4, fill: '#1a1a1a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {[
              { label: 'Volume total', value: (Math.round(totalVolume * 1000).toLocaleString('fr-FR') + ' kg'), badge: commandesFiltrees.length + ' commandes', bg: '#f0f4ec', tc: '#2d5016' },
              { label: 'Lots actifs', value: '' + lots.filter(l => l.statut !== 'livre').length, badge: lots.length + ' lots total', bg: '#DBEAFE', tc: '#1E40AF' },
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
        {activeTab === 'Finances' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>CA mensuel</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={parMois} margin={{ top: 30, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ef" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} tickFormatter={v => (v / 1000 + 'k')} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => fmt(Number(v))} />
                  <Bar dataKey="ca" name="CA en euros" fill="#1a1a1a" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="ca" position="top" style={{ fontSize: 11, fill: '#1a1a1a', fontWeight: 700 }} formatter={(v: unknown) => Number(v) > 0 ? Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : ''} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'CA total', value: fmt(totalCA) },
                { label: 'Factures payees', value: '' + facturesFiltrees.filter(f => f.statut === 'payee').length },
                { label: 'Factures en attente', value: '' + facturesFiltrees.filter(f => f.statut === 'en_attente' || f.statut === 'emise').length },
                { label: 'Taux encaissement', value: totalCA > 0 ? (Math.round(facturesFiltrees.filter(f => f.statut === 'payee').reduce((s, f) => s + f.montant_ht, 0) / totalCA * 100) + '%') : '-' },
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
        {activeTab === 'Partenaires' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Repartition par pays</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={paysData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ef" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#8b7355' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" name="Partenaires" fill="#1a1a1a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Repartition par type</div>
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
              { label: 'Total partenaires', value: '' + entreprises.length },
              { label: 'Verifies', value: '' + entreprises.filter(e => e.statut === 'Verifie').length },
              { label: 'En cours', value: '' + entreprises.filter(e => e.statut === 'en_cours').length },
              { label: 'Pays couverts', value: '' + new Set(entreprises.map(e => e.pays)).size },
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
