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

    console.log('ROW:', JSON.stringify(row))
    return NextResponse.json({ data: row })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
export async function GET(req: NextRequest) {
  try {
    const rows = await sql`
      SELECT
        c.id,
        c.reference,
        c.titre,
        c.type_coton,
        c.volume_recycle_tonnes,
        c.volume_vierge_tonnes,
        c.volume_total_tonnes,
        c.pct_recycle,
        c.grammage,
        c.statut,
        c.priorite,
        c.notes,
        c.date_livraison_souhaitee,
        c.created_at,
        marque.nom        AS marque,
        filature.nom      AS filature,
        filature.pays     AS filature_pays,
        fournisseur.nom   AS fournisseur,
        -- Calcul de la zone géographique selon le pays de la filature
        CASE filature.pays
          WHEN 'France'    THEN 'Europe'
          WHEN 'Espagne'   THEN 'Europe'
          WHEN 'Portugal'  THEN 'Europe'
          WHEN 'Danemark'  THEN 'Europe'
          WHEN 'Turquie'   THEN 'Europe'
          WHEN 'Maroc'     THEN 'Europe'
          WHEN 'Tunisie'   THEN 'Europe'
          WHEN 'Algérie'   THEN 'Europe'
          ELSE 'Autre'
        END AS zone
      FROM commandes c
      LEFT JOIN entreprises marque      ON marque.id      = c.marque_id
      LEFT JOIN entreprises filature    ON filature.id    = c.filature_id
      LEFT JOIN entreprises fournisseur ON fournisseur.id = c.fournisseur_id
      ORDER BY c.created_at DESC
    `

    // Filtres optionnels via query params
    const { searchParams } = new URL(req.url)
    const dateDebut  = searchParams.get('date_debut')
    const dateFin    = searchParams.get('date_fin')
    const client     = searchParams.get('client')
    const zone       = searchParams.get('zone')

    let filtered = rows as any[]
    if (dateDebut) filtered = filtered.filter(r => r.created_at >= dateDebut)
    if (dateFin)   filtered = filtered.filter(r => r.created_at <= dateFin + 'T23:59:59')
    if (client)    filtered = filtered.filter(r => r.marque?.toLowerCase().includes(client.toLowerCase()))
    if (zone)      filtered = filtered.filter(r => r.zone === zone)

    // Génération du CSV
    const headers = [
      'ID', 'Référence', 'Titre', 'Type coton', 'Vol. recyclé (t)',
      'Vol. vierge (t)', 'Vol. total (t)', '% recyclé', 'Grammage',
      'Statut', 'Priorité', 'Notes', 'Date livraison souhaitée',
      'Date création', 'Marque', 'Filature', 'Pays filature',
      'Fournisseur', 'Zone'
    ]

    const escape = (v: any) => {
      if (v == null) return ''
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s
    }

    const csvRows = [
      headers.join(','),
      ...filtered.map(r => [
        r.id, r.reference, r.titre, r.type_coton,
        r.volume_recycle_tonnes, r.volume_vierge_tonnes,
        r.volume_total_tonnes, r.pct_recycle, r.grammage,
        r.statut, r.priorite, r.notes, r.date_livraison_souhaitee,
        r.created_at, r.marque, r.filature, r.filature_pays,
        r.fournisseur, r.zone
      ].map(escape).join(','))
    ]

    const csv = csvRows.join('\n')
    const date = new Date().toISOString().slice(0, 10)

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="commandes_${date}.csv"`,
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
