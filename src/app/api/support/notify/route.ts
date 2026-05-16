import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const STATUT_LABELS: Record<string, string> = {
  'envoyée':  'Envoyée',
  'en_cours': 'En cours de traitement',
  'clôturée': 'Clôturée',
}

const STATUT_COLORS: Record<string, string> = {
  'envoyée':  '#3b82f6',
  'en_cours': '#f59e0b',
  'clôturée': '#16a34a',
}

export async function POST(req: Request) {
  try {
    const { email, prenom, objet, newStatut } = await req.json()

    await resend.emails.send({
      from: 'Ethys Support <noreply@ethys-textileloop.com>',
      to: email,
      subject: `Mise à jour de votre demande — ${objet}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Mise à jour de votre demande</h2>
          <p>Bonjour ${prenom},</p>
          <p>Le statut de votre demande a été mis à jour.</p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Objet :</strong> ${objet}</p>
            <p style="margin: 0;">
              <strong>Nouveau statut :</strong>
              <span style="color: ${STATUT_COLORS[newStatut] ?? '#374151'}; font-weight: 600;">
                ${STATUT_LABELS[newStatut] ?? newStatut}
              </span>
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Connectez-vous à la plateforme pour suivre l'évolution de votre demande.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Ethys — Textile Loop Platform</p>
        </div>
      `,
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Support notify error:', error)
    return Response.json({ error: 'Erreur envoi notification' }, { status: 500 })
  }
}
