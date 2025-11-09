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
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')

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

  const startEditingName = (playerId: string, currentName: string) => {
    setEditingName(playerId)
    setEditNameValue(currentName)
  }

  const cancelEditingName = () => {
    setEditingName(null)
    setEditNameValue('')
  }

  const saveCustomName = async (playerId: string) => {
    setUpdating(prev => new Set(prev).add(playerId))

    const { error } = await supabase
      .from('players')
      .update({ custom_name: editNameValue.trim() || null })
      .eq('user_id', playerId)

    setUpdating(prev => {
      const newSet = new Set(prev)
      newSet.delete(playerId)
      return newSet
    })

    if (error) {
      console.error('Error updating name:', error)
      alert('Failed to update name')
      return
    }

    // Update local state
    setPlayers(prev => prev.map(p => 
      p.user_id === playerId ? { ...p, custom_name: editNameValue.trim() || null } : p
    ))
    
    setEditingName(null)
    setEditNameValue('')
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
                  <div className="space-y-3">
                    {/* Top Row: Name and Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          {editingName === player.user_id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                placeholder={player.display_name || 'Enter custom name...'}
                                className="px-3 py-1 rounded border border-slate-500 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                              />
                              <Button
                                onClick={() => saveCustomName(player.user_id)}
                                disabled={isUpdating}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={cancelEditingName}
                                size="sm"
                                variant="outline"
                                className="text-white border-slate-500 hover:bg-slate-600"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-white flex items-center gap-2">
                                {displayName}
                                {player.is_admin && (
                                  <Badge className="bg-yellow-600 text-white">ADMIN</Badge>
                                )}
                                {!player.plays_rematch && (
                                  <Badge className="bg-slate-600 text-white">View Only</Badge>
                                )}
                                <button
                                  onClick={() => startEditingName(player.user_id, player.custom_name || '')}
                                  className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                  ✏️ Edit Name
                                </button>
                              </div>
                              {player.custom_name && player.display_name && (
                                <div className="text-sm text-slate-400">
                                  Discord: {player.display_name}
                                </div>
                              )}
                              {!player.custom_name && player.display_name && (
                                <div className="text-sm text-slate-500">
                                  Using Discord name
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => togglePlaysRematch(player.user_id, player.plays_rematch)}
                        disabled={isUpdating}
                        size="sm"
                        className={player.plays_rematch ? 
                          "bg-green-600 hover:bg-green-700 text-white" : 
                          "bg-slate-600 hover:bg-slate-500 text-white border-slate-500"}
                      >
                        {isUpdating ? '...' : player.plays_rematch ? '✓ Plays Rematch' : '✕ View Only'}
                      </Button>

                      <Button
                        onClick={() => toggleIsAdmin(player.user_id, player.is_admin)}
                        disabled={isUpdating}
                        size="sm"
                        className={player.is_admin ? 
                          "bg-yellow-600 hover:bg-yellow-700 text-white" : 
                          "bg-slate-600 hover:bg-slate-500 text-white border-slate-500"}
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

