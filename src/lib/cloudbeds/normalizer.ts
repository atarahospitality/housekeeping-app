// ─────────────────────────────────────────────
//  Normalizes raw Cloudbeds responses into clean
//  internal domain types.
//  UI logic never touches raw Cloudbeds shapes.
// ─────────────────────────────────────────────

import type { DepartureRoom, CheckoutStatus, RoomCondition } from '@/types'
import type {
  CloudbedsReservation,
  CloudbedsHousekeepingRoom,
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
 * Combine a list of reservations with the live housekeeping status map
 * to produce the unified DepartureRoom list shown to housekeepers.
 *
 * Room data may live in r.rooms[0] (nested array) or as top-level fields
 * depending on the Cloudbeds API version / response mode.
 */
export function normalizeDepartures(
  reservations: CloudbedsReservation[],
  housekeepingMap: Map<string, CloudbedsHousekeepingRoom>
): DepartureRoom[] {
  return reservations.map((r) => {
    // Prefer nested rooms array, fall back to top-level fields
    const firstRoom = r.rooms?.[0]
    const roomID = firstRoom?.roomID ?? r.roomID ?? ''
    const roomName = firstRoom?.roomName ?? r.roomName ?? ''
    const roomTypeName = firstRoom?.roomTypeName ?? r.roomTypeName ?? ''

    const hk = roomID ? housekeepingMap.get(roomID) : undefined

    return {
      reservationId: r.reservationID,
      roomId: roomID,
      roomNumber: roomName,
      roomTypeName,
      guestFirstName: firstNameOnly(r.guestName),
      checkOutDate: r.endDate,          // Cloudbeds uses endDate for departure
      checkoutStatus: mapCheckoutStatus(r.status),
      roomCondition: mapRoomCondition(hk?.roomCondition ?? 'dirty'),
      lastUpdated: new Date().toISOString(),
    }
  })
}

/**
 * Build a Map<roomID, housekeeping> for O(1) lookup.
 */
export function buildHousekeepingMap(
  rooms: CloudbedsHousekeepingRoom[]
): Map<string, CloudbedsHousekeepingRoom> {
  return new Map(rooms.map((r) => [r.roomID, r]))
}
