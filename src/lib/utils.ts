import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format YYYY-MM-DD as human-readable: "Mon Apr 13" */
export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

/** Get today's date as YYYY-MM-DD in local time */
export function todayYMD(): string {
  return offsetYMD(0)
}

/** Get a date offset from today as YYYY-MM-DD in local time */
export function offsetYMD(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Sleep helper for retry logic */
export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

/** Simple retry wrapper */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err as Error
      if (i < retries - 1) await sleep(delayMs * Math.pow(2, i))
    }
  }
  throw lastError
}
