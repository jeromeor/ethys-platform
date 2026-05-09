with open("src/components/modules/FacturationClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Supprimer la ligne 597 (index 596) qui contient un } parasite
if lines[596].strip() == '}':
    del lines[596]
    print("Deleted line 597")

with open("src/components/modules/FacturationClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
