with open("src/components/modules/ReportingClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "{ label: '% Coton recycl\u00e9', value: `${pctRecycleGlobal}%`, delta: `${Math.round(totalRecycle * 1000).toLocaleString('fr-FR')} kg recycl\u00e9s` },",
    "{ label: '% Coton recycl\u00e9', value: `${pctRecycleGlobal}%`, delta: '51% de chaque fil ETHYS' },"
)

with open("src/components/modules/ReportingClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
