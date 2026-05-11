with open('src/app/(auth)/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "minHeight: '100vh', display: 'flex',\n      background: '#f5f3ef',\n      fontFamily: \"'Inter', system-ui, sans-serif\"",
    "height: '100vh', display: 'flex', overflow: 'hidden',\n      background: '#f5f3ef',\n      fontFamily: \"'Inter', system-ui, sans-serif\""
)

# Reduire les espacements pour tout faire tenir
content = content.replace("marginBottom: 40 }", "marginBottom: 20 }")
content = content.replace("padding: '36px 32px'", "padding: '24px 28px'")
content = content.replace("marginBottom: 28 }", "marginBottom: 18 }")
content = content.replace("marginBottom: 18 }", "marginBottom: 12 }")
content = content.replace("marginBottom: 10 }", "marginBottom: 8 }")
content = content.replace("marginBottom: 22 }", "marginBottom: 14 }")
content = content.replace("marginTop: 24 }", "marginTop: 16 }")
content = content.replace("width: 100, height: 'auto', margin: '0 auto 12px'", "width: 80, height: 'auto', margin: '0 auto 8px'")

with open('src/app/(auth)/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
