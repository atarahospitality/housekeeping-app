// GET /api/cloudbeds/oauth/callback
// Exchanges the authorization code for access + refresh tokens,
// stores them in Supabase, and redirects back to admin settings.
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    const msg = error || 'missing_code'
    return NextResponse.redirect(
      new URL(`/admin?cloudbeds_error=${encodeURIComponent(msg)}`, request.url)
    )
  }

  const clientId = process.env.CLOUDBEDS_CLIENT_ID!
  const clientSecret = process.env.CLOUDBEDS_CLIENT_SECRET!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`
  const redirectUri = `${appUrl}/api/cloudbeds/oauth/callback`

  // Exchange code for tokens
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  })

  const tokenRes = await fetch('https://hotels.cloudbeds.com/api/v1.2/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    cache: 'no-store',
  })

  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    console.error('Token exchange failed:', text)
    return NextResponse.redirect(
      new URL(`/admin?cloudbeds_error=${encodeURIComponent('token_exchange_failed')}`, request.url)
    )
  }

  const tokens = await tokenRes.json()
  // tokens: { access_token, refresh_token, expires_in, token_type }

  // Persist in Supabase so the server can use them without env restarts
  const adminClient = createAdminClient()
  await adminClient
    .from('cloudbeds_tokens')
    .upsert({
      id: 'default',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })

  return NextResponse.redirect(new URL('/admin?cloudbeds_connected=1', request.url))
}
