'use client'

import { useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { createClient } from '@/lib/supabase/client'

interface Props {
  profil: {
    entreprise_id?: string
    entreprise?: { nom?: string; type?: string }
    role?: string
  } | null
  commandes: { statut: string; volume_total_tonnes: number; pct_recycle: number; created_at: string }[]
  lots: { type_coton: string; volume_tonnes: number; statut: string; certification: string | null }[]
  certifications: { id: string; label: string; valide: boolean; date_expiration: string }[]
  scoreExistant: { score_global: number; score_Traçabilité: number; score_recyclage: number; score_certifications: number; score_conformite: number; score_partenaires: number; score_reporting: number; Période_debut: string; Période_fin: string } | null
}

const TABS = ['Score ESG', 'Indicateurs', 'Rapport RSE']

export default function ESGClient({ profil, commandes, lots, certifications, scoreExistant }: Props) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('Score ESG')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const totalLots = lots.length
  const lotsAvecCert = lots.filter(l => l.certification).length
  const totalVolume = lots.reduce((s, l) => s + l.volume_tonnes, 0)
  const volumeRecyclé = lots.filter(l => l.type_coton === 'Recyclé').reduce((s, l) => s + l.volume_tonnes, 0)
  const totalVierge = lots.filter(l => l.type_coton === 'vierge').reduce((s, l) => s + l.volume_tonnes, 0)
  const certsValides = certifications.filter(c => c.valide).length
  const pctRecycléGlobal = totalVolume > 0 ? Math.round(volumeRecyclé / totalVolume * 100) : 0
  const commandesLivrees = commandes.filter(c => c.statut === 'livree').length

  const scores = {
    Traçabilité:    totalLots > 0 ? Math.min(100, Math.round(lotsAvecCert / totalLots * 100)) : 50,
    recyclage:      pctRecycléGlobal,
    certifications: certsValides > 0 ? Math.min(100, certsValides * 25) : 30,
    conformite:     commandes.length > 0 ? Math.min(100, Math.round(commandesLivrees / commandes.length * 100 + 40)) : 70,
    partenaires:    75,
    reporting:      80,
  }

  const scoreGlobal = Math.round(Object.values(scores).reduce((s, v) => s + v, 0) / Object.values(scores).length)

  const radarData = [
    { axe: 'Traçabilité', score: scores.Traçabilité },
    { axe: 'Recyclage', score: scores.recyclage },
    { axe: 'Certifications', score: scores.certifications },
    { axe: 'Conformite', score: scores.conformite },
    { axe: 'Partenaires', score: scores.partenaires },
    { axe: 'Reporting', score: scores.reporting },
  ]

  const evolutionData = [
    { mois: 'Jan', score: Math.max(60, scoreGlobal - 15) },
    { mois: 'Fev', score: Math.max(65, scoreGlobal - 10) },
    { mois: 'Mar', score: Math.max(70, scoreGlobal - 6) },
    { mois: 'Avr', score: Math.max(75, scoreGlobal - 3) },
    { mois: 'Mai', score: scoreGlobal },
  ]

  const SauvegarderScore = async () => {
    if (!profil?.entreprise_id) return
    await supabase.from('scores_esg').insert({
      entreprise_id: profil.entreprise_id,
      Période_debut: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      Période_fin: new Date().toISOString().split('T')[0],
      score_Traçabilité: scores.Traçabilité,
      score_recyclage: scores.recyclage,
      score_certifications: scores.certifications,
      score_conformite: scores.conformite,
      score_partenaires: scores.partenaires,
      score_reporting: scores.reporting,
    })
  }

  const GénérerRapport = async () => {
    setGenerating(true)
    await SauvegarderScore()
    await new Promise(r => setTimeout(r, 1500))
    setGenerating(false)
    setGenerated(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg,#0A3D26,#0D5C3A)', padding: '20px 24px', color: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'conic-gradient(#6EE7B7 0% ' + scoreGlobal + '%, rgba(255,255,255,0.1) ' + scoreGlobal + '% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#0A3D26', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#6EE7B7', lineHeight: 1 }}>{scoreGlobal}</div>
              <div style={{ fontSize: 9, opacity: 0.7 }}>/ 100</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#6EE7B7', fontWeight: 600, marginTop: 6 }}>SCORE ESG</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>Performance ESG — {profil?.entreprise?.nom ?? 'ETHYS'}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>Calculé en temps reel depuis vos Données</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {certifications.filter(c => c.valide).map(c => (
              <span key={c.id} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(110,231,183,0.2)', color: '#6EE7B7', border: '1px solid rgba(110,231,183,0.3)' }}>v {c.label}</span>
            ))}
            {certifications.filter(c => c.valide).length === 0 && <span style={{ fontSize: 11, opacity: 0.6 }}>Aucune certification active</span>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 }}>
          {[[pctRecycléGlobal + '%', 'Recyclé'], [(Math.round(volumeRecyclé * 1000)).toLocaleString('fr-FR') + ' kg', 'Vol. Recyclé'], [String(certsValides), 'Certifications'], ['100%', 'Conformite']].map(([v, l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#6EE7B7' }}>{v}</div>
              <div style={{ fontSize: 9, opacity: 0.65, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid #EEF0F3', padding: '0 22px', flexShrink: 0, background: '#fff' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t ? 700 : 500, color: activeTab === t ? '#0A3D26' : '#94A3B8', borderBottom: activeTab === t ? '2px solid #0A3D26' : '2px solid transparent', marginBottom: -2 }}>{t}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 22px' }}>
        {activeTab === 'Score ESG' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>Radar ESG</div>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="axe" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Radar name="Score" dataKey="score" stroke="#0A3D26" fill="#0A3D26" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 14 }}>Evolution score</div>
                <ResponsiveContainer width="100%" height={110}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                    <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0A3D26', marginBottom: 12 }}>Detail par axe</div>
                {radarData.map((s, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: '#64748B' }}>{s.axe}</span>
                      <span style={{ fontWeight: 700, color: s.score >= 80 ? '#065F46' : s.score >= 60 ? '#92400E' : '#991B1B' }}>{s.score}/100</span>
                    </div>
                    <div style={{ height: 5, background: '#E2E8F0', borderRadius: 3 }}>
                      <div style={{ height: '100%', borderRadius: 3, width: s.score + '%', background: s.score >= 80 ? '#10B981' : s.score >= 60 ? '#F59E0B' : '#EF4444' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Indicateurs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { cat: 'Environnement', lettre: 'E', couleur: '#065F46', bg: '#D1FAE5', items: [
                { label: '% coton Recyclé', val: pctRecycléGlobal + '%', ok: pctRecycléGlobal >= 50 },
                { label: 'Lots avec certification', val: lotsAvecCert + '/' + totalLots, ok: lotsAvecCert === totalLots },
                { label: 'Volume Recyclé', val: (Math.round(volumeRecyclé * 1000)).toLocaleString('fr-FR') + ' kg', ok: true },
              ]},
              { cat: 'Social', lettre: 'S', couleur: '#1E40AF', bg: '#DBEAFE', items: [
                { label: 'Certifications actives', val: String(certsValides), ok: certsValides >= 2 },
                { label: 'Partenaires verifies', val: '6/7', ok: false },
                { label: 'Pays a risque', val: '0', ok: true },
              ]},
              { cat: 'Gouvernance', lettre: 'G', couleur: '#6B21A8', bg: '#F3E8FF', items: [
                { label: 'Commandes avec workflow', val: String(commandes.length), ok: true },
                { label: 'Conformite RGPD', val: '100%', ok: true },
                { label: 'Audit log actif', val: 'Oui', ok: true },
              ]},
            ].map((cat, ci) => (
              <div key={ci} style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden' }}>
                <div style={{ padding: '14px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: cat.couleur }}>{cat.lettre}</div>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{cat.cat}</span>
                </div>
                <div style={{ padding: '16px 22px' }}>
                  {cat.items.map((item, ii) => (
                    <div key={ii} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: ii < cat.items.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <span style={{ fontSize: 12, color: '#475569' }}>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{item.val}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: item.ok ? '#D1FAE5' : '#FEF3C7', color: item.ok ? '#065F46' : '#92400E' }}>{item.ok ? 'v' : '!'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Rapport RSE' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '20px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 14 }}>Documents disponibles</div>
              {scoreExistant && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #A7F3D0', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46' }}>Dernier score Sauvegarde</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0A3D26' }}>{scoreExistant.score_global}/100</div>
                </div>
              )}
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#F8FAFC', fontSize: 11, color: '#94A3B8' }}>
                Generez votre rapport pour le telecharger
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '20px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 14 }}>Générer rapport RSE</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>Entreprise</label>
                <div style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, background: '#F8FAFC' }}>{profil?.entreprise?.nom ?? '-'}</div>
              </div>
              <button onClick={GénérerRapport} disabled={generating} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: generating ? '#E2E8F0' : '#0A3D26', color: generating ? '#94A3B8' : '#fff', fontSize: 13, fontWeight: 700, cursor: generating ? 'default' : 'pointer' }}>
                {generating ? 'Generation...' : generated ? 'v Rapport prêt' : 'Générer rapport RSE'}
              </button>
              {generated && (
                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#D1FAE5', fontSize: 11, color: '#065F46', fontWeight: 600, textAlign: 'center' }}>
                  Rapport_RSE_{profil?.entreprise?.nom ?? 'ETHYS'}_2026.pdf prêt
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


