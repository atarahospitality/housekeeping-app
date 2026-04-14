// ─────────────────────────────────────────────
//  Normalizes raw Cloudbeds responses into clean
//  internal domain types.
//  UI logic never touches raw Cloudbeds shapes.
// ─────────────────────────────────────────────

import type { DepartureRoom, CheckoutStatus, RoomCondition } from '@/types'
import type {
  CloudbedsReservation,
  CloudbedsHousekeepingRoom,
  CloudbedsReservationAssignment,
} from './types'

function mapCheckoutStatus(status: string): CheckoutStatus {
  return status === 'checked_out' ? 'checked_out' : 'not_checked_out'
}

function mapRoomCondition(condition: string): RoomCondition {
  return condition === 'clean' ? 'clean' : 'dirty'
}

/** Extract first name from "FirstName LastName" */
function firstNameOnly(fullName: string): string {
  if (!fullName) return 'Guest'
  return fullName.split(' ')[0] ?? 'Guest'
}

/**
 * Combine reservations + room assignments + housekeeping status into DepartureRoom[].
 *
 * Priority for room data:
 *  1. r.rooms[0] or top-level roomID (if Cloudbeds includes it in getReservations)
 *  2. assignmentMap[reservationID] from getReservationAssignments
 *  3. Falls back to empty strings (cards render but mark-clean will fail)
 */
export function normalizeDepartures(
  reservations: CloudbedsReservation[],
  housekeepingMap: Map<string, CloudbedsHousekeepingRoom>,
  assignmentMap: Map<string, CloudbedsReservationAssignment> = new Map()
): DepartureRoom[] {
  return reservations.map((r) => {
    // 1. Try nested rooms array or top-level room fields
    const firstRoom = r.rooms?.[0]
    let roomID = firstRoom?.roomID ?? r.roomID ?? ''
    let roomName = firstRoom?.roomName ?? r.roomName ?? ''
    let roomTypeName = firstRoom?.roomTypeName ?? r.roomTypeName ?? ''

    // 2. Fall back to reservation assignments map
    if (!roomID) {
      const assignment = assignmentMap.get(r.reservationID)
      if (assignment) {
        roomID = assignment.roomID ?? ''
        roomName = assignment.roomName ?? ''
        roomTypeName = assignment.roomTypeName ?? ''
      }
    }

    const hk = roomID ? housekeepingMap.get(roomID) : undefined

    return {
      reservationId: r.reservationID,
      roomId: roomID,
      roomNumber: roomName,
      roomTypeName,
      guestFirstName: firstNameOnly(r.guestName),
      checkOutDate: r.endDate,
      checkoutStatus: mapCheckoutStatus(r.status),
      roomCondition: mapRoomCondition(hk?.roomCondition ?? 'dirty'),
      lastUpdated: new Date().toISOString(),
    }
  })
}

/**
 * Build a Map<reservationID, assignment> for O(1) lookup.
 */
export function buildAssignmentMap(
  assignments: CloudbedsReservationAssignment[]
): Map<string, CloudbedsReservationAssignment> {
  return new Map(assignments.map((a) => [a.reservationID, a]))
}

/**
 * Build a Map<roomID, housekeeping> for O(1) lookup.
 */
export function buildHousekeepingMap(
  rooms: CloudbedsHousekeepingRoom[]
): Map<string, CloudbedsHousekeepingRoom> {
  return new Map(rooms.map((r) => [r.roomID, r]))
}
