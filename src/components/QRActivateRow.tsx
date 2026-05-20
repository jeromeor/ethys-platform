'use client'

import { useState } from 'react'

interface Props {
  qr: { id: string; reference: string; lot_reference: string | null; entreprise_nom: string | null }
}

export default function QRActivateRow({ qr }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const activer = async () => {
    setLoading(true)
    const res = await fetch('/api/qr-codes/activate', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_id: qr.id }),
    })
    if (res.ok) setDone(true)
    setLoading(false)
  }

  if (done) return null

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: '#fdf8ec', border: '1px solid #e8d9a0' }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{qr.reference}</div>
        <div style={{ fontSize: 11, color: '#8b7355' }}>
          {qr.entreprise_nom ?? '—'}{qr.lot_reference ? ' · ' + qr.lot_reference : ''}
        </div>
      </div>
      <button
        onClick={activer}
        disabled={loading}
        style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: loading ? '#d4c5b0' : '#2d5016', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: loading ? 'default' : 'pointer' }}
      >
        {loading ? '...' : 'Activer'}
      </button>
    </div>
  )
}
