import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const [row] = await sql`
      INSERT INTO commandes (
        reference, titre, marque_id, filature_id, fournisseur_id,
        type_coton, volume_recycle_tonnes, volume_vierge_tonnes,
        grammage, date_livraison_souhaitee, priorite, notes, statut, created_by
      ) VALUES (
        ${body.reference},
        ${body.titre},
        ${body.marque_id},
        ${body.filature_id},
        ${body.fournisseur_id},
        ${body.type_coton},
        ${body.volume_recycle_tonnes},
        ${body.volume_vierge_tonnes},
        ${body.grammage},
        ${body.date_livraison_souhaitee},
        ${body.priorite},
        ${body.notes},
        ${body.statut},
        ${body.created_by}
      )
      const [row] = await sql`
  INSERT INTO commandes (
    reference, titre, marque_id, filature_id, fournisseur_id,
    type_coton, volume_recycle_tonnes, volume_vierge_tonnes,
    grammage, date_livraison_souhaitee, priorite, notes, statut, created_by
  ) VALUES (
    ${body.reference}, ${body.titre}, ${body.marque_id}, ${body.filature_id},
    ${body.fournisseur_id}, ${body.type_coton}, ${body.volume_recycle_tonnes},
    ${body.volume_vierge_tonnes}, ${body.grammage}, ${body.date_livraison_souhaitee},
    ${body.priorite}, ${body.notes}, ${body.statut}, ${body.created_by}
  )
  RETURNING id, reference, titre, statut, type_coton, grammage,
    volume_total_tonnes, pct_recycle, priorite, date_livraison_souhaitee, created_at,
    (SELECT row_to_json(e) FROM (SELECT nom FROM entreprises WHERE id = marque_id) e) as marque,
    (SELECT row_to_json(e) FROM (SELECT nom FROM entreprises WHERE id = filature_id) e) as filature,
    (SELECT row_to_json(e) FROM (SELECT nom FROM entreprises WHERE id = fournisseur_id) e) as fournisseur
`
    `

    return NextResponse.json({ data: row })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
