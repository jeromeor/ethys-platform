with open('src/app/(auth)/reset-password/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    """  useEffect(() => {
    // Verifier si erreur dans l URL
    const errorCode = searchParams.get('error_code')
    if (errorCode) {
      setError('Le lien de r\u00e9initialisation est invalide ou a expir\u00e9. Veuillez en demander un nouveau.')
      return
    }

    // Ecouter l evenement PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true)
      }
    })

    // Verifier session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])""",
    """  useEffect(() => {
    const errorCode = searchParams.get('error_code')
    if (errorCode) {
      setError('Le lien de r\u00e9initialisation est invalide ou a expir\u00e9. Veuillez en demander un nouveau.')
      return
    }

    const code = searchParams.get('code')
    if (code) {
      // Echanger le code PKCE contre une session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError('Le lien est invalide ou a expir\u00e9. Veuillez en demander un nouveau.')
        } else {
          setReady(true)
        }
      })
      return
    }

    // Ecouter l evenement PASSWORD_RECOVERY (flux hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])"""
)

with open('src/app/(auth)/reset-password/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
