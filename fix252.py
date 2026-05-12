import glob

files = [
    'src/app/(auth)/forgot-password/page.tsx',
    'src/app/(auth)/reset-password/page.tsx',
    'src/app/not-found.tsx',
]

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content
        content = content.replace('src="/logo.png"', 'src="/logo_ethys.png"')
        content = content.replace("src='/logo.png'", "src='/logo_ethys.png'")
        content = content.replace("background: '#0A3D26'", "background: '#1a1a1a'")
        content = content.replace("background: '#0D5C3A'", "background: '#1a1a1a'")
        content = content.replace("color: '#0A3D26'", "color: '#1a1a1a'")
        content = content.replace("color: '#065F46'", "color: '#2d5016'")
        content = content.replace("border: '1px solid #0A3D26'", "border: '1px solid #1a1a1a'")
        content = content.replace("border: '2px solid #0A3D26'", "border: '2px solid #1a1a1a'")
        content = content.replace("background: '#F7F8FA'", "background: '#f5f3ef'")
        content = content.replace("background: 'linear-gradient(135deg,#0A3D26", "background: 'linear-gradient(135deg,#1a1a1a")
        content = content.replace("background: 'linear-gradient(135deg, #0A3D26", "background: 'linear-gradient(135deg, #1a1a1a")
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {filepath}")
        else:
            print(f"No change: {filepath}")
    except Exception as e:
        print(f"Error {filepath}: {e}")
print("Done")
