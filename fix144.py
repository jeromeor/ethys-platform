with open("src/components/modules/ReportingClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Supprimer le graphique camembert lignes 233-252 (index 232-251)
del lines[232:252]

with open("src/components/modules/ReportingClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
