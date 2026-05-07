import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/tracabilite']
const ONBOARDING_PATHS = ['/onboarding', '/en-attente']
const MINIMAL_PATHS = ['/dashboard', '/profil', '/onboarding', '/en-attente']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return response
  if (pathname.startsWith('/api')) return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const { data: profil } = await supabase
    .from('profils_utilisateurs')
    .select('prenom, nom, telephone, adresse_rue, adresse_ville, entreprise_id, email_valide, date_limite_completion, profil_complete_at')
    .eq('id', user.id)
    .single()

  if (!profil) return NextResponse.redirect(new URL('/login', request.url))

  const emailValide = user.email_confirmed_at != null
  const profilComplet = !!(profil.prenom && profil.nom && profil.telephone && profil.adresse_rue && profil.adresse_ville)
  const entrepriseValidee = !!profil.entreprise_id
  const delaiExpire = profil.date_limite_completion ? new Date(profil.date_limite_completion) < new Date() : false

  // Niveau 0 - Email non valide
  if (!emailValide) {
    if (!ONBOARDING_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL('/onboarding?step=email', request.url))
    }
    return response
  }

  // Niveau 1 - Profil incomplet ou delai expire
  if (!profilComplet || delaiExpire) {
    if (!MINIMAL_PATHS.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    return response
  }

  // Niveau 2 - En attente validation entreprise
  if (!entrepriseValidee) {
    if (!MINIMAL_PATHS.some(p => pathname.startsWith(p)) && pathname !== '/messagerie') {
      return NextResponse.redirect(new URL('/en-attente', request.url))
    }
    return response
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
}
