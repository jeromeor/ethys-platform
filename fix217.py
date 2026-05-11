import os
import glob

files = glob.glob('src/components/modules/*.tsx') + glob.glob('src/components/layout/*.tsx')

replacements = [
    # Couleurs principales
    ("#0A3D26", "#1a1a1a"),
    ("#0D5C3A", "#2a2a2a"),
    ("#065F46", "#2d5016"),
    ("#10B981", "#2d5016"),
    ("#6EE7B7", "#c2956e"),
    ("#D1FAE5", "#f0f4ec"),
    ("#A7F3D0", "#c8d8b8"),
    # Fonds et bordures
    ("#F7F8FA", "#f5f3ef"),
    ("#EEF0F3", "#e8e3d8"),
    ("#E2E8F0", "#d4c5b0"),
    ("#F1F5F9", "#f5f3ef"),
    ("#F8FAFC", "#f5f3ef"),
    # Textes
    ("#94A3B8", "#8b7355"),
    ("#64748B", "#4a5568"),
    ("#475569", "#4a5568"),
    # Erreurs et alertes
    ("#DC2626", "#8b3a3a"),
    ("#FEF2F2", "#fdf0f0"),
    ("#FCA5A5", "#c8a0a0"),
    ("#FEF3C7", "#fdf8ec"),
    ("#FCD34D", "#b8860b"),
    ("#92400E", "#b8860b"),
    # Border radius
    ("borderRadius: 16", "borderRadius: 8"),
    ("borderRadius: 14", "borderRadius: 8"),
    ("borderRadius: 12", "borderRadius: 6"),
    ("borderRadius: 10", "borderRadius: 4"),
    ("borderRadius: 20", "borderRadius: 4"),
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

print("Done")
