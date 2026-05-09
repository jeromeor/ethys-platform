with open("src/app/tracabilite/[qrId]/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const dataEncodee" in line:
        lines.insert(i+1, "    console.log('DEBUG data_encodee:', JSON.stringify(qrCode.data_encodee))\n")
        lines.insert(i+2, "    console.log('DEBUG decl:', JSON.stringify(decl))\n")
        lines.insert(i+3, "    console.log('DEBUG volRecycle:', volRecycle, 'volVierge:', volVierge)\n")
        break

with open("src/app/tracabilite/[qrId]/page.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done")
