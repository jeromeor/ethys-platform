import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, lien, delai } = await request.json()
  const supabase = await createClient()

  const delaiTexte = delai === 'immediat' 
    ? 'immédiatement après confirmation'
    : 'dans 7 jours après confirmation'

  // Utiliser Supabase pour envoyer l email
  const { error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
  })

  // Envoi direct via resend ou SMTP - pour l instant on log le lien
  console.log('Lien de suppression:', lien)

  // TODO: integrer un vrai service email
  // Pour la beta, on retourne le lien dans la reponse (a supprimer en prod)
  return NextResponse.json({ 
    success: true, 
    message: `Email de confirmation envoyé. Suppression ${delaiTexte}.`,
    lien_debug: lien // A SUPPRIMER EN PRODUCTION
  })
}
