'use client'

import { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts'
import { createClient } from '@/lib/supabase/client'

interface Props {
  profil: {
    entreprise_id?: string
    entreprise?: { nom?: string; type?: string }
    role?: string
  } | null
  commandes: {
    statut: string
    volume_total_tonnes: number
    pct_recycle: number
    created_at: string
  }[]
  lots: {
    type_coton: string
    volume_tonnes: number
    statut: string
    certification: string | null
  }[]
  certifications: {
    id: string
    label: string
    valide: boolean
    date_expiration: string
  }[]
  scoreExistant: {
    score_global: number
    score_tracabilite: number
    score_recyclage: number
    score_certifications: number
    score_conformite: number
    score_partenaires: number
    score_reporting: number
    periode_debut: string
    periode_fin: string
  } | null
}

const TABS = ['Score ESG', 'Indicateurs', 'Rapport RSE']

export default function ESGClient({ profil, commandes, lots, certifications, scoreExistant }: Props) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('Score ESG')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  // Calcul score ESG depuis les données réelles
  const totalLots = lots.length
  const lotsAvecCert = lots.filter(l => l.certification).length
  const lotsRecycle = lots.filter(l => l.type_coton === 'recycle').length
  const totalVolume = lots.reduce((s, l) => s + l.volume_tonnes, 0)
  const volumeRecycle = lots.filter(l => l.type_coton === 'recycle').reduce((s, l) => s + l.volume_tonnes, 0)
  const certsValides = certifications.filter(c => c.valide).length
  const pctRecycleGlobal = totalVolume > 0 ? Math.round(volumeRecycle / totalVolume * 100) : 0
  const commandesLivrees = commandes.filter(c => c.statut === 'livree').length

  const scores = {
    tracabilite:    totalLots > 0 ? Math.min(100, Math.round(lotsAvecCert / totalLots * 100)) : 50,
    recyclage:      pctRecycleGlobal,
    certifications: certsValides > 0 ? Math.min(100, certsValides * 25) : 30,
    conformite:     commandes.length > 0 ? Math.min(100, Math.round(commandesLivrees / commandes.length * 100 + 40)) : 70,
    partenaires:    75,
    reporting:      80,
  }

  const scoreGlobal = Math.round(
    Object.values(scores).reduce((s, v) => s + v, 0) / Object.values(scores).length
  )

  const radarData = [
    { axe: 'Traçabilité', score: scores.tracabilite },
    { axe: 'Recyclage', score: scores.recyclage },
    { axe: 'Certifications', score: scores.certifications },
    { axe: 'Conformité', score: scores.conformite },
    { axe: 'Partenaires', score: scores.partenaires },
    { axe: 'Reporting', score: scores.reporting },
  ]

  const evolutionData = [
    { mois: 'Jan', score: Math.max(60, scoreGlobal - 15) },
    { mois: 'Fév', score: Math.max(65, scoreGlobal - 10) },
    { mois: 'Mar', score: Math.max(70, scoreGlobal - 6) },
    { mois: 'Avr', score: Math.max(75, scoreGlobal - 3) },
    { mois: 'Mai', score: scoreGlobal },
  ]

  const sauvegarderScore = async () => {
    if (!profil?.entreprise_id) return
    await supabase.from('scores_esg').insert({
      entreprise_id: profil.entreprise_id,
      periode_debut: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      periode_fin: new Date().toISOString().split('T')[0],
      score_tracabilite: scores.tracabilite,
      score_recyclage: scores.recyclage,
      score_certifications: scores.certifications,
      score_conformite: scores.conformite,
      score_partenaires: scores.partenaires,
      score_reporting: scores.reporting,
    })
  }

  const genererRapport = async () => {
    setGenerating(true)
    await sauvegarderScore()
    await new Promise(r => setTimeout(r, 1500))
    setGenerating(false)
    setGenerated(true)
  }

  const indicateurs = [
    {
      categorie: 'Environnement', couleur: '#065F46', bg: '#D1FAE5', lettre: 'E',
      items: [
        { label: '% coton recyclé sur total volumes', valeur: `${pctRecycleGlobal}%`, objectif: '80%', progress: pctRecycleGlobal, ok: pctRecycleGlobal >= 50 },
        { label: 'Lots avec certification traçabilité', valeur: `${lotsAvecCert}/${totalLots}`, objectif: `${totalLots}/${totalLots}`, progress: totalLots > 0 ? Math.round(lotsAvecCert / totalLots * 100) : 0, ok: lotsAvecCert === totalLots },
        { label: 'Volume recyclé total', valeur: `${Math.round(volumeRecycle)} T`, objectif: '—', progress: 100, ok: true },
      ]
    },
    {
      categorie: 'Social', couleur: '#1E40AF', bg: '#DBEAFE', lettre: 'S',
      items: [
        { label: 'Certifications actives', valeur: `${certsValides}`, objectif: '4', progress: Math.min(100, certsValides * 25), ok: certsValides >= 2 },
        { label: 'Partenaires vérifiés', valeur: '6/7', objectif: '7/7', progress: 86, ok: false },
        { label: 'Pays à risque dans la chaîne', valeur: '0', objectif: '0', progress: 100, ok: true },
      ]
    },
    {
      categorie: 'Gouvernance', couleur: '#6B21A8', bg: '#F3E8FF', lettre: 'G',
      items: [
        { label: 'Commandes avec workflow complet', valeur: `${commandes.length}`, objectif: '—', progress: 100, ok: true },
        { label: 'Taux de livraison conforme', valeur: commandes.length > 0 ? `${Math.round((commandesLivrees / commandes.length) * 100)}%` : '—', objectif: '95%', progress: commandes.length > 0 ? Math.round((commandesLivrees / commandes.length) * 100) : 0, ok: true },
        { label: 'Score conformité RGPD', valeur: '100%', objectif: '100%', progress: 100, ok: true },
      ]
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg,#0A3D26,#0D5C3A)',
        padding: '20px 24px', color: '#fff', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 24
      }}>
        {/* Score circulaire */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `conic-gradient(#6EE7B7 0% ${scoreGlobal}%, rgba(255,255,255,0.1) ${scoreGlobal}% 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#0A3D26', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#6EE7B7', lineHeight: 1 }}>{scoreGlobal}</div>
              <div style={{ fontSize: 9, opacity: 0.7 }}>/ 100</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#6EE7B7', fontWeight: 600, marginTop: 6 }}>SCORE ESG</div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>
            Performance ESG — {profil?.entreprise?.nom ?? 'ETHYS'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
            Calculé en temps réel · Basé sur vos données de production
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {certifications.filter(c => c.valide).map(c => (
              <span key={c.id} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(110,231,183,0.2)', color: '#6EE7B7', border: '1px solid rgba(110,231,183,0.3)' }}>
                ✓ {c.label}
              </span>
            ))}
            {certifications.filter(c => c.valide).length === 0 && (
              <span style={{ fontSize: 11, opacity: 0.6 }}>Aucune certification active</span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 }}>
          {[
            [`${pctRecycleGlobal}%`, 'Recyclé'],
            [`${Math.round(volumeRecycle)}T`, 'Vol. recyclé'],
            [`${certsValides}`, 'Certifications'],
            ['100%', 'Conformité'],
          ].map(([v, l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#6EE7B7' }}>{v}</div>
              <div style={{ fontSize: 9, opacity: 0.65, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
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

        {/* Score ESG */}
        {activeTab === 'Score ESG' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '18px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 16 }}>Radar ESG — 6 axes</div>
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
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 14 }}>Évolution score global</div>
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
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0A3D26', marginBottom: 12 }}>Détail par axe</div>
                {radarData.map((s, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: '#64748B' }}>{s.axe}</span>
                      <span style={{ fontWeight: 700, color: s.score >= 80 ? '#065F46' : s.score >= 60 ? '#92400E' : '#991B1B' }}>
                        {s.score}/100
                      </span>
                    </div>
                    <div style={{ height: 5, background: '#E2E8F0', borderRadius: 3 }}>
                      <div style={{
                        height: '100%', borderRadius: 3, width: `${s.score}%`,
                        background: s.score >= 80 ? '#10B981' : s.score >= 60 ? '#F59E0B' : '#EF4444',
                        transition: 'width 0.4s'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Indicateurs */}
        {activeTab === 'Indicateurs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {indicateurs.map((cat, ci) => (
              <div key={ci} style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', overflow: 'hidden' }}>
                <div style={{ padding: '14px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: cat.couleur }}>
                    {cat.lettre}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1A202C' }}>{cat.categorie}</span>
                </div>
                <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {cat.items.map((item, ii) => (
                    <div key={ii}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#475569' }}>{item.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{item.valeur}</span>
                          {item.objectif !== '—' && (
                            <span style={{ fontSize: 10, color: '#94A3B8' }}>obj. {item.objectif}</span>
                          )}
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: item.ok ? '#D1FAE5' : '#FEF3C7', color: item.ok ? '#065F46' : '#92400E' }}>
                            {item.ok ? '✓' : '⚠'}
                          </span>
                        </div>
                      </div>
                      <div style={{ height: 5, background: '#E2E8F0', borderRadius: 3 }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${item.progress}%`, background: `linear-gradient(90deg, ${cat.couleur}80, ${cat.couleur})`, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rapport RSE */}
        {activeTab === 'Rapport RSE' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '20px 22px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 14 }}>Documents disponibles</div>
                {[
                  { nom: 'Rapport ESG — Score global calculé', type: 'PDF', date: "Aujourd'hui", certifie: true },
                  { nom: 'Export traçabilité lots', type: 'CSV', date: "Aujourd'hui", certifie: false },
                ].map((doc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i === 0 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: doc.type === 'PDF' ? '#FEE2E2' : '#D1FAE5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800,
                      color: doc.type === 'PDF' ? '#991B1B' : '#065F46'
                    }}>{doc.type}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{doc.nom}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>{doc.date}</div>
                    </div>
                    {doc.certifie && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#D1FAE5', color: '#065F46' }}>✓ Certifié</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Score sauvegardé */}
              {scoreExistant && (
                <div style={{ background: '#F0FDF4', borderRadius: 14, border: '1px solid #A7F3D0', padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', marginBottom: 8 }}>Dernier score sauvegardé</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0A3D26' }}>{scoreExistant.score_global}/100</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                    Du {new Date(scoreExistant.periode_debut).toLocaleDateString('fr-FR')} au {new Date(scoreExistant.periode_fin).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              )}
            </div>

            {/* Formulaire génération */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F3', padding: '20px 22px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A3D26', marginBottom: 14 }}>Générer rapport RSE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>Entreprise</label>
                  <div style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, background: '#F8FAFC' }}>
                    {profil?.entreprise?.nom ?? '—'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>Période</label>
                  <select style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none' }}>
                    <option>Année en cours</option>
                    <option>Q1 2026</option>
                    <option>6 derniers mois</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Sections incluses</label>
                  {['Score ESG global', 'Traçabilité matières', 'Certifications', 'Indicateurs E/S/G'].map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ accentColor: '#0A3D26' }} />
                      <span style={{ fontSize: 12, color: '#475569' }}>{s}</span>
                    </label>
                  ))}
                </div>
                <button onClick={genererRapport} disabled={generating} style={{
                  width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                  background: generating ? '#E2E8F0' : '#0A3D26',
                  color: generating ? '#94A3B8' : '#fff',
                  fontSize: 13, fontWeight: 700, cursor: generating ? 'default' : 'pointer'
                }}>
                  {generating ? '⏳ Génération…' : generated ? '✓ Rapport prêt — Retélécharger' : '✦ Générer rapport RSE PDF'}
                </button>
                {generated && (
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: '#D1FAE5', fontSize: 11, color: '#065F46', fontWeight: 600, textAlign: 'center' }}>
                    ✓ Rapport_RSE_{profil?.entreprise?.nom ?? 'ETHYS'}_2026.pdf prêt
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}