with open("src/components/modules/MessagerieClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "currentUser: { id: string; email: string }",
    "currentUser: { id: string; email: string; prenom?: string; nom?: string }"
)

content = content.replace(
    "const nomExpediteur = (msg: Message) => {\n    if (msg.auteur_id === currentUser.id) {\n      const moi = utilisateurs.find(u => u.id === currentUser.id)\n      if (moi?.prenom && moi?.nom) return `${moi.prenom} ${moi.nom}`\n      return currentUser.email\n    }\n    const auteur = utilisateurs.find(u => u.id === msg.auteur_id)\n    if (auteur?.prenom && auteur?.nom) return `${auteur.prenom} ${auteur.nom}`\n    return auteur?.email ?? 'Inconnu'\n  }",
    "const nomExpediteur = (msg: Message) => {\n    if (msg.auteur_id === currentUser.id) {\n      if (currentUser.prenom && currentUser.nom) return `${currentUser.prenom} ${currentUser.nom}`\n      return currentUser.email\n    }\n    const auteur = utilisateurs.find(u => u.id === msg.auteur_id)\n    if (auteur?.prenom && auteur?.nom) return `${auteur.prenom} ${auteur.nom}`\n    return auteur?.email ?? 'Inconnu'\n  }"
)

with open("src/components/modules/MessagerieClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
