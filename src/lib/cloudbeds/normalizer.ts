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

    // 2. Fall back to reservation assignments map (room data in assigned[0])
    if (!roomID) {
      const assignment = assignmentMap.get(r.reservationID)
      if (assignment?.assigned?.[0]) {
        const assignedRoom = assignment.assigned[0]
        roomID = assignedRoom.roomID ?? ''
        roomName = assignedRoom.roomName ?? ''
        roomTypeName = assignedRoom.roomTypeName ?? ''
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
 * Merges multiple assignment arrays (e.g. today + yesterday) — earlier entries
 * are overwritten by later ones, so pass yesterday first, today second.
 */
export function buildAssignmentMap(
  ...assignmentLists: CloudbedsReservationAssignment[][]
): Map<string, CloudbedsReservationAssignment> {
  const map = new Map<string, CloudbedsReservationAssignment>()
  for (const list of assignmentLists) {
    for (const a of list) {
      map.set(a.reservationID, a)
    }
  }
  return map
}

/**
 * Build a Map<roomID, housekeeping> for O(1) lookup.
 */
export function buildHousekeepingMap(
  rooms: CloudbedsHousekeepingRoom[]
): Map<string, CloudbedsHousekeepingRoom> {
  return new Map(rooms.map((r) => [r.roomID, r]))
}
