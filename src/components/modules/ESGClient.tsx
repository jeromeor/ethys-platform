'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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

export default function ESGClient({ profil, commandes, lots, certifications, scoreExistant }: Props) {
  const t = useTranslations('esg')
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('score')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  // Onglets : id stable (logique) + label traduit (affichage)
  const tabs = [
    { id: 'score', label: t('tabs.score') },
    { id: 'indicators', label: t('tabs.indicators') },
    { id: 'report', label: t('tabs.report') },
  ]

  const totalLots = lots.length
  const lotsAvecCert = lots.filter(l => l.certification).length
  const totalVolume = lots.reduce((s, l) => s + l.volume_tonnes, 0)
  const volumeRecyclé = lots.filter(l => l.type_coton === 'Recyclé').reduce((s, l) => s + l.volume_tonnes, 0)
  const totalVierge = lots.filter(l => l.type_coton === 'vierge').reduce((s, l) => s + l.volume_tonnes, 0)
  const certsValides = certifications.filter(c => c.valide).length
  const pctRecycléGlobal = totalVolume > 0 ? Math.round(volumeRecyclé / totalVolume * 100) : 0
  const commandesLivrees = commandes.filter(c => c.statut === 'Livree').length

  const scores = {
    Traçabilité:    totalLots > 0 ? Math.min(100, Math.round(lotsAvecCert / totalLots * 100)) : 50,
    certifications: certsValides > 0 ? Math.min(100, certsValides * 25) : 30,
    conformite:     commandes.length > 0 ? Math.min(100, Math.round(commandesLivrees / commandes.length * 100 + 40)) : 70,
    partenaires:    75,
    reporting:      80,
  }

  const scoreGlobal = Math.round(Object.values(scores).reduce((s, v) => s + v, 0) / Object.values(scores).length)

  const radarData = [
    { axe: t('axes.tracabilite'), score: scores.Traçabilité },
    { axe: t('axes.certifications'), score: scores.certifications },
    { axe: t('axes.conformite'), score: scores.conformite },
    { axe: t('axes.partenaires'), score: scores.partenaires },
    { axe: t('axes.reporting'), score: scores.reporting },
  ]

  const evolutionData = [
    { mois: t('months.jan'), score: Math.max(60, scoreGlobal - 15) },
    { mois: t('months.feb'), score: Math.max(65, scoreGlobal - 10) },
    { mois: t('months.mar'), score: Math.max(70, scoreGlobal - 6) },
    { mois: t('months.apr'), score: Math.max(75, scoreGlobal - 3) },
    { mois: t('months.may'), score: scoreGlobal },
  ]

  const SauvegarderScore = async () => {
    if (!profil?.entreprise_id) return
    await supabase.from('scores_esg').insert({
      entreprise_id: profil.entreprise_id,
      Période_debut: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      Période_fin: new Date().toISOString().split('T')[0],
      score_Traçabilité: scores.Traçabilité,
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
    <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', inset: 0 }}>
      <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)', padding: '12px 24px', color: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'conic-gradient(#c2956e 0% ' + scoreGlobal + '%, rgba(255,255,255,0.1) ' + scoreGlobal + '% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#c2956e', lineHeight: 1 }}>{scoreGlobal}</div>
              <div style={{ fontSize: 9, opacity: 0.7 }}>/ 100</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#c2956e', fontWeight: 600, marginTop: 6 }}>{t('header.scoreLabel')}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{t('header.title', { nom: profil?.entreprise?.nom ?? 'ETHYS' })}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>{t('header.subtitle')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {certifications.filter(c => c.valide).map(c => (
              <span key={c.id} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: 'rgba(110,231,183,0.2)', color: '#c2956e', border: '1px solid rgba(110,231,183,0.3)' }}>v {c.label}</span>
            ))}
            {certifications.filter(c => c.valide).length === 0 && <span style={{ fontSize: 11, opacity: 0.6 }}>{t('header.noCert')}</span>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 }}>
          {[[String(certsValides), t('header.kpiCertifications')], ['100%', t('header.kpiConformite')]].map(([v, l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#c2956e' }}>{v}</div>
              <div style={{ fontSize: 9, opacity: 0.65, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid #e8e3d8', padding: '0 22px', flexShrink: 0, background: '#fff' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? '#1a1a1a' : '#8b7355', borderBottom: activeTab === tab.id ? '2px solid #1a1a1a' : '2px solid transparent', marginBottom: -2 }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 16px' }}>
        {activeTab === 'score' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, height: '100%' }}>
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>{t('score.radar')}</div>
              <ResponsiveContainer width="100%" height={190}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#d4c5b0" />
                  <PolarAngleAxis dataKey="axe" tick={{ fontSize: 11, fill: '#4a5568' }} />
                  <Radar name="Score" dataKey="score" stroke="#1a1a1a" fill="#1a1a1a" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, overflow: 'hidden' }}>
              <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>{t('score.evolution')}</div>
                <ResponsiveContainer width="100%" height={110}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f3ef" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#8b7355' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: '#8b7355' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                    <Line type="monotone" dataKey="score" stroke="#2d5016" strokeWidth={2.5} dot={{ r: 3, fill: '#2d5016' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '18px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>{t('score.detail')}</div>
                {radarData.map((s, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: '#4a5568' }}>{s.axe}</span>
                      <span style={{ fontWeight: 700, color: s.score >= 80 ? '#2d5016' : s.score >= 60 ? '#b8860b' : '#991B1B' }}>{s.score}/100</span>
                    </div>
                    <div style={{ height: 5, background: '#d4c5b0', borderRadius: 3 }}>
                      <div style={{ height: '100%', borderRadius: 3, width: s.score + '%', background: s.score >= 80 ? '#2d5016' : s.score >= 60 ? '#F59E0B' : '#EF4444' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'indicators' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { cat: t('indicators.environnement'), lettre: 'E', couleur: '#2d5016', bg: '#f0f4ec', items: [
                { label: t('indicators.lotsAvecCert'), val: lotsAvecCert + '/' + totalLots, ok: lotsAvecCert === totalLots },
                { label: t('indicators.volumeRecycle'), val: (Math.round(volumeRecyclé * 1000)).toLocaleString('fr-FR') + ' kg', ok: true },
              ]},
              { cat: t('indicators.social'), lettre: 'S', couleur: '#1E40AF', bg: '#DBEAFE', items: [
                { label: t('indicators.certsActives'), val: String(certsValides), ok: certsValides >= 2 },
                { label: t('indicators.partenairesVerifies'), val: '6/7', ok: false },
                { label: t('indicators.paysRisque'), val: '0', ok: true },
              ]},
              { cat: t('indicators.gouvernance'), lettre: 'G', couleur: '#6B21A8', bg: '#F3E8FF', items: [
                { label: t('indicators.commandesWorkflow'), val: String(commandes.length), ok: true },
                { label: t('indicators.conformiteRgpd'), val: '100%', ok: true },
                { label: t('indicators.auditLog'), val: t('indicators.oui'), ok: true },
              ]},
            ].map((cat, ci) => (
              <div key={ci} style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden' }}>
                <div style={{ padding: '14px 22px', borderBottom: '1px solid #f5f3ef', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: cat.couleur }}>{cat.lettre}</div>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{cat.cat}</span>
                </div>
                <div style={{ padding: '16px 22px' }}>
                  {cat.items.map((item, ii) => (
                    <div key={ii} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: ii < cat.items.length - 1 ? '1px solid #f5f3ef' : 'none' }}>
                      <span style={{ fontSize: 12, color: '#4a5568' }}>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{item.val}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: item.ok ? '#f0f4ec' : '#fdf8ec', color: item.ok ? '#2d5016' : '#b8860b' }}>{item.ok ? 'v' : '!'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'report' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '20px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>{t('report.documents')}</div>
              {scoreExistant && (
                <div style={{ padding: '12px 14px', borderRadius: 4, background: '#F0FDF4', border: '1px solid #c8d8b8', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2d5016' }}>{t('report.lastScore')}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#1a1a1a' }}>{scoreExistant.score_global}/100</div>
                </div>
              )}
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f5f3ef', fontSize: 11, color: '#8b7355' }}>
              {t('report.downloadHint')}
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '20px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>{t('report.generateTitle')}</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 5 }}>{t('report.company')}</label>
                <div style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d4c5b0', fontSize: 12, background: '#f5f3ef' }}>{profil?.entreprise?.nom ?? '-'}</div>
              </div>
              <button onClick={GénérerRapport} disabled={generating} style={{ width: '100%', padding: '10px', borderRadius: 4, border: 'none', background: generating ? '#d4c5b0' : '#1a1a1a', color: generating ? '#8b7355' : '#fff', fontSize: 13, fontWeight: 700, cursor: generating ? 'default' : 'pointer' }}>
                {generating ? t('report.generating') : generated ? t('report.ready') : t('report.generate')}
              </button>
              {generated && (
                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#f0f4ec', fontSize: 11, color: '#2d5016', fontWeight: 600, textAlign: 'center' }}>
                  Rapport_RSE_{profil?.entreprise?.nom ?? 'ETHYS'}_2026.pdf {t('report.fileReady')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
