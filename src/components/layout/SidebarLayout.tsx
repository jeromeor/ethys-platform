'use client'

import { useState } from 'react'
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

        <div style={{ padding: '10px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initiales}</div>
            {open && <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nomEntreprise}</div>
              <div style={{ fontSize: 10, color: '#6EE7B7', textTransform: 'capitalize' }}>{profil?.role ?? 'utilisateur'}</div>
            </div>}
          </div>
          {open && (
            <button onClick={handleLogout} style={{ width: '100%', padding: '6px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer' }}>
              Déconnexion
            </button>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: 60, background: '#fff', borderBottom: '1px solid #EEF0F3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0A3D26' }}>
            {navItems.find(n => pathname === n.route || pathname.startsWith(n.route + '/'))?.label ?? 'Dashboard'}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>{user?.email}</div>
        </header>
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </main>
    </div>
  )
}
