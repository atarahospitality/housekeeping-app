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
  CloudbedsAssignedRoom,
} from './types'

function mapCheckoutStatus(status: string): CheckoutStatus {
  if (status === 'checked_out') return 'checked_out'
  if (status === 'confirmed' || status === 'not_confirmed') return 'not_arrived'
  return 'not_checked_out' // checked_in
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
 * A single reservation can have multiple rooms (group booking) — we expand it into
 * one DepartureRoom card per assigned room.
 *
 * Priority for room data:
 *  1. r.rooms[] or top-level roomID (if Cloudbeds includes it in getReservations)
 *  2. assignment.assigned[] from getReservationAssignments
 *  3. Falls back to a single card with empty room fields
 */
export function normalizeDepartures(
  reservations: CloudbedsReservation[],
  housekeepingMap: Map<string, CloudbedsHousekeepingRoom>,
  assignmentMap: Map<string, CloudbedsReservationAssignment> = new Map()
): DepartureRoom[] {
  const results: DepartureRoom[] = []

  for (const r of reservations) {
    const guestFirstName = firstNameOnly(r.guestName)
    const checkoutStatus = mapCheckoutStatus(r.status)

    // Collect all assigned rooms for this reservation
    // Priority: r.rooms[] from getReservations, else assignment.assigned[]
    const assignedRooms: CloudbedsAssignedRoom[] =
      r.rooms && r.rooms.length > 0
        ? r.rooms
        : assignmentMap.get(r.reservationID)?.assigned ?? []

    if (assignedRooms.length > 0) {
      // One card per room
      for (const assignedRoom of assignedRooms) {
        const roomID = assignedRoom.roomID ?? ''
        const hk = roomID ? housekeepingMap.get(roomID) : undefined
        results.push({
          reservationId: r.reservationID,
          roomId: roomID,
          roomNumber: assignedRoom.roomName ?? '',
          roomTypeName: assignedRoom.roomTypeName ?? '',
          guestFirstName,
          checkOutDate: r.endDate,
          checkoutStatus,
          roomCondition: mapRoomCondition(hk?.roomCondition ?? 'dirty'),
          lastUpdated: new Date().toISOString(),
        })
      }
    } else {
      // No room data available — emit one card with empty room fields
      const roomID = r.roomID ?? ''
      const hk = roomID ? housekeepingMap.get(roomID) : undefined
      results.push({
        reservationId: r.reservationID,
        roomId: roomID,
        roomNumber: r.roomName ?? '',
        roomTypeName: r.roomTypeName ?? '',
        guestFirstName,
        checkOutDate: r.endDate,
        checkoutStatus,
        roomCondition: mapRoomCondition(hk?.roomCondition ?? 'dirty'),
        lastUpdated: new Date().toISOString(),
      })
    }
  }

  return results
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
