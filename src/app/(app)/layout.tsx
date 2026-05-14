import { AppHeader } from '@/components/app-header'

// Auth disabled — app is open without login.
// Login page + Supabase auth code preserved at src/app/(auth)/login/ if needed later.

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader role="housekeeper" displayName="Staff" />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
