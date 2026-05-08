with open('src/app/(auth)/onboarding/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Ajouter state pour les erreurs
content = content.replace(
    "const [saving, setSaving] = useState(false)",
    "const [saving, setSaving] = useState(false)\n  const [errors, setErrors] = useState<Record<string, boolean>>({})"
)

# Modifier la validation pour marquer les champs en rouge
content = content.replace(
    """    if (!form.prenom || !form.nom || !form.telephone || !form.adresse_rue || !form.adresse_ville) {
      setMessage('Veuillez remplir tous les champs obligatoires.')
      return
    }""",
    """    const newErrors: Record<string, boolean> = {}
    if (!form.prenom) newErrors.prenom = true
    if (!form.nom) newErrors.nom = true
    if (!form.telephone) newErrors.telephone = true
    if (!form.adresse_rue) newErrors.adresse_rue = true
    if (!form.adresse_ville) newErrors.adresse_ville = true
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setMessage('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setErrors({})"""
)

# Ajouter style rouge sur les inputs - prenom
content = content.replace(
    "value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} style={inputStyle} placeholder=\"Marie\"",
    "value={form.prenom} onChange={e => { setForm(f => ({ ...f, prenom: e.target.value })); setErrors(e2 => ({ ...e2, prenom: false })) }} style={{ ...inputStyle, borderColor: errors.prenom ? '#EF4444' : '#E2E8F0' }} placeholder=\"Marie\""
)

# nom
content = content.replace(
    "value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} placeholder=\"Dupont\"",
    "value={form.nom} onChange={e => { setForm(f => ({ ...f, nom: e.target.value })); setErrors(e2 => ({ ...e2, nom: false })) }} style={{ ...inputStyle, borderColor: errors.nom ? '#EF4444' : '#E2E8F0' }} placeholder=\"Dupont\""
)

# telephone
content = content.replace(
    "value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} placeholder=\"06 12 34 56 78\"",
    "value={form.telephone} onChange={e => { setForm(f => ({ ...f, telephone: e.target.value })); setErrors(e2 => ({ ...e2, telephone: false })) }} style={{ ...inputStyle, borderColor: errors.telephone ? '#EF4444' : '#E2E8F0' }} placeholder=\"06 12 34 56 78\""
)

# adresse_rue
content = content.replace(
    "value={form.adresse_rue} onChange={e => setForm(f => ({ ...f, adresse_rue: e.target.value }))} style={{ ...inputStyle, marginBottom: 8 }} placeholder=\"12 rue de la Paix\"",
    "value={form.adresse_rue} onChange={e => { setForm(f => ({ ...f, adresse_rue: e.target.value })); setErrors(e2 => ({ ...e2, adresse_rue: false })) }} style={{ ...inputStyle, marginBottom: 8, borderColor: errors.adresse_rue ? '#EF4444' : '#E2E8F0' }} placeholder=\"12 rue de la Paix\""
)

# adresse_ville
content = content.replace(
    "value={form.adresse_ville} onChange={e => setForm(f => ({ ...f, adresse_ville: e.target.value }))} style={inputStyle} placeholder=\"Paris\"",
    "value={form.adresse_ville} onChange={e => { setForm(f => ({ ...f, adresse_ville: e.target.value })); setErrors(e2 => ({ ...e2, adresse_ville: false })) }} style={{ ...inputStyle, borderColor: errors.adresse_ville ? '#EF4444' : '#E2E8F0' }} placeholder=\"Paris\""
)

with open('src/app/(auth)/onboarding/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
