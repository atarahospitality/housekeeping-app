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

// A single reservation object from GET /getReservations
export interface CloudbedsReservation {
  reservationID: string
  roomID: string
  roomName: string          // room number/label
  roomTypeName: string
  guestName: string         // "FirstName LastName"
  status: CloudbedsReservationStatus
  checkInDate: string       // YYYY-MM-DD
  checkOutDate: string      // YYYY-MM-DD
  adults: number
  children: number
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
