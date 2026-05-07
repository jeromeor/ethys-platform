with open('src/app/(auth)/register/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const [showPassword, setShowPassword] = useState(false)" in line:
        lines[i] = line + "  const [confirmPassword, setConfirmPassword] = useState('')\n  const [showConfirm, setShowConfirm] = useState(false)\n"
    if "setError(error.message)" in line:
        lines[i] = "    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); setLoading(false); return }\n    " + line.lstrip()

with open('src/app/(auth)/register/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
