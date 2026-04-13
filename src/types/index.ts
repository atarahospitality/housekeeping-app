// ─────────────────────────────────────────────
//  Core domain types for the housekeeping app
// ─────────────────────────────────────────────

export type UserRole = 'admin' | 'housekeeper'

export interface AppUser {
  id: string
  email: string
  role: UserRole
  displayName: string
}

// Checkout status as reflected from Cloudbeds reservation status
export type CheckoutStatus =
  | 'not_checked_out' // Guest still in room
  | 'checked_out'     // Guest departed

// Housekeeping condition from Cloudbeds
export type RoomCondition = 'clean' | 'dirty'

// Combined room card data shown to housekeepers
export interface DepartureRoom {
  // Reservation info
  reservationId: string
  roomId: string
  roomNumber: string
  roomTypeName: string
  guestFirstName: string
  checkOutDate: string        // YYYY-MM-DD

  // Live state
  checkoutStatus: CheckoutStatus
  roomCondition: RoomCondition

  // Timestamps
  lastUpdated: string        // ISO string
}

// Audit log entry for housekeeping status changes
export interface AuditLogEntry {
  id: string
  userId: string
  roomId: string
  roomNumber: string
  fromCondition: RoomCondition
  toCondition: RoomCondition
  timestamp: string
}

// Branding / theme config stored in Supabase
export interface BrandingConfig {
  id: string
  propertyName: string
  logoUrl: string | null
  primaryColor: string       // hex e.g. "#1a56db"
  accentColor: string        // hex e.g. "#0e9f6e"
  updatedAt: string
}

// API response wrapper
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}
