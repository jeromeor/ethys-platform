# LOGIN
with open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer la fin du fichier
old_end = """          </div>
        </div>
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#d4c5b0' }}>
        <a href='/mentions-legales' style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions l\u00e9gales &amp; RGPD</a>
        {' \u2014 '} TEXTILE LOOP \u00a9 2026
      </div>
      </div>
    </div>
}"""

new_end = """          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#d4c5b0' }}>
        <a href='/mentions-legales' style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions l\u00e9gales &amp; RGPD</a>
        {' \u2014 '} TEXTILE LOOP \u00a9 2026
      </div>
    </div>
  )
}"""

content = content.replace(old_end, new_end)
with open('src/app/(auth)/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done login:", "replaced" if old_end in open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8').read() == False else "not found")

# REGISTER
with open('src/app/(auth)/register/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_end_r = """      </div>
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#d4c5b0' }}>
        <a href='/mentions-legales' style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions l\u00e9gales &amp; RGPD</a>
        {' \u2014 '} TEXTILE LOOP \u00a9 2026
      </div>
  )
}"""

new_end_r = """      </div>
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#d4c5b0' }}>
        <a href='/mentions-legales' style={{ color: '#8b7355', textDecoration: 'none' }}>Mentions l\u00e9gales &amp; RGPD</a>
        {' \u2014 '} TEXTILE LOOP \u00a9 2026
      </div>
    </div>
  )
}"""

content = content.replace(old_end_r, new_end_r)
with open('src/app/(auth)/register/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done register")
