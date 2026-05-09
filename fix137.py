with open("src/components/modules/ReportingClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Ameliorer la visibilite des labels
content = content.replace(
    "style={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}",
    "style={{ fontSize: 11, fill: '#0A3D26', fontWeight: 700 }}"
)

# Afficher 0 aussi pour avril
content = content.replace(
    "formatter={(v: unknown) => Number(v) > 0 ? `${Math.round(Number(v) * 1000).toLocaleString('fr-FR')} kg` : ''}",
    "formatter={(v: unknown) => Number(v) >= 0 ? `${Math.round(Number(v) * 1000).toLocaleString('fr-FR')} kg` : ''}"
)

content = content.replace(
    "formatter={(v: unknown) => Number(v) > 0 ? `${Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}` : ''}",
    "formatter={(v: unknown) => Number(v) >= 0 ? `${Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}` : ''}"
)

with open("src/components/modules/ReportingClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
