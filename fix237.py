with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Changer alignItems center -> flex-end pour aligner le logo en bas
lines[141] = "          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>\n"

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
