with open("src/components/modules/FacturationClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Supprimer les lignes 251-253 (ancien bouton incomplet)
del lines[250:253]

with open("src/components/modules/FacturationClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
