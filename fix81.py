with open('src/components/modules/AdminClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const toggleStatut = async (id: string) => {\n    const user = utilisateurs.find(u => u.id === id)\n    if (!user || id === currentUserId) return\n    const newStatut = user.statut === 'actif' ? 'inactif' : 'actif'\n    await supabase.from('profils_utilisateurs').update({ statut: newStatut }).eq('id', id)\n    setUtilisateurs(prev => prev.map(u => u.id === id ? { ...u, statut: newStatut } : u))\n  }",
    """const toggleStatut = async (id: string) => {
    const user = utilisateurs.find(u => u.id === id)
    if (!user || id === currentUserId) return
    const action = user.statut === 'actif' ? 'désactiver' : 'réactiver'
    const confirm = window.confirm(`Voulez-vous vraiment ${action} le compte ${user.email} ?`)
    if (!confirm) return
    const newStatut = user.statut === 'actif' ? 'inactif' : 'actif'
    await supabase.from('profils_utilisateurs').update({ statut: newStatut }).eq('id', id)
    setUtilisateurs(prev => prev.map(u => u.id === id ? { ...u, statut: newStatut } : u))
  }"""
)

with open('src/components/modules/AdminClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
