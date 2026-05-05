files = [
    r"src\components\modules\CommandesClient.tsx",
    r"src\components\modules\ProductionClient.tsx",
    r"src\components\modules\ReportingClient.tsx"
]

replacements = [
    ('âœ"', 'v'),
    ('recyclÃ©', 'recyclé'),
    ('RecyclÃ©', 'Recyclé'),
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed: " + filepath)

print("Done!")
