import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, lien, delai } = await request.json()

  const delaiTexte = delai === 'immediat'
    ? 'immédiatement après confirmation'
    : 'dans 7 jours après confirmation'

  const delaiMessage = delai === '7jours'
    ? '<p style="color:#b8860b;background:#fdf8ec;padding:10px 14px;border-radius:4px;font-size:13px;">Vous disposez de 7 jours pour annuler cette demande en contactant <a href=\"mailto:contact@textile-loop.com\">contact@textile-loop.com</a></p>'
    : '<p style="color:#8b3a3a;background:#fdf0f0;padding:10px 14px;border-radius:4px;font-size:13px;">Cette suppression sera effective immédiatement après confirmation.</p>'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ETHYS Platform <contact@ethys-textileloop.com>',
        to: [email],
        subject: 'Confirmation de suppression de votre compte ETHYS',
        html: `
          <div style="font-family:'Inter',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#f5f3ef;">
            <div style="background:#1a1a1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
              <img src="https://www.ethys-textileloop.com/logo_ethys.png" alt="ETHYS" style="width:60px;filter:invert(1);" />
              <div style="color:#c2956e;font-size:11px;letter-spacing:2px;margin-top:8px;">ETHYS PLATFORM</div>
            </div>
            <div style="background:#fff;border-radius:8px;border:1px solid #e8e3d8;padding:28px 24px;">
              <h2 style="color:#1a1a1a;font-size:18px;margin:0 0 12px;">Suppression de votre compte</h2>
              <p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 16px;">
                Vous avez demandé la suppression de votre compte ETHYS.<br/>
                La suppression sera effective <strong>${delaiTexte}</strong>.
              </p>
              ${delaiMessage}
              <div style="text-align:center;margin:24px 0;">
                <a href="${lien}" style="display:inline-block;padding:12px 28px;background:#8b3a3a;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;">
                  Confirmer la suppression
                </a>
              </div>
              <p style="color:#8b7355;font-size:11px;text-align:center;margin:0;">
                Ce lien est valable 24 heures.<br/>
                Si vous n'avez pas fait cette demande, ignorez cet email.
              </p>
            </div>
            <div style="text-align:center;margin-top:20px;font-size:11px;color:#d4c5b0;">
              TEXTILE LOOP — 15 rue d'Upsal, 67000 Strasbourg<br/>
              <a href="https://www.ethys-textileloop.com/mentions-legales" style="color:#8b7355;">Mentions légales & RGPD</a>
            </div>
          </div>
        `
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
