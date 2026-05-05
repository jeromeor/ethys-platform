import os

files = [
    r"src\components\modules\CommandesClient.tsx",
    r"src\components\modules\ProductionClient.tsx",
    r"src\components\modules\ReportingClient.tsx"
]

replacements = [
    ('Ã©', 'é'), ('Ã¨', 'è'), ('Ã´', 'ô'), ('Ã®', 'î'),
    ('Ã ', 'à'), ('Ã¢', 'â'), ('Ã§', 'ç'), ('Ã‰', 'É'),
    ('â€"', '—'), ('â€¦', '…'), ('â™»', '♻'), ('âœ"', '✓'),
    ('Â·', '·'), ('ðŸŒ¿', '🌿'), ('Ã»', 'û'), ('Ã¯', 'ï'),
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed: {filepath}")

print("Done!")
