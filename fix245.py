import glob

files = glob.glob('src/components/modules/ProfilClient.tsx') + \
        glob.glob('src/components/modules/AnnuaireClient.tsx') + \
        glob.glob('src/components/modules/ProductionClient.tsx')

replacements = [
    ("background: 'linear-gradient(135deg, #0A3D26", "background: 'linear-gradient(135deg, #1a1a1a"),
    ("background: 'linear-gradient(135deg,#0A3D26", "background: 'linear-gradient(135deg,#1a1a1a"),
    ("background: '#0A3D26'", "background: '#1a1a1a'"),
    ("background: '#0D5C3A'", "background: '#1a1a1a'"),
    ("color: '#0A3D26'", "color: '#1a1a1a'"),
    ("color: '#065F46'", "color: '#2d5016'"),
    ("background: '#10B981'", "background: '#2d5016'"),
    ("background: '#D1FAE5'", "background: '#f0f4ec'"),
    ("color: '#10B981'", "color: '#2d5016'"),
    ("border: '1px solid #10B981'", "border: '1px solid #2d5016'"),
    ("border: '2px solid #10B981'", "border: '2px solid #2d5016'"),
]

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content
        for old, new in replacements:
            content = content.replace(old, new)
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {filepath}")
    except Exception as e:
        print(f"Error {filepath}: {e}")
print("Done")
