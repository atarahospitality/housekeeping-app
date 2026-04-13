import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSettings } from '@/components/admin-settings'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only admins can access this page
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/departures')

  // Fetch current branding
  const { data: branding } = await supabase
    .from('branding_config')
    .select('*')
    .single()

  // Fetch all users for role management
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, email, role, display_name, created_at')
    .order('created_at', { ascending: true })

  return (
    <AdminSettings
      branding={branding}
      users={users ?? []}
    />
  )
}
