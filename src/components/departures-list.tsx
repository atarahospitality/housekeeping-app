'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, BedDouble } from 'lucide-react'
import { RoomCard } from '@/components/room-card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { DepartureRoom, RoomCondition } from '@/types'

const POLL_INTERVAL_MS = 30_000 // 30 seconds

interface DeparturesListProps {
  date: string // YYYY-MM-DD
}

export function DeparturesList({ date }: DeparturesListProps) {
  const [rooms, setRooms] = useState<DepartureRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchDepartures = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)
    setError(null)

    try {
      const res = await fetch(`/api/cloudbeds/departures?date=${date}`, {
        cache: 'no-store',
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error ?? 'Failed to load rooms')
      } else {
        setRooms(json.data ?? [])
        setLastUpdated(new Date())
      }
    } catch {
      setError('Connection error. Check your network and try again.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [date])

  // Reset + reload when date changes
  useEffect(() => {
    setRooms([])
    setLastUpdated(null)
    fetchDepartures()
  }, [fetchDepartures])

  // 30-second polling
  useEffect(() => {
    const interval = setInterval(() => fetchDepartures(true), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchDepartures])

  // Optimistic condition update — used by RoomCard
  const handleConditionChange = useCallback(
    (roomId: string, condition: RoomCondition) => {
      setRooms((prev) =>
        prev.map((r) =>
          r.roomId === roomId ? { ...r, roomCondition: condition } : r
        )
      )
    },
    []
  )

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-44 rounded-2xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-gray-700 font-medium mb-1">{error}</p>
        <p className="text-gray-500 text-sm mb-6">
          Cloudbeds may be unavailable. Try refreshing.
        </p>
        <Button onClick={() => fetchDepartures()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (rooms.length === 0) {
    return (
      <div className="text-center py-16">
        <BedDouble className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 font-medium text-lg">No departures today</p>
        <p className="text-gray-400 text-sm mt-1">
          All clear for {formatDate(date)}
        </p>
      </div>
    )
  }

  // ── Room groups ───────────────────────────────────────────────────────────
  const checkedOut = rooms.filter((r) => r.checkoutStatus === 'checked_out')
  const notYet = rooms.filter((r) => r.checkoutStatus === 'not_checked_out')
  const notArrived = rooms.filter((r) => r.checkoutStatus === 'not_arrived')

  return (
    <div>
      {/* Last updated + refresh */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Loading…'}
        </p>
        <button
          onClick={() => fetchDepartures(true)}
          disabled={isRefreshing}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          aria-label="Refresh"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Checked-out rooms — ready to clean */}
      {checkedOut.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3 px-1">
            Ready to Clean ({checkedOut.length})
          </h2>
          <div className="space-y-3">
            {checkedOut.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                onConditionChange={handleConditionChange}
              />
            ))}
          </div>
        </section>
      )}

      {/* Still in room */}
      {notYet.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
            Still Occupied ({notYet.length})
          </h2>
          <div className="space-y-3">
            {notYet.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                onConditionChange={handleConditionChange}
              />
            ))}
          </div>
        </section>
      )}

      {/* Future reservations — guest not yet arrived */}
      {notArrived.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1">
            Expected Departures ({notArrived.length})
          </h2>
          <div className="space-y-3">
            {notArrived.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                onConditionChange={handleConditionChange}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
