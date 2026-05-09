with open("src/components/modules/ReportingClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Supprimer les lignes 176-196 (index 175-195)
del lines[175:196]

with open("src/components/modules/ReportingClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
