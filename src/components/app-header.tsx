'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Settings, LogOut, BedDouble } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'

interface AppHeaderProps {
  role: UserRole
  displayName: string
}

export function AppHeader({ role, displayName }: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        {/* Logo / App name */}
        <Link href="/departures" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--brand-primary, #1a56db)' }}
          >
            <BedDouble className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">Housekeeping</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {role === 'admin' && (
            <Link
              href="/admin"
              className={`p-2.5 rounded-xl transition-colors ${
                pathname === '/admin'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
              }`}
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
