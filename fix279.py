import glob

files = [
    'src/app/(auth)/forgot-password/page.tsx',
    'src/app/(auth)/reset-password/page.tsx',
    'src/app/(auth)/login/page.tsx',
    'src/app/(auth)/register/page.tsx',
    'src/app/(auth)/onboarding/page.tsx',
    'src/app/(auth)/en-attente/page.tsx',
    'src/app/mentions-legales/page.tsx',
]

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content
        content = content.replace(
            '<img src="/logo_ethys.png" alt="ETHYS"',
            '<a href="/login" style={{ display: "block" }}><img src="/logo_ethys.png" alt="ETHYS"'
        )
        # Fermer le lien apres l image
        content = content.replace(
            '" style={{ display: "block" }}><img src="/logo_ethys.png" alt="ETHYS" style={{ width: 80, height: \'auto\', margin: \'0 auto 8px\', display: \'block\' }} />',
            '" style={{ display: "block" }}><img src="/logo_ethys.png" alt="ETHYS" style={{ width: 80, height: \'auto\', margin: \'0 auto 8px\', display: \'block\', cursor: \'pointer\' }} /></a>'
        )
        content = content.replace(
            '" style={{ display: "block" }}><img src="/logo_ethys.png" alt="ETHYS" style={{ width: 70, height: \'auto\', margin: \'0 auto 8px\', display: \'block\' }} />',
            '" style={{ display: "block" }}><img src="/logo_ethys.png" alt="ETHYS" style={{ width: 70, height: \'auto\', margin: \'0 auto 8px\', display: \'block\', cursor: \'pointer\' }} /></a>'
        )
        content = content.replace(
            '" style={{ display: "block" }}><img src="/logo_ethys.png" alt="ETHYS" style={{ width: 60, height: \'auto\', marginBottom: 16 }} />',
            '" style={{ display: "block" }}><img src="/logo_ethys.png" alt="ETHYS" style={{ width: 60, height: \'auto\', marginBottom: 16, cursor: \'pointer\' }} /></a>'
        )
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {filepath}")
    except Exception as e:
        print(f"Error {filepath}: {e}")
print("Done")
