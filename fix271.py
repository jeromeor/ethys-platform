with open('src/app/(dashboard)/profil/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[186] = "    </div>\n  )\n}\n"
del lines[187]

with open('src/app/(dashboard)/profil/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
