with open("src/components/modules/MessagerieClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# La fonction nomAffiche utilise deja prenom/nom si disponibles
# Le probleme est que currentUser n a pas prenom/nom
# Ajoutons le nom complet dans les messages envoyes
content = content.replace(
    "const nomExpediteur = (msg: Message) => {\n    const auteur = utilisateurs.find(u => u.id === msg.auteur_id) ?? \n      (msg.auteur_id === currentUser.id ? { email: currentUser.email, prenom: undefined, nom: undefined } : null)\n    if (auteur?.prenom && auteur?.nom) return `${auteur.prenom} ${auteur.nom}`\n    return auteur?.email ?? 'Inconnu'\n  }",
    "const nomExpediteur = (msg: Message) => {\n    if (msg.auteur_id === currentUser.id) {\n      const moi = utilisateurs.find(u => u.id === currentUser.id)\n      if (moi?.prenom && moi?.nom) return `${moi.prenom} ${moi.nom}`\n      return currentUser.email\n    }\n    const auteur = utilisateurs.find(u => u.id === msg.auteur_id)\n    if (auteur?.prenom && auteur?.nom) return `${auteur.prenom} ${auteur.nom}`\n    return auteur?.email ?? 'Inconnu'\n  }"
)

with open("src/components/modules/MessagerieClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
