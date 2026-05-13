content = """import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const next = searchParams.get('next') ?? '/dashboard'

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
"""
open('src/app/auth/callback/route.ts', 'w', encoding='utf-8').write(content)
print("Done")
