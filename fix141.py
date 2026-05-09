with open("src/components/modules/ESGClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Supprimer recyclage du radar
content = content.replace(
    "    { axe: 'Recyclage', score: scores.recyclage },\n",
    ""
)

# Supprimer recyclage du calcul des scores
content = content.replace(
    "    recyclage:      pctRecycl\u00e9Global,\n",
    ""
)

# Supprimer recyclage de l insertion en base
content = content.replace(
    "      score_recyclage: scores.recyclage,\n",
    ""
)

# Supprimer les indicateurs recyclage de la section E
content = content.replace(
    "                { label: '% coton Recycl\u00e9', val: pctRecycl\u00e9Global + '%', ok: pctRecycl\u00e9Global >= 50 },\n",
    ""
)
content = content.replace(
    "                { label: 'Volume Recycl\u00e9', val: (Math.round(volumeRecycl\u00e9 * 1000)).toLocaleString('fr-FR') + ' kg', ok: volumeRecycl\u00e9 > 0 },\n",
    ""
)

# Supprimer la carte Recycle dans les KPIs
content = content.replace(
    "[pctRecycl\u00e9Global + '%', 'Recycl\u00e9'], ",
    ""
)
content = content.replace(
    "[(Math.round(volumeRecycl\u00e9 * 1000)).toLocaleString('fr-FR') + ' kg', 'Vol. recycl\u00e9'], ",
    ""
)

with open("src/components/modules/ESGClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
