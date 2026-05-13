with open('src/app/(auth)/forgot-password/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    """await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` })""",
    """await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })"""
)

with open('src/app/(auth)/forgot-password/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
