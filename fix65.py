with open('src/app/(auth)/onboarding/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "Ces informations sont nécessaires pour accéder à la plateforme ETHYS. Votre entreprise sera validée par TEXTILE LOOP.",
    "Ces informations sont nécessaires pour accéder à l'ensemble des fonctionnalités de la plateforme ETHYS."
)

content = content.replace(
    '<div style={{ padding: \'12px 14px\', borderRadius: 10, background: \'#F0FDF4\', border: \'1px solid #A7F3D0\', fontSize: 12, color: \'#065F46\', marginBottom: 20 }}>\n              Après validation de votre profil, votre entreprise sera vérifiée par TEXTILE LOOP avant que vous puissiez accéder à toutes les fonctionnalités.\n            </div>',
    """<div style={{ padding: '12px 14px', borderRadius: 10, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 12 }}>
              Vous avez tenté d'accéder à une page qui nécessite un profil complet. Veuillez renseigner vos coordonnées pour débloquer l'accès à tous les modules.
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #A7F3D0', fontSize: 12, color: '#065F46', marginBottom: 20 }}>
              Après validation de votre profil, votre entreprise sera vérifiée par TEXTILE LOOP avant que vous puissiez accéder à toutes les fonctionnalités.
            </div>"""
)

with open('src/app/(auth)/onboarding/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
