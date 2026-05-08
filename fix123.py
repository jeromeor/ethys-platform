with open("src/app/(auth)/reset-password/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Rendre ready true par defaut et supprimer la dependance a PASSWORD_RECOVERY
content = content.replace(
    "const [ready, setReady] = useState(false)\n\n  useEffect(() => {\n    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {\n      if (event === 'PASSWORD_RECOVERY') setReady(true)\n    })\n    return () => subscription.unsubscribe()\n  }, [])",
    "const [ready, setReady] = useState(true)"
)

# Supprimer les references a ready dans le bouton
content = content.replace(
    "disabled={loading || !ready}",
    "disabled={loading}"
)
content = content.replace(
    "background: loading || !ready ? '#E2E8F0' : '#0A3D26'",
    "background: loading ? '#E2E8F0' : '#0A3D26'"
)
content = content.replace(
    "color: loading || !ready ? '#94A3B8' : '#fff'",
    "color: loading ? '#94A3B8' : '#fff'"
)
content = content.replace(
    "cursor: loading || !ready ? 'default' : 'pointer'",
    "cursor: loading ? 'default' : 'pointer'"
)
content = content.replace(
    "if (!ready && (\n                <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8 }}>\n                  En attente de validation du lien...\n                </div>\n              )}", ""
)

with open("src/app/(auth)/reset-password/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
