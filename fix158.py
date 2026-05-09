with open("src/components/modules/FacturationClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Inserer la fermeture du div conditionnel avant le modal (ligne 600, index 599)
lines.insert(599, "      }\n")

with open("src/components/modules/FacturationClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
