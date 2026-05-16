import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SupportClient from '@/components/modules/SupportClient'

export default async function SupportPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profil?.role === 'admin'

  return (
    <SupportClient
      userId={user.id}
      isAdmin={isAdmin}
    />
  )
}

