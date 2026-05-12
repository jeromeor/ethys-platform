with open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Inserer le lien avant la fermeture du div principal (ligne 125 = </div>)
lines[124] = "      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#d4c5b0' }}>\n        <a href='/mentions-legales' style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions l\u00e9gales &amp; RGPD</a>\n        {' \u2014 '} TEXTILE LOOP \u00a9 2026\n      </div>\n    </div>\n"
del lines[125]
del lines[125]
del lines[125]
del lines[125]
del lines[125]

with open('src/app/(auth)/login/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done login")

with open('src/app/(auth)/register/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '<div style={{ textAlign: \'center\', marginTop: 12, fontSize: 11' in line:
        del lines[i]
        del lines[i]
        del lines[i]
        del lines[i]
        break

# Trouver la fin du return et inserer avant
for i in range(len(lines)-1, 0, -1):
    if '    </div>' in lines[i] and '  )\n' in lines[i+1]:
        lines.insert(i+1, "      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#d4c5b0' }}>\n        <a href='/mentions-legales' style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions l\u00e9gales &amp; RGPD</a>\n        {' \u2014 '} TEXTILE LOOP \u00a9 2026\n      </div>\n")
        break

with open('src/app/(auth)/register/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done register")
