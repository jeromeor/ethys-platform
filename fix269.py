content = """import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return redirect('/login')
  }

  // Anonymiser les donnees personnelles (RGPD - droit a l effacement)
  await supabase
    .from('profils_utilisateurs')
    .update({
      prenom: 'Compte',
      nom: 'Supprime',
      telephone: null,
      adresse_rue: null,
      adresse_ville: null,
      adresse_code_postal: null,
      statut: 'supprime'
    })
    .eq('id', user.id)

  // Deconnecter l utilisateur
  await supabase.auth.signOut()

  // Rediriger vers login avec message
  return redirect('/login?deleted=true')
}
"""
open('src/app/api/delete-account/route.ts', 'w', encoding='utf-8').write(content)
print("Done")
