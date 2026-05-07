with open('src/app/(auth)/onboarding/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const [step, setStep] = useState(searchParams.get('step') === 'email' ? 0 : 1)",
    "const [step, setStep] = useState(searchParams.get('step') === 'email' ? 0 : 1)\n  const isRedirected = searchParams.get('redirect') === '1'"
)

content = content.replace(
    """<div style={{ padding: '12px 14px', borderRadius: 10, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 12 }}>
              Vous avez tenté d'accéder à une page qui nécessite un profil complet. Veuillez renseigner vos coordonnées pour débloquer l'accès à tous les modules.
            </div>""",
    """{isRedirected && (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 12, color: '#92400E', marginBottom: 12 }}>
                Vous avez tenté d'accéder à une page qui nécessite un profil complet. Veuillez renseigner vos coordonnées pour débloquer l'accès à tous les modules.
              </div>
            )}"""
)

with open('src/app/(auth)/onboarding/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
