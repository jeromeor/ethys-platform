with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

del lines[149]  # supprimer ligne 150 - doublon titre

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
