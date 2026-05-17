import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminEntreprisesClient from '@/components/modules/AdminEntreprisesClient'

export default async function AdminEntreprisesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profil?.role !== 'admin') redirect('/dashboard')

  const { data: entreprises } = await supabase
    .from('entreprises')
    .select('id, nom, type, statut, ville, pays, siret, tva, email_contact, telephone, site_web, adresse_rue, code_postal, created_at')
    .order('nom')

  return <AdminEntreprisesClient entreprises={entreprises ?? []} />
}
