import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { objet, message, aPieceJointe, reference, prenom, nom, email } = await req.json()

    // Email interne vers Textile Loop (pas besoin de bilingue)
    await resend.emails.send({
      from: 'Ethys Platform <noreply@ethys-textileloop.com>',
      to: 'contact@textile-loop.com',
      subject: '[Support] ' + reference + ' - ' + objet,
      html: '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">'
        + '<h2 style="color: #16a34a;">Nouvelle demande support</h2>'
        + '<p><strong>Reference :</strong> ' + reference + '</p>'
        + '<p><strong>De :</strong> ' + prenom + ' ' + nom + ' (' + email + ')</p>'
        + '<p><strong>Objet :</strong> ' + objet + '</p>'
        + '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />'
        + '<p style="white-space: pre-line;">' + message + '</p>'
        + (aPieceJointe ? '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" /><p style="color: #6b7280; font-size: 14px;">Piece jointe a venir par email de l utilisateur.</p>' : '')
        + '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />'
        + '<p style="color: #9ca3af; font-size: 12px;">Repondre a cet email pour contacter l utilisateur.</p>'
        + '</div>',
      replyTo: email,
    })

    // Confirmation bilingue vers l'utilisateur
    await resend.emails.send({
      from: 'Ethys Support <noreply@ethys-textileloop.com>',
      to: email,
      subject: 'Demande re\u00e7ue / Request received \u2014 ' + reference,
      html: '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">'
        // --- FR ---
        + '<h2 style="color: #16a34a;">Demande bien re\u00e7ue</h2>'
        + '<p>Bonjour ' + prenom + ',</p>'
        + '<p>Votre demande a bien \u00e9t\u00e9 enregistr\u00e9e. Notre \u00e9quipe vous r\u00e9pondra dans les meilleurs d\u00e9lais.</p>'
        + '<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">'
        + '<p style="margin: 0 0 8px 0;"><strong>R\u00e9f\u00e9rence :</strong> ' + reference + '</p>'
        + '<p style="margin: 0;"><strong>Objet :</strong> ' + objet + '</p>'
        + '</div>'
        + (aPieceJointe ? '<p style="color: #6b7280; font-size: 14px;">Vous avez indiqu\u00e9 avoir une pi\u00e8ce jointe \u2014 envoyez-la en r\u00e9pondant \u00e0 cet email.</p>' : '')
        + '<p style="color: #6b7280; font-size: 14px;">Suivez le statut de votre demande dans l\u2019onglet Support de la plateforme.</p>'
        // --- S\u00e9parateur ---
        + '<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 24px 0;" />'
        + '<p style="text-align:center;color:#8b7355;font-size:11px;font-weight:600;">ENGLISH VERSION BELOW</p>'
        // --- EN ---
        + '<h2 style="color: #16a34a;">Request received</h2>'
        + '<p>Hello ' + prenom + ',</p>'
        + '<p>Your request has been registered. Our team will respond as soon as possible.</p>'
        + '<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">'
        + '<p style="margin: 0 0 8px 0;"><strong>Reference:</strong> ' + reference + '</p>'
        + '<p style="margin: 0;"><strong>Subject:</strong> ' + objet + '</p>'
        + '</div>'
        + (aPieceJointe ? '<p style="color: #6b7280; font-size: 14px;">You indicated you have an attachment \u2014 please send it by replying to this email.</p>' : '')
        + '<p style="color: #6b7280; font-size: 14px;">Track the status of your request in the Support tab of the platform.</p>'
        // --- Footer ---
        + '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />'
        + '<p style="color: #9ca3af; font-size: 12px;">Ethys \u2014 Textile Loop Platform</p>'
        + '</div>',
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Support send error:', error)
    return Response.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}
