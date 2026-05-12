with open('src/app/(auth)/forgot-password/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Ajouter redirectTo dans l appel resetPasswordForEmail
content = content.replace(
    "await supabase.auth.resetPasswordForEmail(email)",
    "await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })"
)

with open('src/app/(auth)/forgot-password/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
