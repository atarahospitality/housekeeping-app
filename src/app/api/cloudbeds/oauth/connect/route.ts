// GET /api/cloudbeds/oauth/connect
// Redirects admin to the Cloudbeds OAuth authorization page.
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 })
  }

  const clientId = process.env.CLOUDBEDS_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'CLOUDBEDS_CLIENT_ID not set' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`
  const redirectUri = `${appUrl}/api/cloudbeds/oauth/callback`

  const authUrl = new URL('https://hotels.cloudbeds.com/api/v1.2/oauth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'read:reservation read:housekeeping write:housekeeping')

  return NextResponse.redirect(authUrl.toString())
}
