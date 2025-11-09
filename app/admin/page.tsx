"use client"

import { useEffect, useState } from 'react'
import { supabase, Player } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<Player[]>([])
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkAdminAndLoadPlayers()
  }, [])

  const checkAdminAndLoadPlayers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Check if current user is admin
    const { data: playerData } = await supabase
      .from('players')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!playerData?.is_admin) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    setIsAdmin(true)
    await loadPlayers()
  }

  const loadPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('display_name')

    if (error) {
      console.error('Error loading players:', error)
      return
    }

    setPlayers(data || [])
    setLoading(false)
  }

  const togglePlaysRematch = async (playerId: string, currentValue: boolean) => {
    setUpdating(prev => new Set(prev).add(playerId))

    const { error } = await supabase
      .from('players')
      .update({ plays_rematch: !currentValue })
      .eq('user_id', playerId)

    setUpdating(prev => {
      const newSet = new Set(prev)
      newSet.delete(playerId)
      return newSet
    })

    if (error) {
      console.error('Error updating player:', error)
      alert('Failed to update player')
      return
    }

    // Update local state
    setPlayers(prev => prev.map(p => 
      p.user_id === playerId ? { ...p, plays_rematch: !currentValue } : p
    ))
  }

  const toggleIsAdmin = async (playerId: string, currentValue: boolean) => {
    if (!confirm(`Are you sure you want to ${currentValue ? 'demote' : 'promote'} this player ${currentValue ? 'from' : 'to'} admin?`)) {
      return
    }

    setUpdating(prev => new Set(prev).add(playerId))

    const { error } = await supabase
      .from('players')
      .update({ is_admin: !currentValue })
      .eq('user_id', playerId)

    setUpdating(prev => {
      const newSet = new Set(prev)
      newSet.delete(playerId)
      return newSet
    })

    if (error) {
      console.error('Error updating admin status:', error)
      alert('Failed to update admin status')
      return
    }

    // Update local state
    setPlayers(prev => prev.map(p => 
      p.user_id === playerId ? { ...p, is_admin: !currentValue } : p
    ))
  }

  const getDisplayName = (player: Player) => {
    return player.custom_name || player.display_name || 'Unknown'
  }

  if (loading) {
    return <div className="text-white text-center">Loading...</div>
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="py-12 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">🚫 Access Denied</h1>
            <p className="text-white">You do not have admin privileges.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">🛠️ Admin Panel</h1>
        <p className="text-white/70">
          Manage players and their settings
        </p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Players ({players.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {players.map(player => {
              const isUpdating = updating.has(player.user_id)
              const displayName = getDisplayName(player)

              return (
                <div 
                  key={player.user_id}
                  className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {displayName}
                          {player.is_admin && (
                            <Badge className="bg-yellow-600 text-white">ADMIN</Badge>
                          )}
                          {!player.plays_rematch && (
                            <Badge variant="secondary">View Only</Badge>
                          )}
                        </div>
                        {player.custom_name && player.display_name && (
                          <div className="text-sm text-muted-foreground">
                            Discord: {player.display_name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => togglePlaysRematch(player.user_id, player.plays_rematch)}
                        disabled={isUpdating}
                        size="sm"
                        variant={player.plays_rematch ? "default" : "outline"}
                        className={player.plays_rematch ? 
                          "bg-green-600 hover:bg-green-700 text-white" : 
                          "text-white border-white/20"}
                      >
                        {isUpdating ? '...' : player.plays_rematch ? '✓ Plays Rematch' : '✕ View Only'}
                      </Button>

                      <Button
                        onClick={() => toggleIsAdmin(player.user_id, player.is_admin)}
                        disabled={isUpdating}
                        size="sm"
                        variant={player.is_admin ? "default" : "outline"}
                        className={player.is_admin ? 
                          "bg-yellow-600 hover:bg-yellow-700 text-white" : 
                          "text-white border-white/20"}
                      >
                        {isUpdating ? '...' : player.is_admin ? '👑 Admin' : 'Make Admin'}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

