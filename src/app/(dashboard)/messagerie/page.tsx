import { createClient } from '@/lib/supabase/server'
import { getProfilUtilisateur } from '@/lib/data/profils'
import { redirect } from 'next/navigation'
import SupportClient from '@/components/modules/SupportClient'

export default async function SupportPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await getProfilUtilisateur(supabase, user.id)

  const isAdmin = profil?.role === 'admin'

  return (
    <SupportClient
      userId={user.id}
      isAdmin={isAdmin}
    />
  )
}
