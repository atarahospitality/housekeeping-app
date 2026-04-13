// POST /api/cloudbeds/update-room
// Body: { roomId: string, condition: 'clean' | 'dirty', roomNumber: string }
// Updates room condition in Cloudbeds + writes audit log.

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { updateRoomCondition } from '@/lib/cloudbeds/client'
import { withRetry } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { roomId, condition, roomNumber, fromCondition } = body

    if (!roomId || !condition || !['clean', 'dirty'].includes(condition)) {
      return NextResponse.json(
        { error: 'Missing or invalid parameters' },
        { status: 400 }
      )
    }

    // Call Cloudbeds with retry
    const result = await withRetry(
      () => updateRoomCondition(roomId, condition),
      3,
      500
    )

    if (!result.success) {
      return NextResponse.json(
        { error: 'Cloudbeds rejected the update' },
        { status: 502 }
      )
    }

    // Write audit log (best-effort — don't fail the request if this fails)
    try {
      const adminClient = createAdminClient()
      await adminClient.from('housekeeping_audit_log').insert({
        user_id: user.id,
        user_email: user.email,
        room_id: roomId,
        room_number: roomNumber ?? roomId,
        from_condition: fromCondition ?? null,
        to_condition: condition,
      })
    } catch (auditErr) {
      console.warn('[update-room] Audit log write failed:', auditErr)
    }

    return NextResponse.json({ success: true, condition, error: null })
  } catch (err) {
    console.error('[update-room] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to update room condition' },
      { status: 500 }
    )
  }
}
