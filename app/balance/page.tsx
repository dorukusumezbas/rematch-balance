"use client"

import { useEffect, useState } from 'react'
import { supabase, Player } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

  const loadPlayers = async () => {
    // Get all players with their ratings
    const { data: ratingsData, error } = await supabase
      .from('player_ratings')
      .select('*')
      .order('avg_score', { ascending: false })

    if (error) {
      console.error('Error loading players:', error)
      return
    }

    // Get full player data
    const { data: playersData } = await supabase
      .from('players')
      .select('*')

    const playersMap = new Map(playersData?.map(p => [p.user_id, p]) || [])

    const enrichedPlayers: PlayerWithScore[] = (ratingsData || []).map(r => ({
      ...playersMap.get(r.player_id)!,
      avg_score: typeof r.avg_score === 'number' ? r.avg_score : parseFloat(String(r.avg_score)),
      is_online: false
    }))

    setAllPlayers(enrichedPlayers)
    setAvailablePlayers(enrichedPlayers)
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
    // availablePlayers will auto-sync via useEffect
  }

  const getDisplayName = (player: Player) => {
    return player.custom_name || player.display_name || 'Unknown'
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Select Online Players ({onlineCount} online)</span>
            <Button onClick={resetAll} variant="outline" size="sm">
              Reset All
            </Button>
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
        <Card className="bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">
              Available Players ({availablePlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 min-h-[200px]">
              {availablePlayers.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No players available</p>
              ) : (
                availablePlayers.map(player => (
                  <div
                    key={player.user_id}
                    className="p-3 bg-slate-700 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        {getDisplayName(player)}
                      </span>
                      <Badge>{player.avg_score.toFixed(2)}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => moveToTeam1(player)}
                        size="sm" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        → Team 1
                      </Button>
                      <Button 
                        onClick={() => moveToTeam2(player)}
                        size="sm"
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        → Team 2
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team 1 */}
        <Card className="bg-blue-900/20 border-blue-500/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Team 1</span>
              <Badge className="bg-blue-600 text-white text-lg">
                {team1Total.toFixed(2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 min-h-[200px]">
              {team1.players.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Drop players here</p>
              ) : (
                team1.players.map(player => (
                  <div
                    key={player.user_id}
                    className="p-3 bg-blue-800/30 rounded-lg border border-blue-500/50"
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
                      <Button 
                        onClick={() => removeFromTeam1(player)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team 2 */}
        <Card className="bg-orange-900/20 border-orange-500/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Team 2</span>
              <Badge className="bg-orange-600 text-white text-lg">
                {team2Total.toFixed(2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 min-h-[200px]">
              {team2.players.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Drop players here</p>
              ) : (
                team2.players.map(player => (
                  <div
                    key={player.user_id}
                    className="p-3 bg-orange-800/30 rounded-lg border border-orange-500/50"
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
                      <Button 
                        onClick={() => removeFromTeam2(player)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Stats and Actions */}
      <Card className="bg-slate-800/50">
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
            <Button 
              onClick={balanceTeams}
              disabled={availablePlayers.length === 0}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              ⚖️ Balance Teams
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

