with open("src/components/modules/FacturationClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Remplacer la fermeture incorrecte ligne 430 par la fermeture correcte
lines[429] = "      </div>}\n"

with open("src/components/modules/FacturationClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
