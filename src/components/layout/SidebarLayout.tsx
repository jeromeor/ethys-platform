'use client'

import { useState } from 'react'
import NotificationBell from './NotificationBell'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { icon: '⊞', label: 'Dashboard',    route: '/dashboard' },
  { icon: '◎', label: 'Profil',       route: '/profil' },
  { icon: '⊕', label: 'Annuaire',     route: '/annuaire' },
  { icon: '✉', label: 'Messagerie',   route: '/messagerie' },
  { icon: '◈', label: 'Commandes',    route: '/commandes' },
  { icon: '⬡', label: 'Production',   route: '/production' },
  { icon: '▣', label: 'QR Code',      route: '/qrcode' },
  { icon: '◫', label: 'Facturation',  route: '/facturation' },
  { icon: '◉', label: 'Reporting',    route: '/reporting' },
  { icon: '◦', label: 'ESG',          route: '/esg' },
  { icon: '⚡', label: 'Certification', route: '/certification' },
  { icon: '⚙', label: 'Admin',        route: '/admin' },
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
  const [showUserMenu, setShowUserMenu] = useState(false)

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
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: '#F7F8FA', color: '#1A202C', overflow: 'hidden' }}>

      <aside style={{ width: open ? 220 : 64, minWidth: open ? 220 : 64, background: '#0A3D26', display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '22px 16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', flexShrink: 0 }}>T</div>
            {open && <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>TEXTILE LOOP</div>
              <div style={{ fontSize: 10, color: '#6EE7B7', letterSpacing: 1 }}>ETHYS Platform</div>
            </div>}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.filter(item => item.route !== '/admin' || profil?.role === 'admin').map(item => {
            const active = pathname === item.route || pathname.startsWith(item.route + '/')
            return (
              <button key={item.route} onClick={() => router.push(item.route)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: active ? 'rgba(16,185,129,0.18)' : 'transparent', color: active ? '#6EE7B7' : 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: active ? 600 : 400, textAlign: 'left', width: '100%' }}>
                <span style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {open && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <button onClick={() => setOpen(v => !v)} style={{ margin: '8px', padding: '8px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13 }}>
          {open ? '◀' : '▶'}
        </button>

      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: 60, background: '#fff', borderBottom: '1px solid #EEF0F3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0A3D26' }}>
            {navItems.find(n => pathname === n.route || pathname.startsWith(n.route + '/'))?.label ?? 'Dashboard'}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NotificationBell userId={profil?.id ?? ''} />
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 10, border: '1.5px solid #EEF0F3', background: '#F8FAFC', cursor: 'pointer' }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0A3D26', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {initiales}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A202C' }}>{nomEntreprise}</div>
                <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'capitalize' }}>{profil?.role ?? 'utilisateur'}</div>
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginLeft: 4 }}>▼</div>
            </button>
            {showUserMenu && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', borderRadius: 12, border: '1px solid #EEF0F3', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', minWidth: 200, zIndex: 100, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1A202C' }}>{nomEntreprise}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{user?.email}</div>
                </div>
                <button onClick={() => { setShowUserMenu(false); router.push('/profil') }} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: 12, color: '#475569', cursor: 'pointer' }}>
                  Mon profil
                </button>
                <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: 12, color: '#DC2626', cursor: 'pointer', borderTop: '1px solid #F1F5F9' }}>
                  Déconnexion
                </button>
              </div>
            )}
          </div>
          </div>
        </header>
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </main>
    </div>
  )
}
