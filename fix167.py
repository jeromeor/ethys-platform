with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "    const pctRecycl\u00e9 = Number(decl?.pct_recycle ?? 51)\n    const pctVierge = 100 - pctRecycl\u00e9",
    "    const totalVol = Number(decl?.volume_recycle_kg ?? 0) + Number(decl?.volume_vierge_kg ?? 0)\n    const pctRecycl\u00e9 = totalVol > 0 ? Math.round(Number(decl?.volume_recycle_kg ?? 0) / totalVol * 100) : 51\n    const pctVierge = 100 - pctRecycl\u00e9"
)

with open("src/app/tracabilite/[qrId]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
