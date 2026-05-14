import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const token = searchParams.get('token')
  const type = searchParams.get('type') as 'recovery' | 'magiclink' | 'email' | 'signup' | null
  const error = searchParams.get('error')
  const next = searchParams.get('next') ?? (type === 'recovery' ? '/update-password' : '/dashboard')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }

  const supabase = await createClient()

  const hash = token_hash ?? token

  if (hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: hash, type })
    if (!verifyError) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/login?error=verify_failed`)
  }

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
