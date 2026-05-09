with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

lines[45] = "    const typeLabel = decl?.type_produit === 'fil' ? 'Fil ETHYS' : decl?.type_produit === 'tissu' ? 'Tissu ETHYS' : 'Produit fini ETHYS'\n"

with open("src/app/tracabilite/[qrId]/page.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
