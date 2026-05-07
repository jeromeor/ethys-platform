with open('src/proxy.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "return NextResponse.redirect(new URL('/onboarding', request.url))",
    "return NextResponse.redirect(new URL('/onboarding?redirect=1', request.url))"
)

with open('src/proxy.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
