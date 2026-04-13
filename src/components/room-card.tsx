'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, Loader2, RotateCcw, BedDouble, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import type { DepartureRoom } from '@/types'

interface RoomCardProps {
  room: DepartureRoom
  onConditionChange: (roomId: string, condition: 'clean' | 'dirty') => void
}

export function RoomCard({ room, onConditionChange }: RoomCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const { showToast } = useToast()

  const isCheckedOut = room.checkoutStatus === 'checked_out'
  const isClean = room.roomCondition === 'clean'

  async function handleToggle() {
    const newCondition = isClean ? 'dirty' : 'clean'
    setIsUpdating(true)

    // Optimistic update
    onConditionChange(room.roomId, newCondition)

    try {
      const res = await fetch('/api/cloudbeds/update-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.roomId,
          condition: newCondition,
          roomNumber: room.roomNumber,
          fromCondition: room.roomCondition,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        // Roll back optimistic update
        onConditionChange(room.roomId, isClean ? 'clean' : 'dirty')
        showToast(data.error ?? 'Could not update room. Try again.', 'error')
      } else {
        showToast(
          newCondition === 'clean'
            ? `Room ${room.roomNumber} marked clean ✓`
            : `Room ${room.roomNumber} marked dirty`,
          'success'
        )
      }
    } catch {
      // Roll back on network error
      onConditionChange(room.roomId, isClean ? 'clean' : 'dirty')
      showToast('Connection error. Please try again.', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl border-2 bg-white shadow-sm transition-all',
        isClean
          ? 'border-emerald-200'
          : isCheckedOut
          ? 'border-amber-300'
          : 'border-gray-200',
        !isCheckedOut && 'opacity-90'
      )}
    >
      {/* Top color bar indicates checkout state */}
      <div
        className={cn(
          'h-1.5 w-full rounded-t-2xl',
          isCheckedOut ? 'bg-blue-500' : 'bg-gray-300'
        )}
      />

      <div className="p-4">
        {/* Header: Room number + status badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <span className="text-3xl font-black text-gray-900 leading-none">
              {room.roomNumber}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {/* Checkout status badge */}
            <Badge variant={isCheckedOut ? 'checked-out' : 'not-checked-out'}>
              {isCheckedOut ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Checked Out
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  Still In Room
                </>
              )}
            </Badge>
            {/* Room condition badge */}
            <Badge variant={isClean ? 'clean' : 'dirty'}>
              {isClean ? '✓ Clean' : '● Dirty'}
            </Badge>
          </div>
        </div>

        {/* Room info row */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" />
            {room.roomTypeName}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {room.guestFirstName}
          </span>
        </div>

        {/* Action button */}
        <Button
          onClick={handleToggle}
          disabled={isUpdating}
          variant={isClean ? 'outline' : 'clean'}
          size="lg"
          className="w-full"
          aria-label={
            isClean
              ? `Mark room ${room.roomNumber} dirty`
              : `Mark room ${room.roomNumber} clean`
          }
        >
          {isUpdating ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : isClean ? (
            <RotateCcw className="h-5 w-5 mr-2" />
          ) : (
            <CheckCircle2 className="h-5 w-5 mr-2" />
          )}
          {isUpdating ? 'Updating…' : isClean ? 'Mark Dirty' : 'Mark Clean'}
        </Button>

        {/* Subtle "not checked out" warning */}
        {!isCheckedOut && !isClean && (
          <p className="mt-2.5 text-center text-xs text-amber-600 font-medium">
            Guest hasn't checked out yet
          </p>
        )}
      </div>
    </div>
  )
}
