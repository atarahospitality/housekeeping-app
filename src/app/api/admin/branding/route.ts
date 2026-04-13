import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { propertyName, primaryColor, accentColor } = body

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('branding_config')
      .upsert({
        id: 'default',
        property_name: propertyName,
        primary_color: primaryColor,
        accent_color: accentColor,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/branding]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
