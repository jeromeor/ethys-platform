with open('src/app/(auth)/forgot-password/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "redirectTo: 'https://www.ethys-textileloop.com/reset-password'",
    "redirectTo: 'https://www.ethys-textileloop.com/auth/callback?next=/reset-password'"
)

with open('src/app/(auth)/forgot-password/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
