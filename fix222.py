with open("src/components/modules/CommandesClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "en_production:          'En production'," in line:
        lines[i] = "  'En production':      'En production',\n"

with open("src/components/modules/CommandesClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
