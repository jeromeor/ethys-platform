with open("src/proxy.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    """  // Niveau 2 - En attente validation entreprise
  if (!entrepriseValidee) {
    if (!MINIMAL_PATHS.some(p => pathname.startsWith(p)) && pathname !== '/messagerie') {
      return NextResponse.redirect(new URL('/en-attente', request.url))
    }
    return response
  }""",
    """  // Niveau 2 - En attente validation entreprise (DESACTIVE POUR TESTS BETA)
  // if (!entrepriseValidee) {
  //   if (!MINIMAL_PATHS.some(p => pathname.startsWith(p)) && pathname !== '/messagerie') {
  //     return NextResponse.redirect(new URL('/en-attente', request.url))
  //   }
  //   return response
  // }"""
)

with open("src/proxy.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
