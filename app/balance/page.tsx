"use client"

import { useEffect, useState } from 'react'
import { supabase, Player } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppButton } from '@/components/AppButton'
import { Badge } from '@/components/ui/badge'

type PlayerWithScore = Player & {
  avg_score: number
  is_online: boolean
}

type Team = {
  players: PlayerWithScore[]
}

export default function BalancePage() {
  const [allPlayers, setAllPlayers] = useState<PlayerWithScore[]>([])
  const [team1, setTeam1] = useState<Team>({ players: [] })
  const [team2, setTeam2] = useState<Team>({ players: [] })
  const [availablePlayers, setAvailablePlayers] = useState<PlayerWithScore[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedPlayer, setDraggedPlayer] = useState<PlayerWithScore | null>(null)
  const [dragSource, setDragSource] = useState<'available' | 'team1' | 'team2' | null>(null)

  useEffect(() => {
    loadPlayers()
  }, [])

  // Auto-sync available players when allPlayers, team1, or team2 changes
  useEffect(() => {
    const assignedIds = new Set([
      ...team1.players.map(p => p.user_id),
      ...team2.players.map(p => p.user_id)
    ])
    
    setAvailablePlayers(
      allPlayers.filter(p => p.is_online && !assignedIds.has(p.user_id))
    )
  }, [allPlayers, team1.players, team2.players])

  // Save online players to session storage whenever allPlayers changes
  useEffect(() => {
    if (allPlayers.length > 0) {
      const onlinePlayerIds = allPlayers.filter(p => p.is_online).map(p => p.user_id)
      sessionStorage.setItem('balancer-online-players', JSON.stringify(onlinePlayerIds))
    }
  }, [allPlayers])

  const loadPlayers = async () => {
    // Get all players with their ratings (only rematch players)
    const { data: ratingsData, error } = await supabase
      .from('player_ratings')
      .select('*')
      .eq('plays_rematch', true)
      .order('avg_score', { ascending: false })

    if (error) {
      console.error('Error loading players:', error)
      return
    }

    // Get full player data (only rematch players)
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('plays_rematch', true)

    const playersMap = new Map(playersData?.map(p => [p.user_id, p]) || [])

    // Check session storage for previously selected online players
    let savedOnlinePlayerIds: string[] = []
    try {
      const saved = sessionStorage.getItem('balancer-online-players')
      if (saved) {
        savedOnlinePlayerIds = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Error loading online players from session storage:', e)
    }

    const enrichedPlayers: PlayerWithScore[] = (ratingsData || []).map(r => ({
      ...playersMap.get(r.player_id)!,
      avg_score: typeof r.avg_score === 'number' ? r.avg_score : parseFloat(String(r.avg_score)),
      // If we have saved data, use it; otherwise start all players as online
      is_online: savedOnlinePlayerIds.length > 0 
        ? savedOnlinePlayerIds.includes(r.player_id)
        : true
    }))

    setAllPlayers(enrichedPlayers)
    // Don't set availablePlayers here - let useEffect handle it
    setLoading(false)
  }

  const toggleOnline = (playerId: string) => {
    setAllPlayers(prev => prev.map(p => 
      p.user_id === playerId ? { ...p, is_online: !p.is_online } : p
    ))
  }

  const moveToTeam1 = (player: PlayerWithScore) => {
    setTeam1(prev => ({ players: [...prev.players, player] }))
  }

  const moveToTeam2 = (player: PlayerWithScore) => {
    setTeam2(prev => ({ players: [...prev.players, player] }))
  }

  const removeFromTeam1 = (player: PlayerWithScore) => {
    setTeam1(prev => ({ players: prev.players.filter(p => p.user_id !== player.user_id) }))
  }

  const removeFromTeam2 = (player: PlayerWithScore) => {
    setTeam2(prev => ({ players: prev.players.filter(p => p.user_id !== player.user_id) }))
  }

  const calculateTeamTotal = (team: Team): number => {
    return team.players.reduce((sum, p) => sum + p.avg_score, 0)
  }

  const balanceTeams = () => {
    const onlinePlayers = allPlayers.filter(p => p.is_online)
    const preAssigned1 = team1.players
    const preAssigned2 = team2.players
    const unassigned = availablePlayers

    if (unassigned.length === 0) {
      alert('No players to balance! All players are already assigned.')
      return
    }

    // Calculate how many players each team needs
    const totalPlayers = onlinePlayers.length
    const teamSize = Math.floor(totalPlayers / 2)
    const needTeam1 = teamSize - preAssigned1.length
    const needTeam2 = totalPlayers - teamSize - preAssigned2.length

    if (needTeam1 < 0 || needTeam2 < 0) {
      alert('Teams are overfilled! Remove some players first.')
      return
    }

    if (needTeam1 + needTeam2 !== unassigned.length) {
      alert(`Math error: need ${needTeam1 + needTeam2} players but have ${unassigned.length} available`)
      return
    }

    // Use greedy algorithm to balance
    const result = greedyBalance(unassigned, needTeam1, needTeam2, 
      calculateTeamTotal(team1), calculateTeamTotal(team2))

    setTeam1({ players: [...preAssigned1, ...result.team1] })
    setTeam2({ players: [...preAssigned2, ...result.team2] })
    setAvailablePlayers([])
  }

  const greedyBalance = (
    players: PlayerWithScore[], 
    need1: number, 
    need2: number,
    currentTotal1: number,
    currentTotal2: number
  ) => {
    // Sort players by score descending
    const sorted = [...players].sort((a, b) => b.avg_score - a.avg_score)
    const team1: PlayerWithScore[] = []
    const team2: PlayerWithScore[] = []
    let total1 = currentTotal1
    let total2 = currentTotal2

    for (const player of sorted) {
      if (team1.length < need1 && team2.length < need2) {
        // Both teams need players, add to weaker team
        if (total1 <= total2) {
          team1.push(player)
          total1 += player.avg_score
        } else {
          team2.push(player)
          total2 += player.avg_score
        }
      } else if (team1.length < need1) {
        team1.push(player)
        total1 += player.avg_score
      } else if (team2.length < need2) {
        team2.push(player)
        total2 += player.avg_score
      }
    }

    return { team1, team2 }
  }

  const resetAll = () => {
    setTeam1({ players: [] })
    setTeam2({ players: [] })
    setAllPlayers(prev => prev.map(p => ({ ...p, is_online: false })))
    // availablePlayers will auto-sync via useEffect
  }

  const resetTeams = () => {
    setTeam1({ players: [] })
    setTeam2({ players: [] })
  }

  const getDisplayName = (player: Player) => {
    return player.custom_name || player.display_name || 'Unknown'
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, player: PlayerWithScore, source: 'available' | 'team1' | 'team2') => {
    e.stopPropagation()
    setDraggedPlayer(player)
    setDragSource(source)
    // Set drag effect
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation()
    setDraggedPlayer(null)
    setDragSource(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDropToAvailable = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedPlayer || dragSource === 'available') return

    if (dragSource === 'team1') {
      removeFromTeam1(draggedPlayer)
    } else if (dragSource === 'team2') {
      removeFromTeam2(draggedPlayer)
    }
    setDraggedPlayer(null)
    setDragSource(null)
  }

  const handleDropToTeam1 = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedPlayer || dragSource === 'team1') return

    if (dragSource === 'available') {
      moveToTeam1(draggedPlayer)
    } else if (dragSource === 'team2') {
      removeFromTeam2(draggedPlayer)
      moveToTeam1(draggedPlayer)
    }
    setDraggedPlayer(null)
    setDragSource(null)
  }

  const handleDropToTeam2 = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedPlayer || dragSource === 'team2') return

    if (dragSource === 'available') {
      moveToTeam2(draggedPlayer)
    } else if (dragSource === 'team1') {
      removeFromTeam1(draggedPlayer)
      moveToTeam2(draggedPlayer)
    }
    setDraggedPlayer(null)
    setDragSource(null)
  }

  const onlineCount = allPlayers.filter(p => p.is_online).length
  const team1Total = calculateTeamTotal(team1)
  const team2Total = calculateTeamTotal(team2)
  const difference = Math.abs(team1Total - team2Total)

  if (loading) {
    return <div className="text-white text-center">Loading players...</div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">⚖️ Team Balancer</h1>
        <p className="text-white/70">
          Select online players, drag to teams, and balance!
        </p>
      </div>

      {/* Online Player Selection */}
      <Card className="mb-6 bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Select Online Players ({onlineCount} online)</span>
            <AppButton onClick={resetAll} variant="ghost" size="sm">
              Reset All
            </AppButton>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allPlayers.map(player => (
              <div
                key={player.user_id}
                onClick={() => toggleOnline(player.user_id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  player.is_online 
                    ? 'border-green-500 bg-green-500/20' 
                    : 'border-slate-600 bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium truncate">
                    {getDisplayName(player)}
                  </span>
                  <Badge variant={player.is_online ? "default" : "secondary"} className="ml-2">
                    {player.avg_score.toFixed(2)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Teams and Available Pool */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Available Players */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Available Players ({availablePlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="space-y-2 min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={handleDropToAvailable}
            >
              {availablePlayers.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No players available</p>
              ) : (
                availablePlayers.map(player => (
                  <div
                    key={player.user_id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, player, 'available')}
                    onDragEnd={handleDragEnd}
                    className="p-3 bg-slate-700 rounded-lg border border-slate-600 cursor-move hover:bg-slate-600 transition-colors select-none"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        {getDisplayName(player)}
                      </span>
                      <Badge>{player.avg_score.toFixed(2)}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <AppButton 
                        onClick={() => moveToTeam1(player)}
                        size="sm" 
                        className="flex-1"
                        variant="primary"
                      >
                        → Team 1
                      </AppButton>
                      <AppButton 
                        onClick={() => moveToTeam2(player)}
                        size="sm"
                        className="flex-1"
                        variant="warning"
                      >
                        → Team 2
                      </AppButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team 1 */}
        <Card className="bg-slate-800/80 border-blue-500/50">
          <CardHeader className="bg-blue-900/30">
            <CardTitle className="text-white flex items-center justify-between">
              <span>Team 1</span>
              <Badge className="bg-blue-600 text-white text-lg">
                {team1Total.toFixed(2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="space-y-2 min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={handleDropToTeam1}
            >
              {team1.players.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Drop players here</p>
              ) : (
                team1.players.map(player => (
                  <div
                    key={player.user_id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, player, 'team1')}
                    onDragEnd={handleDragEnd}
                    className="p-3 bg-blue-800/30 rounded-lg border border-blue-500/50 cursor-move hover:bg-blue-800/50 transition-colors select-none"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">
                          {getDisplayName(player)}
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          {player.avg_score.toFixed(2)}
                        </Badge>
                      </div>
                      <AppButton 
                        onClick={() => removeFromTeam1(player)}
                        variant="danger"
                        size="sm"
                      >
                        ✕
                      </AppButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team 2 */}
        <Card className="bg-slate-800/80 border-orange-500/50">
          <CardHeader className="bg-orange-900/30">
            <CardTitle className="text-white flex items-center justify-between">
              <span>Team 2</span>
              <Badge className="bg-orange-600 text-white text-lg">
                {team2Total.toFixed(2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="space-y-2 min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={handleDropToTeam2}
            >
              {team2.players.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Drop players here</p>
              ) : (
                team2.players.map(player => (
                  <div
                    key={player.user_id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, player, 'team2')}
                    onDragEnd={handleDragEnd}
                    className="p-3 bg-orange-800/30 rounded-lg border border-orange-500/50 cursor-move hover:bg-orange-800/50 transition-colors select-none"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">
                          {getDisplayName(player)}
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          {player.avg_score.toFixed(2)}
                        </Badge>
                      </div>
                      <AppButton 
                        onClick={() => removeFromTeam2(player)}
                        variant="danger"
                        size="sm"
                      >
                        ✕
                      </AppButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Stats and Actions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-slate-400">Team Balance</div>
                <div className="text-2xl font-bold text-white">
                  {difference.toFixed(2)} point difference
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Players</div>
                <div className="text-2xl font-bold text-white">
                  {team1.players.length}v{team2.players.length}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <AppButton 
                onClick={resetTeams}
                disabled={team1.players.length === 0 && team2.players.length === 0}
                size="lg"
                variant="ghost"
              >
                🔄 Reset Teams
              </AppButton>
              <AppButton 
                onClick={balanceTeams}
                disabled={availablePlayers.length === 0}
                size="lg"
                variant="success"
                className="font-bold"
              >
                ⚖️ Balance Teams
              </AppButton>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

