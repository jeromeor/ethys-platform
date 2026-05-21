import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Vérifie le statut avant suppression
    const [commande] = await sql`
      SELECT statut FROM commandes WHERE id = ${id}
    `

    if (!commande) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    if (commande.statut === 'livree' || commande.statut === 'qr_genere') {
      return NextResponse.json(
        { error: `Suppression impossible — statut : ${commande.statut}` },
        { status: 403 }
      )
    }

    await sql`DELETE FROM commandes WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
