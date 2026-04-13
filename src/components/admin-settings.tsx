'use client'

import { useState } from 'react'
import { Settings, Users, Palette, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import type { BrandingConfig } from '@/types'

interface UserRow {
  id: string
  email: string
  role: string
  display_name: string
  created_at: string
}

interface AdminSettingsProps {
  branding: BrandingConfig | null
  users: UserRow[]
}

export function AdminSettings({ branding, users }: AdminSettingsProps) {
  const { showToast } = useToast()

  const [propertyName, setPropertyName] = useState(branding?.propertyName ?? '')
  const [primaryColor, setPrimaryColor] = useState(branding?.primaryColor ?? '#1a56db')
  const [accentColor, setAccentColor] = useState(branding?.accentColor ?? '#0e9f6e')
  const [isSavingBranding, setIsSavingBranding] = useState(false)

  const [userRoles, setUserRoles] = useState<Record<string, string>>(
    Object.fromEntries(users.map((u) => [u.id, u.role]))
  )
  const [isSavingRoles, setIsSavingRoles] = useState(false)

  async function saveBranding() {
    setIsSavingBranding(true)
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyName, primaryColor, accentColor }),
      })
      if (res.ok) {
        showToast('Branding saved', 'success')
        // Update CSS variables live
        document.documentElement.style.setProperty('--brand-primary', primaryColor)
        document.documentElement.style.setProperty('--brand-accent', accentColor)
      } else {
        showToast('Failed to save branding', 'error')
      }
    } catch {
      showToast('Connection error', 'error')
    } finally {
      setIsSavingBranding(false)
    }
  }

  async function saveRoles() {
    setIsSavingRoles(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRoles }),
      })
      if (res.ok) {
        showToast('Roles updated', 'success')
      } else {
        showToast('Failed to update roles', 'error')
      }
    } catch {
      showToast('Connection error', 'error')
    } finally {
      setIsSavingRoles(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-400" />
          Admin Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage branding and team access
        </p>
      </div>

      {/* Branding section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Palette className="h-4 w-4 text-gray-400" />
          Branding
        </h2>

        <div className="space-y-2">
          <Label>Property Name</Label>
          <Input
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder="Grand Hotel"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-12 w-12 rounded-xl border border-gray-200 cursor-pointer p-1"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Accent Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-12 w-12 rounded-xl border border-gray-200 cursor-pointer p-1"
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-xl p-3 border border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Preview</p>
          <div className="flex gap-2">
            <div
              className="h-8 px-4 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
              style={{ backgroundColor: primaryColor }}
            >
              Primary
            </div>
            <div
              className="h-8 px-4 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
              style={{ backgroundColor: accentColor }}
            >
              Accent
            </div>
          </div>
        </div>

        <Button onClick={saveBranding} disabled={isSavingBranding} className="w-full">
          {isSavingBranding ? 'Saving…' : 'Save Branding'}
        </Button>
      </section>

      {/* Cloudbeds connection status */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <Wifi className="h-4 w-4 text-gray-400" />
          Cloudbeds Connection
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-gray-700">
            Connected to Property ID:{' '}
            <span className="font-mono font-medium">
              {process.env.NEXT_PUBLIC_PROPERTY_ID_DISPLAY ?? '(configured)'}
            </span>
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          API key and property ID are configured via environment variables.
        </p>
      </section>

      {/* Team / roles section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          Team Members
        </h2>

        {users.length === 0 ? (
          <p className="text-sm text-gray-500">No users found.</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {u.display_name || u.email}
                  </p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <select
                  value={userRoles[u.id] ?? u.role}
                  onChange={(e) =>
                    setUserRoles((prev) => ({ ...prev, [u.id]: e.target.value }))
                  }
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                >
                  <option value="housekeeper">Housekeeper</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        )}

        <Button onClick={saveRoles} disabled={isSavingRoles} variant="outline" className="w-full">
          {isSavingRoles ? 'Saving…' : 'Save Role Changes'}
        </Button>
      </section>
    </div>
  )
}
