# LOGIN - deplacer le lien a l interieur du return
with open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Supprimer les lignes 125-129 (lien hors return)
del lines[124]  # <div mentions
del lines[124]  # 
del lines[124]  # {' - '}
del lines[124]  # </div>
# Maintenant ligne 124 est </div> - on insere le lien avant
lines.insert(123, "      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#d4c5b0' }}>\n        <a href='/mentions-legales' style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions l\u00e9gales &amp; RGPD</a>\n        {' \u2014 '} TEXTILE LOOP \u00a9 2026\n      </div>\n")

with open('src/app/(auth)/login/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done login")

# REGISTER - meme chose
with open('src/app/(auth)/register/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Supprimer lignes 111-114
del lines[110]  # <div mentions
del lines[110]  # 
del lines[110]  # {' - '}
del lines[110]  # </div>
# Inserer avant la ligne </div> finale
lines.insert(109, "      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#d4c5b0' }}>\n        <a href='/mentions-legales' style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions l\u00e9gales &amp; RGPD</a>\n        {' \u2014 '} TEXTILE LOOP \u00a9 2026\n      </div>\n")

with open('src/app/(auth)/register/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done register")
