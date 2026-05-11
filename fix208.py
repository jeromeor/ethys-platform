with open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "src=\"/logo_ethys.jpg\"",
    "src=\"/logo_ethys.png\""
)
content = content.replace(
    "filter: 'invert(1)'",
    ""
)
# Retirer le fond noir - logo transparent sur fond clair
content = content.replace(
    """<div style={{ width: 100, height: 100, background: '#1a1a1a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', padding: 12, boxSizing: 'border-box' as const }}>
            <img src="/logo_ethys.png" alt="ETHYS" style={{ width: '100%', height: 'auto',  }} />
          </div>""",
    """<img src="/logo_ethys.png" alt="ETHYS" style={{ width: 100, height: 'auto', margin: '0 auto 12px', display: 'block' }} />"""
)

with open('src/app/(auth)/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done login")

with open('src/components/layout/SidebarLayout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("src='/logo_ethys.jpg'", "src='/logo_ethys.png'")
content = content.replace('src="/logo_ethys.jpg"', 'src="/logo_ethys.png"')
content = content.replace("filter: 'invert(1)', flexShrink: 0", "flexShrink: 0")

with open('src/components/layout/SidebarLayout.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done sidebar")
