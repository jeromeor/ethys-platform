'use client'

import { useState, useEffect, useRef } from 'react'
import NotificationBell from './NotificationBell'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`, label: 'Dashboard',    route: '/dashboard' },
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`, label: 'Profil',       route: '/profil' },
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`, label: 'Annuaire',     route: '/annuaire' },
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`, label: 'Support',      route: '/messagerie' },
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`, label: 'Commandes',    route: '/commandes' },
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>`, label: 'Production',   route: '/production' },
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 17v3"/></svg>`, label: 'QR Code',      route: '/qrcode' },
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`, label: 'Facturation',  route: '/facturation' },
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`, label: 'Reporting',    route: '/reporting' },
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 8C8 10 5.9 16.17 3.82 19.5A9.87 9.87 0 0 0 12 22c5.52 0 10-4.48 10-10S17 8 17 8z"/></svg>`, label: 'ESG',          route: '/esg' },
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`, label: 'Certification', route: '/certification' },
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`, label: 'Admin',        route: '/admin' },
  { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`, label: 'Entreprises',   route: '/admin/entreprises' },
]

interface Props {
  user: { email?: string } | null
  profil: {
    id?: string
    role?: string
    prenom?: string
    nom?: string
    entreprise?: { nom?: string }
  } | null
  children: React.ReactNode
}

export default function SidebarLayout({ user, profil, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(true)
  const [comptesEnAttente, setComptesEnAttente] = useState(0)
  const [certifEnAttente, setCertifEnAttente] = useState(0)
  const [demandesQrEnAttente, setDemandesQrEnAttente] = useState(0)
  const [annulationsEnAttente, setAnnulationsEnAttente] = useState(0)
  const [messagesNonLus, setMessagesNonLus] = useState(0)
  const [productionNonLus, setProductionNonLus] = useState(0)

  useEffect(() => {
    const chargerBadges = async () => {
      if (!profil?.id) return

      // Badges admin uniquement
      if (profil?.role === 'admin') {
        const { count: countComptes } = await supabase
  .from('profils_utilisateurs')
  .select('*', { count: 'exact', head: true })
  .is('entreprise_id', null)
  .neq('role', 'admin')

const { count: countCompteNotif } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', profil.id)
  .eq('type', 'compte_attente')
  .eq('lu', false)

setComptesEnAttente((countComptes ?? 0) + (countCompteNotif ?? 0))

        const { count: countCertif } = await supabase
  .from('declarations_ethys')
  .select('*', { count: 'exact', head: true })
  .eq('statut', 'en_attente')
setCertifEnAttente(countCertif ?? 0)

        const { count: countQR } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', profil.id)
  .eq('type', 'demande_qr')
  .eq('lu', false)
setDemandesQrEnAttente(countQR ?? 0)
      }

      // Badges notifications pour tous les utilisateurs
      const { count: countAnnulations } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profil.id)
        .in('type', ['demande_annulation', 'commande_annulee'])
        .eq('lu', false)
      setAnnulationsEnAttente(countAnnulations ?? 0)

      const { count: countMessages } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profil.id)
        .eq('type', 'message')
        .eq('lu', false)
      setMessagesNonLus(countMessages ?? 0)

      // Production : lots terminés + retours arrière
      const { count: countProduction } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profil.id)
        .in('type', ['lot_termine', 'retour_arriere', 'lot_bloque', 'declaration'])
        .eq('lu', false)
      setProductionNonLus(countProduction ?? 0)

      // Badge QR Code pour filature : notif qr_genere non lue
      if (profil?.role !== 'admin') {
        const { count: countQrGenere } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profil.id)
          .eq('type', 'qr_genere')
          .eq('lu', false)
        setDemandesQrEnAttente(countQrGenere ?? 0)
      }
    }
    
    chargerBadges()
    const interval = setInterval(chargerBadges, 30000)
    return () => clearInterval(interval)
  }, [profil?.role, profil?.id])

  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initiales = profil?.prenom && profil?.nom
    ? `${profil.prenom[0]}${profil.nom[0]}`.toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'TL'

  const nomEntreprise = profil?.entreprise?.nom ?? user?.email ?? ''

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: '#f5f3ef', color: '#1A202C', overflow: 'hidden' }}>

      <aside style={{ width: open ? 220 : 64, minWidth: open ? 220 : 64, background: '#ffffff', display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease', overflow: 'hidden', flexShrink: 0, borderRight: '1px solid #d4c5b0' }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #e8e3d8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src='/logo_ethys.png' alt='ETHYS' style={{ width: open ? 100 : 36, height: 'auto', transition: 'width 0.25s', flexShrink: 0 }} />
          {open && <div style={{ fontSize: 10, fontWeight: 600, color: '#1a1a1a', letterSpacing: 2, marginTop: 6, textTransform: 'uppercase' }}>Platform</div>}
        </div>

        <nav style={{ flex: 1, padding: '2px 8px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {navItems.filter(item => item.route !== '/admin' || profil?.role === 'admin').map(item => {
            const active = pathname === item.route || pathname.startsWith(item.route + '/')
            return (
              <button key={item.route} onClick={() => router.push(item.route)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: active ? '#e8e3d8' : 'transparent', color: active ? '#1a1a1a' : '#4a5568', fontSize: 13, fontWeight: active ? 600 : 400, textAlign: 'left', width: '100%' }}>
                <span style={{ flexShrink: 0, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: item.icon }} />
                {open && <span style={{ flex: 1 }}>{item.label}</span>}
                {open && item.route === '/admin' && comptesEnAttente > 0 && (
                  <span style={{ background: '#EF4444', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{comptesEnAttente}</span>
                )}
                {open && item.route === '/certification' && certifEnAttente > 0 && profil?.role === 'admin' && (
                  <span style={{ background: '#EF4444', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{certifEnAttente}</span>
                )}
                {open && item.route === '/qrcode' && demandesQrEnAttente > 0 && (
                  <span style={{ background: '#D97706', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{demandesQrEnAttente}</span>
                )}
                {open && item.route === '/commandes' && annulationsEnAttente > 0 && (
                  <span style={{ background: '#EF4444', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{annulationsEnAttente}</span>
                )}
                {open && item.route === '/messagerie' && messagesNonLus > 0 && (
                  <span style={{ background: '#EF4444', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{messagesNonLus}</span>
                )}
                {open && item.route === '/production' && productionNonLus > 0 && (
                  <span style={{ background: '#EF4444', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{productionNonLus}</span>
                )}
              </button>
            )
          })}
        </nav>
        <div style={{ padding: '8px 12px', borderTop: '1px solid #e8e3d8' }}>
          <a href="/mentions-legales" style={{ fontSize: 10, color: '#d4c5b0', textDecoration: 'none', display: 'block', textAlign: 'center' }}>Mentions legales</a>
        </div>
        <button onClick={() => setOpen(v => !v)} style={{ margin: '4px 8px', padding: '4px', borderRadius: 6, border: 'none', background: 'transparent', color: '#d4c5b0', cursor: 'pointer', fontSize: 11 }}>
          {open ? '←' : '→'}
        </button>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: 60, background: '#ffffff', borderBottom: '1px solid #e8e3d8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
            {navItems.find(n => pathname === n.route || pathname.startsWith(n.route + '/'))?.label ?? 'Dashboard'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationBell userId={profil?.id ?? ''} />
            <div ref={userMenuRef} style={{ fontSize: 12, color: '#8b7355', position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 4, border: '1.5px solid #e8e3d8', background: '#f5f3ef', cursor: 'pointer' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {initiales}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{nomEntreprise}</div>
                  <div style={{ fontSize: 10, color: '#8b7355', textTransform: 'capitalize' }}>{profil?.role ?? 'utilisateur'}</div>
                </div>
                <div style={{ fontSize: 10, color: '#8b7355', marginLeft: 4 }}>▼</div>
              </button>
              {showUserMenu && (
                <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', borderRadius: 6, border: '1px solid #e8e3d8', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', minWidth: 200, zIndex: 100, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f3ef' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{nomEntreprise}</div>
                    <div style={{ fontSize: 11, color: '#8b7355', marginTop: 2 }}>{user?.email}</div>
                  </div>
                  <button onClick={() => { setShowUserMenu(false); router.push('/profil') }} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: 12, color: '#4a5568', cursor: 'pointer' }}>
                    Mon profil
                  </button>
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: 12, color: '#8b3a3a', cursor: 'pointer', borderTop: '1px solid #f5f3ef' }}>
                    Deconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>{children}</div>
      </main>
    </div>
  )
}
