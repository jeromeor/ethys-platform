import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { objet, message, aPieceJointe, prenom, nom, email } = await req.json()

    // Email à l'équipe support
    await resend.emails.send({
      from: 'Ethys Platform <noreply@ethys-textileloop.com>',
      to: 'contact@textile-loop.com',
      subject: `[Support] ${objet}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Nouvelle demande support</h2>
          <p><strong>De :</strong> ${prenom} ${nom} (${email})</p>
          <p><strong>Objet :</strong> ${objet}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="white-space: pre-line;">${message}</p>
          ${aPieceJointe ? `
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="color: #6b7280; font-size: 14px;">
            📎 L'utilisateur souhaite joindre une pièce jointe — il l'enverra en réponse à l'email de confirmation.
          </p>` : ''}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Répondre directement à cet email pour contacter l'utilisateur.
          </p>
        </div>
      `,
      replyTo: email,
    })

    // Email de confirmation à l'utilisateur
    await resend.emails.send({
      from: 'Ethys Support <noreply@ethys-textileloop.com>',
      to: email,
      subject: `Votre demande a bien été reçue — ${objet}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Demande bien reçue</h2>
          <p>Bonjour ${prenom},</p>
          <p>Votre demande a bien été enregistrée. Notre équipe vous répondra dans les meilleurs délais.</p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Objet :</strong> ${objet}</p>
          </div>
          ${aPieceJointe ? `
          <p style="color: #6b7280; font-size: 14px;">
            📎 Vous avez indiqué avoir une pièce jointe — vous pouvez l'envoyer en répondant à cet email.
          </p>` : ''}
          <p style="color: #6b7280; font-size: 14px;">
            Vous pouvez suivre le statut de votre demande directement sur la plateforme, dans l'onglet <strong>Support</strong>.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Ethys — Textile Loop Platform</p>
        </div>
      `,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Support send error:', error)
    return Response.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}
