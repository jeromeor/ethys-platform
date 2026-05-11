with open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "<img src=\"/logo_ethys.png\" alt=\"ETHYS\" style={{ width: 80, height: 'auto', margin: '0 auto 12px', display: 'block' }} />",
    """<div style={{ width: 80, height: 80, background: '#1a1a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', padding: 10, boxSizing: 'border-box' }}>
            <img src="/logo_ethys.png" alt="ETHYS" style={{ width: '100%', height: 'auto', filter: 'invert(1)' }} />
          </div>"""
)

with open('src/app/(auth)/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
