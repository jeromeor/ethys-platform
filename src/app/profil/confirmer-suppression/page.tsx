import { createClient } from '@/lib/supabase/server'
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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#8b3a3a', marginBottom: 8 }}>Lien invalide ou expiré</div>
          <div style={{ fontSize: 13, color: '#4a5568' }}>Ce lien de suppression n'est plus valide.</div>
          <a href="/login" style={{ display: 'inline-block', marginTop: 16, color: '#1a1a1a', fontWeight: 600 }}>Retour à la connexion</a>
        </div>
      </div>
    )
  }

  // Executer la suppression
  await supabase
    .from('profils_utilisateurs')
    .update({
      prenom: 'Compte',
      nom: 'Supprimé',
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
      message: `Un compte a été supprimé (RGPD). Type: ${profil.suppression_type}`,
      lien: '/admin'
    })

  await supabase.auth.signOut()
  redirect('/login?deleted=true')
}
