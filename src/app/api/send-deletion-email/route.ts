import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { email, lien, delai } = await request.json()

  const delaiTexteFR = delai === 'immediat'
    ? 'imm\u00e9diatement apr\u00e8s confirmation'
    : 'dans 7 jours apr\u00e8s confirmation'

  const delaiTexteEN = delai === 'immediat'
    ? 'immediately after confirmation'
    : '7 days after confirmation'

  const delaiMessageFR = delai === '7jours'
    ? '<p style="color:#b8860b;background:#fdf8ec;padding:10px 14px;border-radius:4px;font-size:13px;">Vous disposez de 7 jours pour annuler cette demande en contactant <a href="mailto:contact@textile-loop.com">contact@textile-loop.com</a></p>'
    : '<p style="color:#8b3a3a;background:#fdf0f0;padding:10px 14px;border-radius:4px;font-size:13px;">Cette suppression sera effective imm\u00e9diatement apr\u00e8s confirmation.</p>'

  const delaiMessageEN = delai === '7jours'
    ? '<p style="color:#b8860b;background:#fdf8ec;padding:10px 14px;border-radius:4px;font-size:13px;">You have 7 days to cancel this request by contacting <a href="mailto:contact@textile-loop.com">contact@textile-loop.com</a></p>'
    : '<p style="color:#8b3a3a;background:#fdf0f0;padding:10px 14px;border-radius:4px;font-size:13px;">This deletion will take effect immediately after confirmation.</p>'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ETHYS Platform <contact@ethys-textileloop.com>',
        to: [email],
        subject: 'Suppression de compte / Account deletion — ETHYS',
        html: '<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#f5f3ef;">'
          + '<div style="background:#1a1a1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">'
          + '<img src="https://www.ethys-textileloop.com/logo_ethys.png" alt="ETHYS" style="width:60px;filter:invert(1);" />'
          + '<div style="color:#c2956e;font-size:11px;letter-spacing:2px;margin-top:8px;">ETHYS PLATFORM</div>'
          + '</div>'
          // --- FR ---
          + '<div style="background:#fff;border-radius:8px;border:1px solid #e8e3d8;padding:28px 24px;">'
          + '<h2 style="color:#1a1a1a;font-size:18px;margin:0 0 12px;">Suppression de votre compte</h2>'
          + '<p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 16px;">'
          + 'Vous avez demand\u00e9 la suppression de votre compte ETHYS.<br/>'
          + 'La suppression sera effective <strong>' + delaiTexteFR + '</strong>.'
          + '</p>'
          + delaiMessageFR
          + '<div style="text-align:center;margin:24px 0;">'
          + '<a href="' + lien + '" style="display:inline-block;padding:12px 28px;background:#8b3a3a;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;">'
          + 'Confirmer la suppression'
          + '</a>'
          + '</div>'
          + '<p style="color:#8b7355;font-size:11px;text-align:center;margin:0;">'
          + 'Ce lien est valable 24 heures.<br/>'
          + 'Si vous n\u2019avez pas fait cette demande, ignorez cet email.'
          + '</p>'
          + '</div>'
          // --- Séparateur ---
          + '<div style="text-align:center;margin:24px 0;font-size:11px;color:#8b7355;font-weight:600;">ENGLISH VERSION BELOW</div>'
          // --- EN ---
          + '<div style="background:#fff;border-radius:8px;border:1px solid #e8e3d8;padding:28px 24px;">'
          + '<h2 style="color:#1a1a1a;font-size:18px;margin:0 0 12px;">Account deletion</h2>'
          + '<p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 16px;">'
          + 'You have requested the deletion of your ETHYS account.<br/>'
          + 'The deletion will take effect <strong>' + delaiTexteEN + '</strong>.'
          + '</p>'
          + delaiMessageEN
          + '<div style="text-align:center;margin:24px 0;">'
          + '<a href="' + lien + '" style="display:inline-block;padding:12px 28px;background:#8b3a3a;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;">'
          + 'Confirm deletion'
          + '</a>'
          + '</div>'
          + '<p style="color:#8b7355;font-size:11px;text-align:center;margin:0;">'
          + 'This link is valid for 24 hours.<br/>'
          + 'If you did not make this request, please ignore this email.'
          + '</p>'
          + '</div>'
          // --- Footer ---
          + '<div style="text-align:center;margin-top:20px;font-size:11px;color:#d4c5b0;">'
          + 'TEXTILE LOOP \u2014 15 rue d\u2019Upsal, 67000 Strasbourg<br/>'
          + '<a href="https://www.ethys-textileloop.com/mentions-legales" style="color:#8b7355;">Mentions l\u00e9gales & RGPD / Legal notice & GDPR</a>'
          + '</div>'
          + '</div>'
      })
    })

    if (!res.ok) {
      const error = await res.json()
      console.error('Resend error:', error)
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
