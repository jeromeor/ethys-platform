with open('src/app/(auth)/register/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "router.push('/dashboard')\n    router.refresh()",
    "router.push('/onboarding')\n    router.refresh()"
)

with open('src/app/(auth)/register/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
