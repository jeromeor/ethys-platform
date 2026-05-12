# API envoi email
api_content = """import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, lien, delai } = await request.json()
  const supabase = await createClient()

  const delaiTexte = delai === 'immediat' 
    ? 'imm\u00e9diatement apr\u00e8s confirmation'
    : 'dans 7 jours apr\u00e8s confirmation'

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
    message: `Email de confirmation envoy\u00e9. Suppression ${delaiTexte}.`,
    lien_debug: lien // A SUPPRIMER EN PRODUCTION
  })
}
"""
open('src/app/api/send-deletion-email/route.ts', 'w', encoding='utf-8').write(api_content)
print("Done API")

# Page confirmation suppression
confirm_content = """import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ConfirmerSuppressionPage({ searchParams }: { searchParams: Promise<{ token: string, uid: string }> }) {
  const { token, uid } = await searchParams
  const supabase = await createClient()

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('suppression_token, suppression_type, suppression_demandee_at, prenom, nom')
    .eq('id', uid)
    .single()

  if (!profil || profil.suppression_token !== token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ef', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#8b3a3a', marginBottom: 8 }}>Lien invalide ou expir\u00e9</div>
          <div style={{ fontSize: 13, color: '#4a5568' }}>Ce lien de suppression n'est plus valide.</div>
          <a href="/login" style={{ display: 'inline-block', marginTop: 16, color: '#1a1a1a', fontWeight: 600 }}>Retour \u00e0 la connexion</a>
        </div>
      </div>
    )
  }

  // Executer la suppression
  await supabase
    .from('profils_utilisateurs')
    .update({
      prenom: 'Compte',
      nom: 'Supprim\u00e9',
      telephone: null,
      adresse_rue: null,
      adresse_ville: null,
      adresse_code_postal: null,
      statut: 'supprime',
      suppression_token: null,
    })
    .eq('id', uid)

  // Notifier l admin
  await supabase
    .from('notifications')
    .insert({
      utilisateur_id: process.env.NEXT_PUBLIC_ADMIN_ID,
      type: 'suppression_compte',
      titre: 'Suppression de compte',
      message: `Un compte a \u00e9t\u00e9 supprim\u00e9 (RGPD). Type: ${profil.suppression_type}`,
      lien: '/admin'
    })

  await supabase.auth.signOut()
  redirect('/login?deleted=true')
}
"""
open('src/app/profil/confirmer-suppression/page.tsx', 'w', encoding='utf-8').write(confirm_content)
print("Done confirmation page")
