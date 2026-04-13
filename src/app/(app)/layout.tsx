import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user role from profiles table
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'housekeeper'
  const displayName = profile?.display_name ?? user.email ?? 'Staff'

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader role={role} displayName={displayName} />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
