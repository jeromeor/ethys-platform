with open("src/components/modules/CommandesClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

lines[399] = "                  {[['mixte', 'Fil ETHYS (recycl\u00e9 + vierge)']].map(([v, l]) => (\n"

with open("src/components/modules/CommandesClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
