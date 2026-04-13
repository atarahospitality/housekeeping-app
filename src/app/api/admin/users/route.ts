import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userRoles } = await request.json() as { userRoles: Record<string, string> }

    const adminClient = createAdminClient()
    const updates = Object.entries(userRoles).map(([id, role]) =>
      adminClient
        .from('user_profiles')
        .update({ role })
        .eq('id', id)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/users]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
