import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('*, entreprise:entreprises(*)')
    .eq('id', user.id)
    .single()

  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('entreprise_id', profil?.entreprise_id ?? '')
    .order('created_at', { ascending: false })

  const { data: documents } = await supabase
    .from('documents_entreprise')
    .select('*')
    .eq('entreprise_id', profil?.entreprise_id ?? '')

  const entreprise = profil?.entreprise as Record<string, string> | null

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Hero */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: 16, padding: '28px 32px', marginBottom: 22,
        color: '#fff', display: 'flex', alignItems: 'center', gap: 24
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'rgba(255,255,255,0.12)',
          border: '2px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 900, flexShrink: 0
        }}>
          {entreprise?.nom?.slice(0, 2).toUpperCase() ?? 'TL'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 900 }}>
              {entreprise?.nom ?? user.email}
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: entreprise?.statut === 'verifie' ? '#2d5016' : '#b8860b',
              color: '#fff'
            }}>
              {entreprise?.statut === 'verifie' ? '✓ Profil vérifié' : '⏳ En cours de vérification'}
            </span>
          </div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            {entreprise?.type ?? profil?.role} · {entreprise?.ville ?? ''}{entreprise?.pays ? ', ' + entreprise.pays : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4 }}>Rôle plateforme</div>
          <div style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: 'rgba(255,255,255,0.12)', color: '#c2956e',
            textTransform: 'capitalize'
          }}>{profil?.role}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Informations légales */}
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden' }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid #F1F5F9', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
            Informations légales
          </div>
          <div style={{ padding: '18px 22px' }}>
            {[
              ['Raison sociale', entreprise?.nom],
              ['Type', entreprise?.type],
              ['SIRET', entreprise?.siret ?? '—'],
              ['TVA', entreprise?.tva ?? '—'],
              ['Pays', entreprise?.pays],
              ['Ville', entreprise?.ville ?? '—'],
              ['Adresse', entreprise?.adresse ?? '—'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#94A3B8', width: 140, flexShrink: 0 }}>{l}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{v ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden' }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid #F1F5F9', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
              Contact
            </div>
            <div style={{ padding: '18px 22px' }}>
              {[
                ['Email', entreprise?.email_contact ?? user.email],
                ['Téléphone', entreprise?.telephone ?? '—'],
                ['Site web', entreprise?.site_web ?? '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#94A3B8', width: 100, flexShrink: 0 }}>{l}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden' }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid #F1F5F9', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
              Certifications ({certifications?.length ?? 0})
            </div>
            <div style={{ padding: '14px 18px' }}>
              {!certifications || certifications.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '10px 0' }}>
                  Aucune certification enregistrée
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {certifications.map((c: Record<string, string>, i: number) => (
                    <span key={i} style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: c.valide ? '#D1FAE5' : '#FEE2E2',
                      color: c.valide ? '#065F46' : '#991B1B'
                    }}>
                      {c.valide ? '✓' : '✕'} {c.label} — {c.date_expiration}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e3d8', overflow: 'hidden' }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid #F1F5F9', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
              Documents ({documents?.length ?? 0})
            </div>
            <div style={{ padding: '14px 18px' }}>
              {!documents || documents.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '10px 0' }}>
                  Aucun document déposé
                </div>
              ) : (
                documents.map((d: Record<string, string>, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>📄</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{d.nom}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: d.verifie ? '#10B981' : '#94A3B8' }}>
                      {d.verifie ? '✓ Vérifié' : 'En attente'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    {/* Section suppression compte */}
    <div style={{ maxWidth: 1200, margin: '20px auto', padding: '0 24px' }}>
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #fde8e8', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#8b3a3a', marginBottom: 4 }}>Supprimer mon compte</div>
          <div style={{ fontSize: 12, color: '#8b7355' }}>Cette action est irréversible. Toutes vos données seront supprimées conformément au RGPD.</div>
        </div>
        <a href="/profil/supprimer" style={{ padding: '8px 16px', borderRadius: 4, border: '1.5px solid #8b3a3a', background: '#fff', color: '#8b3a3a', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' }}>
          Supprimer mon compte
        </a>
      </div>
    </div>
    </div>
  )
}
