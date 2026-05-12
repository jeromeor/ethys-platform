with open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Deplacer le lien DANS le div maxWidth 400
content = content.replace(
    "        </div>\n        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#d4c5b0' }}>\n          <a href='/mentions-legales' style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions l\u00e9gales &amp; RGPD</a>\n          {' \u2014 '} TEXTILE LOOP \u00a9 2026\n        </div>\n      </div>",
    "          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#d4c5b0' }}>\n            <a href='/mentions-legales' style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions l\u00e9gales &amp; RGPD</a>\n            {' \u2014 '} TEXTILE LOOP \u00a9 2026\n          </div>\n        </div>\n      </div>"
)

with open('src/app/(auth)/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
