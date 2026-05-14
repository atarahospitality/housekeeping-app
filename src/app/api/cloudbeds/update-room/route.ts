// POST /api/cloudbeds/update-room
// Body: { roomId: string, condition: 'clean' | 'dirty', roomNumber: string }
// Updates room condition in Cloudbeds + writes audit log.

import { NextResponse } from 'next/server'
import { updateRoomCondition } from '@/lib/cloudbeds/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { roomId, condition, roomNumber, fromCondition } = body

    if (!roomId || !condition || !['clean', 'dirty'].includes(condition)) {
      return NextResponse.json(
        { error: 'Missing or invalid parameters' },
        { status: 400 }
      )
    }

    // Call Cloudbeds (no retry — retrying a failed write could double-update)
    let result: Awaited<ReturnType<typeof updateRoomCondition>>
    try {
      result = await updateRoomCondition(roomId, condition)
    } catch (cbErr) {
      const msg = cbErr instanceof Error ? cbErr.message : String(cbErr)
      console.error('[update-room] Cloudbeds API threw:', msg)
      return NextResponse.json(
        { success: false, error: `Cloudbeds error: ${msg}` },
        { status: 502 }
      )
    }

    if (!result.success) {
      const msg = result.message ?? 'No message returned'
      console.error('[update-room] Cloudbeds returned success=false:', msg, '| roomId:', roomId, '| condition:', condition)
      return NextResponse.json(
        { success: false, error: `Cloudbeds rejected: ${msg}` },
        { status: 502 }
      )
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
