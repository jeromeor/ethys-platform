with open("src/components/modules/ReportingClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "          { label: 'Volume Recycl\u00e9', value: `${Math.round(totalRecycle * 1000).toLocaleString('fr-FR')} kg`, badge: `${pctRecycleGlobal}% du total`, bg: '#D1FAE5', tc: '#065F46' },\n",
    ""
)
content = content.replace(
    "          { label: 'Volume Vierge', value: `${Math.round(totalVierge * 1000).toLocaleString('fr-FR')} kg`, badge: `${100 - pctRecycleGlobal}% du total`, bg: '#F1F5F9', tc: '#475569' },\n",
    ""
)

with open("src/components/modules/ReportingClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
