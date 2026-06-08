import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { filature_nom, declaration_id } = await request.json()

  // MVP : email fixe pour tests — remplacer par l'email r\u00e9el de la filature
  const destinataire = 'jeromeoriol1964@proton.me'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TEXTILE LOOP <contact@ethys-textileloop.com>',
        to: [destinataire],
        subject: 'Demande de duplicatas / Duplicate request \u2014 ETHYS',
        html: '<div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;background:#f5f3ef;">'
          + '<div style="background:#1a1a1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">'
          + '<img src="https://www.ethys-textileloop.com/logo_ethys.png" alt="ETHYS" style="width:60px;filter:invert(1);" />'
          + '<div style="color:#c2956e;font-size:11px;letter-spacing:2px;margin-top:8px;">ETHYS PLATFORM</div>'
          + '</div>'
          // --- FR ---
          + '<div style="background:#fff;border-radius:8px;border:1px solid #e8e3d8;padding:28px 24px;">'
          + '<h2 style="color:#1a1a1a;font-size:18px;margin:0 0 12px;">Demande de duplicatas de commandes</h2>'
          + '<p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 16px;">'
          + 'Bonjour ' + filature_nom + ',<br/><br/>'
          + 'Dans le cadre de votre demande de certification ETHYS, nous avons besoin des documents suivants :'
          + '</p>'
          + '<div style="background:#f5f3ef;border-radius:8px;padding:16px 20px;margin-bottom:20px;">'
          + '<div style="font-size:13px;color:#1a1a1a;font-weight:600;margin-bottom:10px;">Documents requis :</div>'
          + '<ul style="margin:0;padding-left:18px;color:#4a5568;font-size:13px;line-height:2;">'
          + '<li>Duplicata de la commande de <strong>coton recycl\u00e9</strong></li>'
          + '<li>Duplicata de la commande de <strong>coton vierge</strong></li>'
          + '</ul>'
          + '</div>'
          + '<p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 20px;">'
          + 'Merci de nous transmettre ces documents par retour d\u2019email dans les meilleurs d\u00e9lais afin que nous puissions finaliser votre certification.'
          + '</p>'
          + '<div style="text-align:center;margin:24px 0;">'
          + '<a href="https://www.ethys-textileloop.com/certification" style="display:inline-block;padding:12px 28px;background:#2d5016;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;">'
          + 'Voir ma demande sur ETHYS'
          + '</a>'
          + '</div>'
          + '</div>'
          // --- S\u00e9parateur ---
          + '<div style="text-align:center;margin:24px 0;font-size:11px;color:#8b7355;font-weight:600;">ENGLISH VERSION BELOW</div>'
          // --- EN ---
          + '<div style="background:#fff;border-radius:8px;border:1px solid #e8e3d8;padding:28px 24px;">'
          + '<h2 style="color:#1a1a1a;font-size:18px;margin:0 0 12px;">Order duplicate request</h2>'
          + '<p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 16px;">'
          + 'Hello ' + filature_nom + ',<br/><br/>'
          + 'As part of your ETHYS certification request, we need the following documents:'
          + '</p>'
          + '<div style="background:#f5f3ef;border-radius:8px;padding:16px 20px;margin-bottom:20px;">'
          + '<div style="font-size:13px;color:#1a1a1a;font-weight:600;margin-bottom:10px;">Required documents:</div>'
          + '<ul style="margin:0;padding-left:18px;color:#4a5568;font-size:13px;line-height:2;">'
          + '<li>Purchase order duplicate for <strong>recycled cotton</strong></li>'
          + '<li>Purchase order duplicate for <strong>virgin cotton</strong></li>'
          + '</ul>'
          + '</div>'
          + '<p style="color:#4a5568;font-size:13px;line-height:1.7;margin:0 0 20px;">'
          + 'Please send these documents by return email as soon as possible so we can finalize your certification.'
          + '</p>'
          + '<div style="text-align:center;margin:24px 0;">'
          + '<a href="https://www.ethys-textileloop.com/certification" style="display:inline-block;padding:12px 28px;background:#2d5016;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;">'
          + 'View my request on ETHYS'
          + '</a>'
          + '</div>'
          + '<p style="color:#8b7355;font-size:11px;text-align:center;margin:0;">'
          + 'Questions? <a href="mailto:contact@ethys-textileloop.com" style="color:#2d5016;">contact@ethys-textileloop.com</a>'
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
