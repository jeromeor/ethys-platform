with open("src/components/modules/ReportingClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "formatter={(v: number) => v > 0 ? `${Math.round(v * 1000).toLocaleString('fr-FR')} kg` : ''}",
    "formatter={(v: unknown) => Number(v) > 0 ? `${Math.round(Number(v) * 1000).toLocaleString('fr-FR')} kg` : ''}"
)

content = content.replace(
    "formatter={(v: number) => v > 0 ? `${v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}` : ''}",
    "formatter={(v: unknown) => Number(v) > 0 ? `${Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}` : ''}"
)

with open("src/components/modules/ReportingClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
