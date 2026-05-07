export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8FA', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '40px 24px' }}>
        <img src="/logo.png" alt="TEXTILE LOOP" style={{ width: 120, height: 'auto', margin: '0 auto 32px', display: 'block' }} />
        <div style={{ fontSize: 80, fontWeight: 900, color: '#0A3D26', lineHeight: 1, marginBottom: 16 }}>404</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1A202C', marginBottom: 12 }}>Page introuvable</div>
        <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 32 }}>
          La page que vous recherchez n'existe pas ou a été déplacée. Vérifiez l'URL ou retournez au tableau de bord.
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href="/dashboard" style={{ padding: '10px 24px', borderRadius: 10, background: '#0A3D26', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Retour au dashboard
          </a>
          <a href="/login" style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #EEF0F3', background: '#fff', color: '#475569', fontSize: 13, textDecoration: 'none' }}>
            Se connecter
          </a>
        </div>
      </div>
    </div>
  )
}
