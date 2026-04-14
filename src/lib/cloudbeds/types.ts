// ─────────────────────────────────────────────
//  Raw Cloudbeds API response shapes
//  Based on Cloudbeds PMS API v1.2
// ─────────────────────────────────────────────

// Token exchange response
export interface CloudbedsTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

// Reservation status from Cloudbeds
export type CloudbedsReservationStatus =
  | 'checked_in'
  | 'checked_out'
  | 'not_confirmed'
  | 'confirmed'
  | 'canceled'
  | 'no_show'

// A single room assignment nested inside a reservation
export interface CloudbedsReservationRoom {
  roomID: string
  roomName: string          // room number/label e.g. "101"
  roomTypeID?: string
  roomTypeName: string
}

// A single reservation object from GET /getReservations
export interface CloudbedsReservation {
  reservationID: string
  propertyID?: string
  guestName: string         // "FirstName LastName"
  status: CloudbedsReservationStatus
  startDate: string         // YYYY-MM-DD  (check-in date)
  endDate: string           // YYYY-MM-DD  (checkout / departure date)
  adults: number | string
  children: number | string
  // Room assignments — may be array (multi-room) or absent if unassigned
  rooms?: CloudbedsReservationRoom[]
  // Some API responses put the first room inline at top level
  roomID?: string
  roomName?: string
  roomTypeName?: string
}

// GET /getReservations response envelope
export interface CloudbedsGetReservationsResponse {
  success: boolean
  data: CloudbedsReservation[]
  count: number
  total: number
}

// A single room from GET /getHousekeepingStatus
export interface CloudbedsHousekeepingRoom {
  roomID: string
  roomName: string
  roomTypeName: string
  roomCondition: 'clean' | 'dirty'
  roomOccupied: boolean
  frontdeskNotes: string | null
  housekeeper: string | null
}

// GET /getHousekeepingStatus response envelope
export interface CloudbedsGetHousekeepingStatusResponse {
  success: boolean
  data: CloudbedsHousekeepingRoom[]
}

// A single room inside an assignment's "assigned" array
export interface CloudbedsAssignedRoom {
  roomID: string
  roomName: string
  roomTypeName?: string
  roomTypeID?: string
  roomTypeNameShort?: string
  subReservationID?: string
}

// GET /getReservationAssignments — links rooms to reservations for a given date
// Real response shape: { reservationID, guestName, assigned: [ { roomID, roomName, ... } ] }
export interface CloudbedsReservationAssignment {
  reservationID: string
  guestName?: string
  startDate?: string
  endDate?: string
  status?: string
  assigned: CloudbedsAssignedRoom[]   // ← array, NOT top-level fields
}

export interface CloudbedsGetReservationAssignmentsResponse {
  success: boolean
  data: CloudbedsReservationAssignment[]
  count?: number
  total?: number
}

// POST /postHousekeepingStatus request body
export interface CloudbedsPostHousekeepingStatusRequest {
  propertyID: string
  roomID: string
  condition: 'clean' | 'dirty'
}

// POST /postHousekeepingStatus response
export interface CloudbedsPostHousekeepingStatusResponse {
  success: boolean
  message?: string
}
