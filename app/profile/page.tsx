"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [customName, setCustomName] = useState('')
  const [discordName, setDiscordName] = useState('')
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
    setLoading(false)
  }

  const handleSave = async () => {
    if (!currentUser) return

    setSaving(true)
    setSuccessMessage('')

    const { error } = await supabase
      .from('players')
      .update({ custom_name: customName.trim() || null })
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Currently showing as:</p>
                <p className="text-2xl font-bold text-primary mt-1">{displayName}</p>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                size="lg"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            {successMessage && (
              <p className="text-green-500 text-sm mt-2">{successMessage}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Your custom name will appear on the scoreboard, 
            rating page, and anywhere your profile is shown. Choose something memorable!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

