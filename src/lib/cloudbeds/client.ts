// ─────────────────────────────────────────────
//  Cloudbeds API client — server-side only
//  Never import this in client components.
// ─────────────────────────────────────────────

import type {
  CloudbedsGetReservationsResponse,
  CloudbedsGetHousekeepingStatusResponse,
  CloudbedsGetReservationAssignmentsResponse,
  CloudbedsPostHousekeepingStatusRequest,
  CloudbedsPostHousekeepingStatusResponse,
  CloudbedsTokenResponse,
} from './types'

const BASE_URL = 'https://hotels.cloudbeds.com/api/v1.2'

// ── Token management ──────────────────────────────────────────────────────────
// We cache the token in module scope per serverless instance.
// Tokens are valid for 3600s; we refresh 5 min early.
let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const clientId = process.env.CLOUDBEDS_CLIENT_ID
  const clientSecret = process.env.CLOUDBEDS_CLIENT_SECRET

  // Some Cloudbeds setups use a direct API key instead of OAuth.
  // If CLOUDBEDS_API_KEY is set, use it directly as Bearer.
  const apiKey = process.env.CLOUDBEDS_API_KEY
  if (apiKey) {
    cachedToken = apiKey
    tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000 // treat as long-lived
    return apiKey
  }

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing Cloudbeds credentials. Set CLOUDBEDS_CLIENT_ID + CLOUDBEDS_CLIENT_SECRET or CLOUDBEDS_API_KEY.'
    )
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch(`${BASE_URL}/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cloudbeds token exchange failed (${res.status}): ${text}`)
  }

  const json: CloudbedsTokenResponse = await res.json()
  cachedToken = json.access_token
  // Expire 5 minutes early
  tokenExpiresAt = Date.now() + (json.expires_in - 300) * 1000
  return cachedToken!
}

// ── Generic fetch helper ──────────────────────────────────────────────────────
async function cloudbedsFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken()
  const propertyId = process.env.CLOUDBEDS_PROPERTY_ID

  if (!propertyId) {
    throw new Error('Missing CLOUDBEDS_PROPERTY_ID environment variable.')
  }

  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // Respect Next.js fetch cache — callers override if needed
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cloudbeds API error ${res.status} at ${path}: ${text}`)
  }

  return res.json() as Promise<T>
}

// ── Public API methods ────────────────────────────────────────────────────────

/**
 * Get all reservations checking out on a given date.
 * Uses GET /getReservations with checkOutFrom/checkOutTo filters.
 *
 * Status filter differs by date:
 *  - Today: checked_in (still in room) + checked_out (already left)
 *  - Future: confirmed + not_confirmed (not arrived yet) + checked_in (early check-in)
 */
export async function getReservationsForDate(
  date: string // YYYY-MM-DD
): Promise<CloudbedsGetReservationsResponse> {
  const propertyId = process.env.CLOUDBEDS_PROPERTY_ID!

  const today = new Date().toISOString().slice(0, 10)
  const isFuture = date > today

  const status = isFuture
    ? 'confirmed,not_confirmed,checked_in'  // guest may not have arrived yet
    : 'checked_in,checked_out'              // today: in-room or already gone

  const params = new URLSearchParams({
    propertyID: propertyId,
    checkOutFrom: date,
    checkOutTo: date,
    status,
    pageSize: '200',
    pageNumber: '1',
  })

  return cloudbedsFetch<CloudbedsGetReservationsResponse>(
    `/getReservations?${params.toString()}`,
    { next: { revalidate: 30 } }
  )
}

/**
 * Get current housekeeping status for all rooms.
 * Uses GET /getHousekeepingStatus.
 */
export async function getHousekeepingStatus(): Promise<CloudbedsGetHousekeepingStatusResponse> {
  const propertyId = process.env.CLOUDBEDS_PROPERTY_ID!
  const params = new URLSearchParams({ propertyID: propertyId })

  return cloudbedsFetch<CloudbedsGetHousekeepingStatusResponse>(
    `/getHousekeepingStatus?${params.toString()}`,
    { cache: 'no-store' } // always fresh for status checks
  )
}

/**
 * Get room assignments for a given date.
 * Uses GET /getReservationAssignments?date=YYYY-MM-DD
 * Returns a mapping of reservationID → roomID/roomName for that day.
 */
export async function getReservationAssignments(
  date: string // YYYY-MM-DD
): Promise<CloudbedsGetReservationAssignmentsResponse> {
  const propertyId = process.env.CLOUDBEDS_PROPERTY_ID!
  const params = new URLSearchParams({
    propertyID: propertyId,
    date,
  })

  return cloudbedsFetch<CloudbedsGetReservationAssignmentsResponse>(
    `/getReservationAssignments?${params.toString()}`,
    { next: { revalidate: 30 } }
  )
}

/**
 * Update a room's housekeeping condition.
 * Uses POST /postHousekeepingStatus.
 * Send condition: 'clean' to mark clean, 'dirty' to undo.
 */
export async function updateRoomCondition(
  roomId: string,
  condition: 'clean' | 'dirty'
): Promise<CloudbedsPostHousekeepingStatusResponse> {
  const propertyId = process.env.CLOUDBEDS_PROPERTY_ID!

  // Cloudbeds POST endpoints expect form-encoded bodies, not JSON
  const body = new URLSearchParams({
    propertyID: propertyId,
    roomID: roomId,
    condition,
  })

  return cloudbedsFetch<CloudbedsPostHousekeepingStatusResponse>(
    '/postHousekeepingStatus',
    {
      method: 'POST',
      body: body.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      cache: 'no-store',
    }
  )
}
