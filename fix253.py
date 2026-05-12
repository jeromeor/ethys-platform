with open('src/app/(auth)/forgot-password/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "background: loading ? '#E2E8F0' : '#0A3D26'",
    "background: loading ? '#e8e3d8' : '#1a1a1a'"
)
content = content.replace(
    "color: loading ? '#94A3B8' : '#fff'",
    "color: loading ? '#8b7355' : '#fff'"
)
content = content.replace("borderRadius: 10", "borderRadius: 4")
content = content.replace("borderRadius: 16", "borderRadius: 8")
content = content.replace("border: '1px solid #EEF0F3'", "border: '1px solid #e8e3d8'")
content = content.replace("background: '#D1FAE5'", "background: '#f0f4ec'")
content = content.replace("border: '1.5px solid #E2E8F0'", "border: '1.5px solid #d4c5b0'")
content = content.replace("color: '#1A202C'", "color: '#1a1a1a'")
content = content.replace("fontFamily: \"'DM Sans', sans-serif\"", "fontFamily: \"'Inter', system-ui, sans-serif\"")

with open('src/app/(auth)/forgot-password/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done forgot-password")

# Meme chose pour reset-password
try:
    with open('src/app/(auth)/reset-password/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("background: '#0A3D26'", "background: '#1a1a1a'")
    content = content.replace("background: loading ? '#E2E8F0' : '#0A3D26'", "background: loading ? '#e8e3d8' : '#1a1a1a'")
    content = content.replace("color: loading ? '#94A3B8' : '#fff'", "color: loading ? '#8b7355' : '#fff'")
    content = content.replace("borderRadius: 10", "borderRadius: 4")
    content = content.replace("borderRadius: 16", "borderRadius: 8")
    content = content.replace("border: '1px solid #EEF0F3'", "border: '1px solid #e8e3d8'")
    content = content.replace("border: '1.5px solid #E2E8F0'", "border: '1.5px solid #d4c5b0'")
    content = content.replace("fontFamily: \"'DM Sans', sans-serif\"", "fontFamily: \"'Inter', system-ui, sans-serif\"")
    with open('src/app/(auth)/reset-password/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Done reset-password")
except Exception as e:
    print(f"Error: {e}")
