// GET /api/cloudbeds/departures?date=YYYY-MM-DD
// Returns today's departures merged with current housekeeping status.
// Server-side only — Cloudbeds keys never reach the browser.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReservationsForDate, getHousekeepingStatus, getReservationAssignments } from '@/lib/cloudbeds/client'
import { normalizeDepartures, buildHousekeepingMap, buildAssignmentMap } from '@/lib/cloudbeds/normalizer'
import { todayYMD, withRetry } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') ?? todayYMD()

    // Yesterday's date — checked-out guests appear in yesterday's assignments
    // (they've left today so they're gone from today's assignment list)
    const yesterday = new Date(date)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    // Fetch all four in parallel with retry
    const [reservationsRes, housekeepingRes, assignmentsTodayRes, assignmentsYesterdayRes] = await Promise.all([
      withRetry(() => getReservationsForDate(date)),
      withRetry(() => getHousekeepingStatus()),
      withRetry(() => getReservationAssignments(date)).catch(() => null),
      withRetry(() => getReservationAssignments(yesterdayStr)).catch(() => null),
    ])

    if (!reservationsRes.success) {
      return NextResponse.json(
        { error: 'Failed to fetch reservations from Cloudbeds' },
        { status: 502 }
      )
    }

    if (!housekeepingRes.success) {
      return NextResponse.json(
        { error: 'Failed to fetch housekeeping status from Cloudbeds' },
        { status: 502 }
      )
    }

    // Debug: log raw shapes so we can verify field names
    const rawFirst = reservationsRes.data?.[0]
    const rawAssignmentToday = assignmentsTodayRes?.data?.[0]
    const rawAssignmentYesterday = assignmentsYesterdayRes?.data?.[0]
    console.log(`[departures] reservations count=${reservationsRes.data?.length ?? 0} date=${date}`)
    console.log('[departures] raw reservation[0]:', JSON.stringify(rawFirst ?? null))
    console.log('[departures] raw assignment today[0]:', JSON.stringify(rawAssignmentToday ?? null))
    console.log('[departures] raw assignment yesterday[0]:', JSON.stringify(rawAssignmentYesterday ?? null))

    const housekeepingMap = buildHousekeepingMap(housekeepingRes.data)
    // Merge yesterday + today assignments — today's entries win (for still-checked-in guests)
    // Yesterday's entries catch guests who already checked out today
    const assignmentMap = buildAssignmentMap(
      assignmentsYesterdayRes?.data ?? [],
      assignmentsTodayRes?.data ?? []
    )
    const departures = normalizeDepartures(reservationsRes.data, housekeepingMap, assignmentMap)

    // Sort: checked_out rooms first (ready to clean), then by room number
    departures.sort((a, b) => {
      if (a.checkoutStatus !== b.checkoutStatus) {
        return a.checkoutStatus === 'checked_out' ? -1 : 1
      }
      return (a.roomNumber ?? '').localeCompare(b.roomNumber ?? '', undefined, { numeric: true })
    })

    return NextResponse.json({
      data: departures,
      error: null,
      _debug: {
        rawFirst,
        rawAssignmentToday,
        rawAssignmentYesterday,
        rawHkRoom: housekeepingRes.data?.[0] ?? null,
        reservationCount: reservationsRes.data?.length,
        hkRoomCount: housekeepingRes.data?.length,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[departures] Error:', msg)
    return NextResponse.json(
      { data: null, error: msg },
      { status: 500 }
    )
  }
}
