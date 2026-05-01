import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SidebarLayout from '@/components/layout/SidebarLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('*, entreprise:entreprises(*)')
    .eq('id', user.id)
    .single()

  return (
    <SidebarLayout user={user} profil={profil}>
      {children}
    </SidebarLayout>
  )
}