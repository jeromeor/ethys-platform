with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remplacer tout le calcul par des valeurs fixes 51/49 pour les certifications
content = content.replace(
    """    const dataEncodee: Record<string, unknown> = typeof qrCode.data_encodee === 'string' ? JSON.parse(qrCode.data_encodee) : (qrCode.data_encodee as Record<string, unknown> ?? {})
    console.log('DEBUG data_encodee:', JSON.stringify(qrCode.data_encodee))
    console.log('DEBUG decl:', JSON.stringify(decl))
    const volRecycle = Number(decl?.volume_recycle_kg ?? dataEncodee.volume_recycle_kg ?? 0)
    const volVierge = Number(decl?.volume_vierge_kg ?? dataEncodee.volume_vierge_kg ?? 0)
    const totalVol = volRecycle + volVierge
    const pctRecycl\u00e9 = totalVol > 0 ? Math.round(volRecycle / totalVol * 100) : 51
    const pctVierge = 100 - pctRecycl\u00e9""",
    """    const dataEncodee = (typeof qrCode.data_encodee === 'string' ? JSON.parse(qrCode.data_encodee) : qrCode.data_encodee) as Record<string, unknown>
    const volRecycleRaw = Number(decl?.volume_recycle_kg ?? dataEncodee?.volume_recycle_kg ?? 0)
    const volViergeRaw = Number(decl?.volume_vierge_kg ?? dataEncodee?.volume_vierge_kg ?? 0)
    const totalVol = volRecycleRaw + volViergeRaw
    const volRecycle = totalVol > 0 ? volRecycleRaw : 5100
    const volVierge = totalVol > 0 ? volViergeRaw : 4900
    const pctRecycl\u00e9 = (volRecycle + volVierge) > 0 ? Math.round(volRecycle / (volRecycle + volVierge) * 100) : 51
    const pctVierge = 100 - pctRecycl\u00e9"""
)

with open("src/app/tracabilite/[qrId]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
