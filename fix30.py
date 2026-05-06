with open('src/components/modules/MessagerieClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "from('messages')\n      .select('*, auteur:profils_utilisateurs!messages_auteur_id_fkey(email, prenom, nom)')\n      .or(`auteur_id.eq.${currentUser.id},destinataire_id.eq.${currentUser.id}`)\n      .order('created_at', { ascending: true })",
    "from('messages')\n      .select('*')\n      .or(`auteur_id.eq.${currentUser.id},destinataire_id.eq.${currentUser.id}`)\n      .order('created_at', { ascending: true })"
)

content = content.replace(
    "from('messages')\n    .insert({\n        auteur_id: currentUser.id,\n        destinataire_id: destinataireId,\n        contenu: newMessage.trim(),\n        lu: false,\n      })\n      .select('*, auteur:profils_utilisateurs!messages_auteur_id_fkey(email, prenom, nom)')\n      .single()",
    "from('messages')\n    .insert({\n        auteur_id: currentUser.id,\n        destinataire_id: destinataireId,\n        contenu: newMessage.trim(),\n        lu: false,\n      })\n      .select('*')\n      .single()"
)

with open('src/components/modules/MessagerieClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
