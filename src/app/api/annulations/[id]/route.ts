import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    // body.statut = 'acceptee' | 'refusee'
    // body.traite_par = user.id

    const [demande] = await sql`
      UPDATE demandes_annulation
      SET statut = ${body.statut}, traite_at = now(), traite_par = ${body.traite_par}
      WHERE id = ${id}
      RETURNING commande_id
    `
    if (!demande) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
    }

    // Si acceptée, passe la commande en annulee
    if (body.statut === 'acceptee') {
      await sql`
        UPDATE commandes SET statut = 'annulee' WHERE id = ${demande.commande_id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
