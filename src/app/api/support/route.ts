import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { objet, message, aPieceJointe, reference, prenom, nom, email } = await req.json()

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

    await resend.emails.send({
      from: 'Ethys Support <noreply@ethys-textileloop.com>',
      to: email,
      subject: 'Votre demande a bien ete recue - ' + reference,
      html: '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">'
        + '<h2 style="color: #16a34a;">Demande bien recue</h2>'
        + '<p>Bonjour ' + prenom + ',</p>'
        + '<p>Votre demande a bien ete enregistree. Notre equipe vous repondra dans les meilleurs delais.</p>'
        + '<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">'
        + '<p style="margin: 0 0 8px 0;"><strong>Reference :</strong> ' + reference + '</p>'
        + '<p style="margin: 0;"><strong>Objet :</strong> ' + objet + '</p>'
        + '</div>'
        + (aPieceJointe ? '<p style="color: #6b7280; font-size: 14px;">Vous avez indique avoir une piece jointe - envoyez-la en repondant a cet email.</p>' : '')
        + '<p style="color: #6b7280; font-size: 14px;">Suivez le statut de votre demande dans l onglet Support de la plateforme.</p>'
        + '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />'
        + '<p style="color: #9ca3af; font-size: 12px;">Ethys - Textile Loop Platform</p>'
        + '</div>',
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Support send error:', error)
    return Response.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}
