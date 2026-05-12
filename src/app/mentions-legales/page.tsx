'use client'

import { useRouter } from 'next/navigation'

export default function MentionsLegalesPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#8b7355', fontSize: 13, marginBottom: 24, padding: 0 }}>
            ← Retour
          </button>
          <img src="/logo_ethys.png" alt="ETHYS" style={{ width: 60, marginBottom: 16 }} />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>Mentions légales & Politique de confidentialité</h1>
          <p style={{ fontSize: 13, color: '#8b7355' }}>Dernière mise à jour : mai 2026</p>
        </div>

        {/* Editeur */}
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '28px 32px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>1. Éditeur du site</h2>
          <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.8, margin: 0 }}>
            <strong>TEXTILE LOOP</strong><br />
            15 rue d'Upsal — 67000 Strasbourg — France<br />
            SIRET : 810 401 018 00025<br />
            Email : contact@textile-loop.com<br />
            Responsable de la publication : Jérôme ORIOL
          </p>
        </div>

        {/* Hebergement */}
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '28px 32px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>2. Hébergement</h2>
          <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.8, margin: 0 }}>
            La plateforme ETHYS est hébergée par :<br />
            <strong>Vercel Inc.</strong> — 340 Pine Street, Suite 701, San Francisco, CA 94104, USA<br />
            <strong>Supabase Inc.</strong> — données stockées dans des centres de données situés en Europe (Union Européenne)<br />
            Ces prestataires disposent de garanties appropriées conformément au RGPD (clauses contractuelles types).
          </p>
        </div>

        {/* Donnees personnelles */}
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '28px 32px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>3. Données personnelles — Responsable de traitement</h2>
          <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.8, margin: '0 0 12px' }}>
            Conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679), le responsable du traitement est :
          </p>
          <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.8, margin: 0 }}>
            <strong>Jérôme ORIOL</strong> — TEXTILE LOOP<br />
            15 rue d'Upsal — 67000 Strasbourg — France<br />
            Email : contact@textile-loop.com
          </p>
        </div>

        {/* Donnees collectees */}
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '28px 32px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>4. Données collectées et finalités</h2>
          <div style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.8 }}>
            <p style={{ margin: '0 0 12px' }}>Dans le cadre de l'utilisation de la plateforme ETHYS, les données suivantes sont collectées :</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f5f3ef' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e8e3d8', fontWeight: 600 }}>Donnée</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e8e3d8', fontWeight: 600 }}>Finalité</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', border: '1px solid #e8e3d8', fontWeight: 600 }}>Durée de conservation</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Email professionnel', 'Authentification et communications', '3 ans après dernière connexion'],
                  ['Prénom, Nom', 'Identification sur la plateforme', '3 ans après dernière connexion'],
                  ['Téléphone', 'Contact professionnel', '3 ans après dernière connexion'],
                  ['Adresse professionnelle', 'Facturation et traçabilité', '10 ans (obligation légale)'],
                  ['Données de commandes', 'Traçabilité textile et facturation', '10 ans (obligation légale)'],
                  ['Logs de connexion', 'Sécurité de la plateforme', '1 an'],
                ].map(([d, f, c]) => (
                  <tr key={d}>
                    <td style={{ padding: '8px 12px', border: '1px solid #e8e3d8' }}>{d}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e8e3d8' }}>{f}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e8e3d8' }}>{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Droits */}
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '28px 32px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>5. Vos droits</h2>
          <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.8, margin: '0 0 12px' }}>
            Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
          </p>
          <ul style={{ fontSize: 14, color: '#4a5568', lineHeight: 2, margin: 0, paddingLeft: 20 }}>
            <li><strong>Droit d'accès</strong> — obtenir une copie de vos données</li>
            <li><strong>Droit de rectification</strong> — corriger vos données inexactes</li>
            <li><strong>Droit à l'effacement</strong> — demander la suppression de votre compte</li>
            <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition</strong> — vous opposer à certains traitements</li>
          </ul>
          <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.8, margin: '16px 0 0' }}>
            Pour exercer ces droits, contactez-nous à : <strong>contact@textile-loop.com</strong><br />
            Nous répondrons dans un délai maximum de 30 jours.<br />
            Vous pouvez également introduire une réclamation auprès de la <strong>CNIL</strong> (www.cnil.fr).
          </p>
        </div>

        {/* Cookies */}
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', padding: '28px 32px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>6. Cookies</h2>
          <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.8, margin: 0 }}>
            La plateforme ETHYS utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session d'authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
          </p>
        </div>

        {/* Contact */}
        <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '24px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#e8e3d8', margin: '0 0 8px' }}>Une question sur vos données personnelles ?</p>
          <a href="mailto:contact@textile-loop.com" style={{ fontSize: 14, fontWeight: 700, color: '#c2956e', textDecoration: 'none' }}>contact@textile-loop.com</a>
        </div>

      </div>
    </div>
  )
}
