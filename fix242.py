import glob

with open('src/components/modules/CertificationClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ('#0A3D26', '#1a1a1a'),
    ('#0D5C3A', '#1a1a1a'),
    ('#065F46', '#2d5016'),
    ('#10B981', '#8b7355'),
    ('#6EE7B7', '#c2956e'),
    ('#D1FAE5', '#f0f4ec'),
    ('#A7F3D0', '#c8d8b8'),
    ('#34D399', '#c2956e'),
    ('#059669', '#2d5016'),
    ('#ECFDF5', '#f0f4ec'),
    ('#F0FDF4', '#f0f4ec'),
    ('borderRadius: 16', 'borderRadius: 8'),
    ('borderRadius: 12', 'borderRadius: 6'),
    ('borderRadius: 20', 'borderRadius: 4'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('src/components/modules/CertificationClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
