with open('src/app/(auth)/onboarding/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Supprimer le bloc du message en bas
old_bottom = """{isRedirected && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 12 }}>
                Vous avez tenté d'accéder à une page qui nécessite un profil complet. Veuillez renseigner vos coordonnées pour débloquer l'accès à tous les modules.
              </div>
            )}"""

# L ajouter apres le titre
old_title = """<div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>Complétez votre profil</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24, lineHeight: 1.6 }}>
              Ces informations sont nécessaires pour accéder à l'ensemble des fonctionnalités de la plateforme ETHYS.
            </div>"""

new_title = """<div style={{ fontSize: 18, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>Complétez votre profil</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16, lineHeight: 1.6 }}>
              Ces informations sont nécessaires pour accéder à l'ensemble des fonctionnalités de la plateforme ETHYS.
            </div>
            {isRedirected && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 16 }}>
                Vous avez tenté d'accéder à une page qui nécessite un profil complet. Veuillez renseigner vos coordonnées pour débloquer l'accès à tous les modules.
              </div>
            )}"""

content = content.replace(old_bottom, '')
content = content.replace(old_title, new_title)

with open('src/app/(auth)/onboarding/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
