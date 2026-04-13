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
 */
export function normalizeDepartures(
  reservations: CloudbedsReservation[],
  housekeepingMap: Map<string, CloudbedsHousekeepingRoom>
): DepartureRoom[] {
  return reservations.map((r) => {
    const hk = housekeepingMap.get(r.roomID)

    return {
      reservationId: r.reservationID,
      roomId: r.roomID,
      roomNumber: r.roomName,
      roomTypeName: r.roomTypeName,
      guestFirstName: firstNameOnly(r.guestName),
      checkOutDate: r.checkOutDate,
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
