import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

// Libellés statuts bilingues — IDs stables en clé
const STATUT_LABELS_FR: Record<string, string> = {
  'envoy\u00e9e':  'Envoy\u00e9e',
  'en_cours': 'En cours de traitement',
  'cl\u00f4tur\u00e9e': 'Cl\u00f4tur\u00e9e',
}
const STATUT_LABELS_EN: Record<string, string> = {
  'envoy\u00e9e':  'Sent',
  'en_cours': 'In progress',
  'cl\u00f4tur\u00e9e': 'Closed',
}

const STATUT_COLORS: Record<string, string> = {
  'envoy\u00e9e':  '#3b82f6',
  'en_cours': '#f59e0b',
  'cl\u00f4tur\u00e9e': '#16a34a',
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const { email, prenom, objet, newStatut } = await req.json()

    const couleur = STATUT_COLORS[newStatut] ?? '#374151'
    const labelFR = STATUT_LABELS_FR[newStatut] ?? newStatut
    const labelEN = STATUT_LABELS_EN[newStatut] ?? newStatut

    await resend.emails.send({
      from: 'Ethys Support <noreply@ethys-textileloop.com>',
      to: email,
      subject: 'Mise \u00e0 jour demande / Request update \u2014 ' + objet,
      html: '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">'
        // --- FR ---
        + '<h2 style="color: #16a34a;">Mise \u00e0 jour de votre demande</h2>'
        + '<p>Bonjour ' + prenom + ',</p>'
        + '<p>Le statut de votre demande a \u00e9t\u00e9 mis \u00e0 jour.</p>'
        + '<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">'
        + '<p style="margin: 0 0 8px 0;"><strong>Objet :</strong> ' + objet + '</p>'
        + '<p style="margin: 0;"><strong>Nouveau statut :</strong> '
        + '<span style="color: ' + couleur + '; font-weight: 600;">' + labelFR + '</span></p>'
        + '</div>'
        + '<p style="color: #6b7280; font-size: 14px;">Connectez-vous \u00e0 la plateforme pour suivre l\u2019\u00e9volution de votre demande.</p>'
        // --- S\u00e9parateur ---
        + '<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 24px 0;" />'
        + '<p style="text-align:center;color:#8b7355;font-size:11px;font-weight:600;">ENGLISH VERSION BELOW</p>'
        // --- EN ---
        + '<h2 style="color: #16a34a;">Request status update</h2>'
        + '<p>Hello ' + prenom + ',</p>'
        + '<p>The status of your request has been updated.</p>'
        + '<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">'
        + '<p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ' + objet + '</p>'
        + '<p style="margin: 0;"><strong>New status:</strong> '
        + '<span style="color: ' + couleur + '; font-weight: 600;">' + labelEN + '</span></p>'
        + '</div>'
        + '<p style="color: #6b7280; font-size: 14px;">Log in to the platform to track your request.</p>'
        // --- Footer ---
        + '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />'
        + '<p style="color: #9ca3af; font-size: 12px;">Ethys \u2014 Textile Loop Platform</p>'
        + '</div>',
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Support notify error:', error)
    return Response.json({ error: 'Erreur envoi notification' }, { status: 500 })
  }
}
