with open('src/app/tracabilite/[qrId]/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

del lines[150]  # div vide ligne 151
del lines[150]  # /div vide ligne 152

with open('src/app/tracabilite/[qrId]/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
