with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

lines[125] = "  const totalVolume = Number(lot?.volume_tonnes) ?? 0\n"
lines[126] = "  const volumeRecycl\u00e9 = Math.round(totalVolume * 0.51)\n"
lines[127] = "  const volumeVierge = Math.round(totalVolume * 0.49)\n"
lines[128] = "  const pctRecycl\u00e9 = 51\n"
lines[129] = "  const pctVierge = 49\n"

with open("src/app/tracabilite/[qrId]/page.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
