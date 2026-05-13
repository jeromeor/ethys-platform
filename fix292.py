content = """import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_code = searchParams.get('error_code')

  console.log('AUTH CALLBACK - code:', code ? 'present' : 'absent', 'error:', error, error_code)

  if (error) {
    return NextResponse.redirect(`${origin}/reset-password?error=${error}&error_code=${error_code}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    console.log('EXCHANGE ERROR:', exchangeError?.message ?? 'none')
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}/reset-password`)
    }
    return NextResponse.redirect(`${origin}/reset-password?error=exchange_failed&msg=${exchangeError.message}`)
  }

  // Pas de code - rediriger vers reset-password avec tous les params
  return NextResponse.redirect(`${origin}/reset-password?${searchParams.toString()}`)
}
"""
open('src/app/auth/callback/route.ts', 'w', encoding='utf-8').write(content)
print("Done")
