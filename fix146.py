with open("src/components/modules/ProductionClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

lines[183] = lines[183].replace(
    "{cmd.volume_total_tonnes}T",
    "{Math.round((cmd.volume_total_tonnes ?? 0) * 1000).toLocaleString('fr-FR')} kg"
)
lines[208] = lines[208].replace(
    "{selected.volume_total_tonnes}T",
    "{Math.round((selected.volume_total_tonnes ?? 0) * 1000).toLocaleString('fr-FR')} kg"
)

with open("src/components/modules/ProductionClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done ProductionClient")

with open("src/components/modules/QRCodeClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

lines[195] = lines[195].replace(
    "{lot.volume_tonnes}T",
    "{Math.round((lot.volume_tonnes ?? 0) * 1000).toLocaleString('fr-FR')} kg"
)

with open("src/components/modules/QRCodeClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done QRCodeClient")
