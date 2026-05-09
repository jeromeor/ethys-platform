with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

lines[86] = "            { label: 'Entreprise', value: (decl?.entreprise as any)?.nom ?? '-' },\n"
lines[88] = "            { label: 'Filature', value: decl?.filature_nom ?? '-' },\n"

with open("src/app/tracabilite/[qrId]/page.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
