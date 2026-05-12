content = open('src/app/(auth)/reset-password/page.tsx', 'r', encoding='utf-8').read()

content = content.replace(
    "  const [ready, setReady] = useState(true)\n\n  const handleReset",
    """  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase envoie le token via le hash ou query params
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    // Verifier si deja une session active
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset"""
)

open('src/app/(auth)/reset-password/page.tsx', 'w', encoding='utf-8').write(content)
print("Done")
