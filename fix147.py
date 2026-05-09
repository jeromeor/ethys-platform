with open("src/components/modules/ProductionClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

lines[208] = lines[208].replace(
    " \u00b7 {Math.round(selected.pct_recycle)}% recycl\u00e9",
    " \u00b7 Fil ETHYS"
)

with open("src/components/modules/ProductionClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
