import { redirect } from 'next/navigation'
import postgres from 'postgres'
import { createClient } from '@/lib/supabase/server'
import CommissionsFilaturesClient from './CommissionsFilaturesClient'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

export default async function CommissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profil] = await sql`
    SELECT role FROM profils_utilisateurs WHERE id = ${user.id}
  `
  if (!profil || profil.role !== 'admin') redirect('/dashboard')

  const filatures = await sql`
    SELECT
      e.id, e.nom,
      b.niveau, b.personnalise, b.tranches_personnalisees
    FROM entreprises e
    LEFT JOIN bareme_commissions_filatures b ON b.filature_id = e.id
    WHERE e.type = 'filature'
    ORDER BY e.nom
  `
  const defauts = await sql`
    SELECT niveau, tranche_min, tranche_max, taux_eur_kg
    FROM bareme_defaut_niveaux
    ORDER BY niveau, tranche_min
  `

  return (
    <CommissionsFilaturesClient
      filatures={JSON.parse(JSON.stringify(filatures))}
      defauts={JSON.parse(JSON.stringify(defauts))}
    />
  )
}
