with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    """    const { data: decl } = await supabase
      .from('declarations_ethys')
      .select('*, entreprise:entreprises(nom, pays)')
      .eq('id', cert?.declaration_id)
      .single()

    const totalVol = Number(decl?.volume_recycle_kg ?? 0) + Number(decl?.volume_vierge_kg ?? 0)
    const pctRecycl\u00e9 = totalVol > 0 ? Math.round(Number(decl?.volume_recycle_kg ?? 0) / totalVol * 100) : 51
    const pctVierge = 100 - pctRecycl\u00e9
    const typeLabel = decl?.type_produit === 'fil' ? 'Fil ETHYS' : decl?.type_produit === 'tissu' ? 'Tissu ETHYS' : 'Produit fini ETHYS'""",
    """    const { data: decl } = await supabase
      .from('declarations_ethys')
      .select('*, entreprise:entreprises(nom, pays)')
      .eq('id', cert?.declaration_id)
      .single()

    // Fallback sur les donnees encodees dans le QR code si decl est null
    const dataEncodee = qrCode.data_encodee as Record<string, unknown> ?? {}
    const volRecycle = Number(decl?.volume_recycle_kg ?? dataEncodee.volume_recycle_kg ?? 0)
    const volVierge = Number(decl?.volume_vierge_kg ?? dataEncodee.volume_vierge_kg ?? 0)
    const totalVol = volRecycle + volVierge
    const pctRecycl\u00e9 = totalVol > 0 ? Math.round(volRecycle / totalVol * 100) : 51
    const pctVierge = 100 - pctRecycl\u00e9
    const typeLabel = (decl?.type_produit ?? dataEncodee.type_produit) === 'fil' ? 'Fil ETHYS' : (decl?.type_produit ?? dataEncodee.type_produit) === 'tissu' ? 'Tissu ETHYS' : 'Produit fini ETHYS'"""
)

# Utiliser aussi les donnees encodees pour filature et entreprise
content = content.replace(
    "decl?.filature_nom ?? '-'",
    "decl?.filature_nom ?? String(dataEncodee.filature ?? '-')"
)
content = content.replace(
    "(decl?.entreprise as any)?.nom ?? '-'",
    "(decl?.entreprise as any)?.nom ?? String(dataEncodee.entreprise ?? '-')"
)

with open("src/app/tracabilite/[qrId]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
