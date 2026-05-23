'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  titre: string
  contenu: string | null
  lu: boolean
  lien: string | null
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  message: '✉',
  certification: '🏆',
  declaration: '📋',
  compte_attente: '⏳',
  general: '🔔',
  demande_qr: '▣',
  demande_annulation: '🚫',
  qr_genere: '▣',
}

interface Props {
  userId: string
}

export default function NotificationBell({ userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const nonLues = notifications.filter(n => !n.lu).length

  useEffect(() => {
    charger()
    const channel = supabase
      .channel('notifications_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `utilisateur_id=eq.${userId}` }, () => charger())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const charger = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('utilisateur_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data ?? [])
  }

  const marquerLu = async (id: string, lien?: string | null) => {
    await supabase.from('notifications').update({ lu: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
    if (lien) { setOpen(false); router.push(lien) }
  }

  const toutMarquerLu = async () => {
    const ids = notifications.filter(n => !n.lu).map(n => n.id)
    if (ids.length === 0) return
    await supabase.from('notifications').update({ lu: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
  }

  const tempsRelatif = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 60) return `${min}m`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}j`
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ position: 'relative', border: 'none', background: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8, color: '#4a5568' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {nonLues > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: '#8b3a3a', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', borderRadius: 6, border: '1px solid #e8e3d8', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', width: 320, zIndex: 200, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f3ef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Notifications</span>
            {nonLues > 0 && (
              <button onClick={toutMarquerLu} style={{ fontSize: 11, color: '#8b7355', border: 'none', background: 'none', cursor: 'pointer' }}>
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '30px 16px', textAlign: 'center', color: '#8b7355', fontSize: 12 }}>
                Aucune notification
              </div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => marquerLu(n.id, n.lien)} style={{ padding: '12px 16px', cursor: 'pointer', background: n.lu ? '#fff' : '#F0FDF4', borderBottom: '1px solid #f5f3ef', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: n.lu ? '#f5f3ef' : '#f0f4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                  {TYPE_ICONS[n.type] ?? '🔔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: n.lu ? 500 : 700, color: '#1A202C', marginBottom: 2 }}>{n.titre}</div>
                  {n.contenu && <div style={{ fontSize: 11, color: '#4a5568', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.contenu}</div>}
                  <div style={{ fontSize: 10, color: '#CBD5E1', marginTop: 4 }}>{tempsRelatif(n.created_at)}</div>
                </div>
                {!n.lu && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a1a1a', flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
