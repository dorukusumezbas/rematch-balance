"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
    setPlaysRematch(playerData.plays_rematch !== false) // Default to true if not set
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
      console.error('Error updating name:', error)
      alert('Error saving name. Please try again.')
      return
    }

    setSuccessMessage('✓ Name saved successfully!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  if (loading) {
    return <div className="text-white text-center">Loading profile...</div>
  }

  const displayName = customName || discordName

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Profile Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>
            Choose how other players see your name in the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Discord Name (from your account)
            </label>
            <div className="px-4 py-2 bg-muted rounded-md text-muted-foreground">
              {discordName}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Custom Display Name (optional)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter your preferred name..."
              maxLength={50}
              className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use your Discord name
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-white">Currently showing as:</p>
            <p className="text-2xl font-bold text-primary mt-1">{displayName}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle>Rematch Player Status</CardTitle>
          <CardDescription>
            Toggle whether you actively play rematch games
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">I play rematch games</p>
              <p className="text-sm text-muted-foreground mt-1">
                {playsRematch ? 
                  'You will appear in scoreboard, balancer, and voting pages' : 
                  'You will be hidden from active player lists (view-only access)'}
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
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20 mb-6">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Your custom name will appear on the scoreboard, 
            rating page, and anywhere your profile is shown. Choose something memorable!
          </p>
        </CardContent>
      </Card>

      {/* Save Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-lg mb-1">Ready to save your changes?</p>
              <p className="text-sm text-slate-400">
                This will update your display name and rematch player status
              </p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
          {successMessage && (
            <p className="text-green-400 text-sm mt-4 text-center font-medium">{successMessage}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

