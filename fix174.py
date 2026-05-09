with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remplacer tout le bloc de calcul par des valeurs fixes 51/49
old = content[content.find("    const dataEncodee"):content.find("    const typeLabel")]
new = """    const pctRecycl\u00e9 = 51
    const pctVierge = 49
    const totalKg = Number(cert?.volume_total ?? 0)
    const volRecycle = Math.round(totalKg * 0.51)
    const volVierge = Math.round(totalKg * 0.49)
    """

content = content.replace(old, new)

with open("src/app/tracabilite/[qrId]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
