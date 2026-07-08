import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { createClient } from '@/lib/supabase/server'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

// Vérifie que l'utilisateur connecté est admin, retourne son id ou null
async function verifierAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profil] = await sql`
    SELECT role FROM profils_utilisateurs WHERE id = ${user.id}
  `
  if (!profil || profil.role !== 'admin') return null

  return user.id
}

export async function GET() {
  try {
    const adminId = await verifierAdmin()
    if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const filatures = await sql`
      SELECT
        e.id, e.nom,
        b.niveau, b.personnalise, b.tranches_personnalisees, b.date_validation
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

    return NextResponse.json({ filatures, defauts })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminId = await verifierAdmin()
    if (!adminId) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const body = await req.json()
    const { filature_id, niveau, personnalise, tranches_personnalisees } = body

    if (!filature_id || !niveau) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null

    // Ancien état pour l'historique
    const [ancien] = await sql`
      SELECT niveau, tranches_personnalisees
      FROM bareme_commissions_filatures
      WHERE filature_id = ${filature_id}
    `

    const tranchesJson = personnalise ? JSON.stringify(tranches_personnalisees) : null

    // Upsert du barème actif
    await sql`
      INSERT INTO bareme_commissions_filatures (
        filature_id, niveau, personnalise, tranches_personnalisees,
        valide_par_admin_id, date_validation, ip_validation
      ) VALUES (
        ${filature_id}, ${niveau}, ${!!personnalise}, ${tranchesJson},
        ${adminId}, now(), ${ip}
      )
      ON CONFLICT (filature_id) DO UPDATE SET
        niveau = EXCLUDED.niveau,
        personnalise = EXCLUDED.personnalise,
        tranches_personnalisees = EXCLUDED.tranches_personnalisees,
        valide_par_admin_id = EXCLUDED.valide_par_admin_id,
        date_validation = EXCLUDED.date_validation,
        ip_validation = EXCLUDED.ip_validation,
        updated_at = now()
    `

    // Trace dans l'historique
    await sql`
      INSERT INTO bareme_commissions_historique (
        filature_id, ancien_niveau, nouveau_niveau,
        ancien_tranches, nouveau_tranches, modifie_par_admin_id, ip_adresse
      ) VALUES (
        ${filature_id}, ${ancien?.niveau ?? null}, ${niveau},
        ${ancien?.tranches_personnalisees ?? null}, ${tranchesJson}, ${adminId}, ${ip}
      )
    `

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
