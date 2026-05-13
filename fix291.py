content = """import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/reset-password'
  
  // Construire l URL de redirection avec tous les params
  const params = searchParams.toString()
  const redirectUrl = params 
    ? `${origin}${next}?${params}`
    : `${origin}${next}`
    
  return NextResponse.redirect(redirectUrl)
}
"""
open('src/app/auth/callback/route.ts', 'w', encoding='utf-8').write(content)
print("Done")
