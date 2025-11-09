"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppButton } from '@/components/AppButton'

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [customName, setCustomName] = useState('')
  const [discordName, setDiscordName] = useState('')
  const [playsRematch, setPlaysRematch] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setCurrentUser(user)

    // Get player data
    const { data: playerData, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error loading profile:', error)
      return
    }

    setDiscordName(playerData.display_name || user.user_metadata.full_name || 'Unknown')
    setCustomName(playerData.custom_name || '')
    setPlaysRematch(playerData.plays_rematch !== false)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!currentUser) return

    setSaving(true)
    setSuccessMessage('')

    const { error } = await supabase
      .from('players')
      .update({ 
        custom_name: customName.trim() || null,
        plays_rematch: playsRematch
      })
      .eq('user_id', currentUser.id)

    setSaving(false)

    if (error) {
      console.error('Error updating profile:', error)
      alert('Error saving profile. Please try again.')
      return
    }

    setSuccessMessage('✓ Profile saved successfully!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  if (loading) {
    return <div className="text-white text-center">Loading profile...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Profile Settings</h1>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Your Profile</CardTitle>
          <CardDescription>
            Update your display name and rematch status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Discord Name (read-only) */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Discord Name
            </label>
            <div className="px-4 py-2.5 bg-slate-700/50 rounded-md text-slate-300 border border-slate-600">
              {discordName}
            </div>
          </div>

          {/* Custom Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Custom Display Name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Leave empty to use Discord name"
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-md border border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Rematch Status Toggle */}
          <div className="pt-4 border-t border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white mb-1">Active Rematch Player</p>
                <p className="text-sm text-slate-400">
                  {playsRematch ? 
                    'Visible in scoreboard, voting, and balancer' : 
                    'Hidden from active lists (view-only)'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={playsRematch}
                  onChange={(e) => setPlaysRematch(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <AppButton 
              onClick={handleSave} 
              disabled={saving}
              size="lg"
              variant="primary"
              fullWidth
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </AppButton>
            {successMessage && (
              <p className="text-green-400 text-sm mt-3 text-center font-medium">{successMessage}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
