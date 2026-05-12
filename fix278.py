with open('src/app/api/send-deletion-email/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Verifier si generateLink est encore present
if 'generateLink' in content:
    print("generateLink found - already removed in fix277")
else:
    print("generateLink not found - OK")
