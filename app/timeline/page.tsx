"use client"

import { useEffect, useState } from 'react'
import { supabase, Player, VoteHistory } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppButton } from '@/components/AppButton'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type TimeRange = '1d' | '1w' | '1m' | '3m'

type TimelineDataPoint = {
  date: string
  timestamp: number
  [playerId: string]: number | string // player scores at this timestamp
}

type PlayerStats = {
  current: number
  peak: number
  low: number
  trend: 'up' | 'down' | 'stable'
}

const PLAYER_COLORS = [
  '#3b82f6', // blue
  '#f97316', // orange  
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#14b8a6', // teal
  '#ef4444', // red
]

export default function TimelinePage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [timeRange, setTimeRange] = useState<TimeRange>('1m')
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([])
  const [playerStats, setPlayerStats] = useState<Map<string, PlayerStats>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlayers()
  }, [])

  useEffect(() => {
    if (selectedPlayers.size > 0) {
      loadTimelineData()
    } else {
      setTimelineData([])
    }
  }, [selectedPlayers, timeRange])

  const loadPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('plays_rematch', true)
      .order('display_name')

    if (error) {
      console.error('Error loading players:', error)
      return
    }

    setPlayers(data || [])
    setLoading(false)
  }

  const getTimeRangeDate = (range: TimeRange): Date => {
    const now = new Date()
    switch (range) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '1w':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '1m':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case '3m':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    }
  }

  const loadTimelineData = async () => {
    const startDate = getTimeRangeDate(timeRange)
    const playerIds = Array.from(selectedPlayers)

    // Fetch current votes for baseline
    const { data: currentVotes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .in('target_id', playerIds)

    if (votesError) {
      console.error('Error loading current votes:', votesError)
      return
    }

    // Fetch vote history for selected players
    const { data: voteHistory, error: historyError } = await supabase
      .from('vote_history')
      .select('*')
      .in('target_id', playerIds)
      .gte('created_at', startDate.toISOString())
      .order('created_at')

    if (historyError) {
      console.error('Error loading vote history:', historyError)
      return
    }

    // If no history, create a flat line showing current averages
    if (!voteHistory || voteHistory.length === 0) {
      console.log('No history found, using current votes')
      console.log('Current votes:', currentVotes)
      console.log('Selected player IDs:', playerIds)
      
      // Create two data points (start and end of range) with same values for flat line
      const startDate = getTimeRangeDate(timeRange)
      const endDate = new Date()
      
      const startPoint: TimelineDataPoint = {
        date: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: startDate.getTime()
      }
      
      const endPoint: TimelineDataPoint = {
        date: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: endDate.getTime()
      }

      let hasData = false
      playerIds.forEach(playerId => {
        const playerVotes = (currentVotes || []).filter((v: any) => v.target_id === playerId)
        console.log(`Player ${playerId}: ${playerVotes.length} votes`)
        
        if (playerVotes.length > 0) {
          const avg = playerVotes.reduce((sum: number, v: any) => sum + v.score, 0) / playerVotes.length
          const avgRounded = parseFloat(avg.toFixed(2))
          startPoint[playerId] = avgRounded
          endPoint[playerId] = avgRounded
          hasData = true
        }
      })

      if (hasData) {
        console.log('Setting timeline data with current averages')
        setTimelineData([startPoint, endPoint])
        const stats = calculatePlayerStats([startPoint, endPoint], playerIds)
        setPlayerStats(stats)
      } else {
        console.log('No data for selected players')
        setTimelineData([])
      }
      return
    }

    // Calculate timeline data with history
    const timeline = calculateTimeline(voteHistory, playerIds, currentVotes || [])
    setTimelineData(timeline)

    // Calculate stats for each player
    const stats = calculatePlayerStats(timeline, playerIds)
    setPlayerStats(stats)
  }

  const calculateTimeline = (history: VoteHistory[], playerIds: string[], baselineVotes: any[]): TimelineDataPoint[] => {
    if (history.length === 0) return []

    // Find the earliest vote in history
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const earliestVote = new Date(sortedHistory[0].created_at).getTime()
    const endDate = Date.now()
    
    // Use the later of (earliest vote, selected time range start) as the actual start
    // This prevents showing empty time before data exists
    const requestedStartDate = getTimeRangeDate(timeRange).getTime()
    const actualStartDate = Math.max(earliestVote, requestedStartDate)

    // Determine bucket size based on SELECTED time range (for consistent granularity)
    const getBucketSize = (): number => {
      switch (timeRange) {
        case '1d': return 2 * 60 * 60 * 1000 // 2 hours
        case '1w': return 6 * 60 * 60 * 1000 // 6 hours
        case '1m': return 24 * 60 * 60 * 1000 // 1 day
        case '3m': return 3 * 24 * 60 * 60 * 1000 // 3 days
        default: return 24 * 60 * 60 * 1000
      }
    }

    const bucketSize = getBucketSize()
    const startDate = actualStartDate

    // Track current state of all votes for each player
    const currentVotes = new Map<string, Map<string, number>>() // playerId -> (voterId -> score)
    playerIds.forEach(id => currentVotes.set(id, new Map()))

    // Initialize with baseline votes
    baselineVotes.forEach((vote: any) => {
      const playerVotes = currentVotes.get(vote.target_id)
      if (playerVotes) {
        playerVotes.set(vote.voter_id, vote.score)
      }
    })

    // Process vote history to update state
    let historyIndex = 0
    const dataPoints: TimelineDataPoint[] = []

    // Create buckets
    for (let bucketStart = startDate; bucketStart <= endDate; bucketStart += bucketSize) {
      const bucketEnd = Math.min(bucketStart + bucketSize, endDate)

      // Apply all votes that happened in this bucket
      while (historyIndex < sortedHistory.length) {
        const vote = sortedHistory[historyIndex]
        const voteTime = new Date(vote.created_at).getTime()
        
        if (voteTime <= bucketEnd) {
          // Apply this vote
          const playerVotes = currentVotes.get(vote.target_id)
          if (playerVotes) {
            playerVotes.set(vote.voter_id, vote.score)
          }
          historyIndex++
        } else {
          break
        }
      }

      // Create data point at end of bucket with current state
      const point: TimelineDataPoint = {
        date: new Date(bucketEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: bucketEnd
      }

      // Calculate averages at this point in time
      let hasData = false
      playerIds.forEach(playerId => {
        const votes = currentVotes.get(playerId)!
        if (votes.size > 0) {
          const avg = Array.from(votes.values()).reduce((sum, score) => sum + score, 0) / votes.size
          point[playerId] = parseFloat(avg.toFixed(2))
          hasData = true
        }
      })

      if (hasData) {
        dataPoints.push(point)
      }
    }

    return dataPoints
  }

  const calculatePlayerStats = (timeline: TimelineDataPoint[], playerIds: string[]): Map<string, PlayerStats> => {
    const stats = new Map<string, PlayerStats>()

    playerIds.forEach(playerId => {
      const scores = timeline
        .map(point => point[playerId] as number)
        .filter(score => score !== undefined)

      if (scores.length === 0) {
        stats.set(playerId, { current: 0, peak: 0, low: 0, trend: 'stable' })
        return
      }

      const current = scores[scores.length - 1]
      const peak = Math.max(...scores)
      const low = Math.min(...scores)
      
      // Calculate trend (compare last 3 points)
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (scores.length >= 3) {
        const recent = scores.slice(-3)
        const avgRecent = recent.reduce((sum, s) => sum + s, 0) / recent.length
        const earlier = scores.slice(-6, -3)
        if (earlier.length > 0) {
          const avgEarlier = earlier.reduce((sum, s) => sum + s, 0) / earlier.length
          if (avgRecent > avgEarlier + 0.1) trend = 'up'
          else if (avgRecent < avgEarlier - 0.1) trend = 'down'
        }
      }

      stats.set(playerId, { current, peak, low, trend })
    })

    return stats
  }

  const togglePlayer = (playerId: string) => {
    const newSelected = new Set(selectedPlayers)
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId)
    } else {
      if (newSelected.size >= 8) {
        alert('Maximum 8 players can be selected')
        return
      }
      newSelected.add(playerId)
    }
    setSelectedPlayers(newSelected)
  }

  const getDisplayName = (player: Player) => {
    return player.custom_name || player.display_name || 'Unknown'
  }

  const getPlayerColor = (playerId: string): string => {
    const index = Array.from(selectedPlayers).indexOf(playerId)
    return PLAYER_COLORS[index % PLAYER_COLORS.length]
  }

  if (loading) {
    return <div className="text-white text-center">Loading timeline...</div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">📈 Player Timeline</h1>
        <p className="text-white/70">
          Track player performance over time
        </p>
      </div>

      {/* Time Range Filter */}
      <Card className="mb-6 bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Time Range</h2>
            <div className="flex gap-2">
              <AppButton
                onClick={() => setTimeRange('1d')}
                variant={timeRange === '1d' ? 'primary' : 'secondary'}
                size="sm"
              >
                Last Day
              </AppButton>
              <AppButton
                onClick={() => setTimeRange('1w')}
                variant={timeRange === '1w' ? 'primary' : 'secondary'}
                size="sm"
              >
                Last Week
              </AppButton>
              <AppButton
                onClick={() => setTimeRange('1m')}
                variant={timeRange === '1m' ? 'primary' : 'secondary'}
                size="sm"
              >
                Last Month
              </AppButton>
              <AppButton
                onClick={() => setTimeRange('3m')}
                variant={timeRange === '3m' ? 'primary' : 'secondary'}
                size="sm"
              >
                Last 3 Months
              </AppButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Selection */}
      <Card className="mb-6 bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Select Players ({selectedPlayers.size}/8)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {players.map(player => {
              const isSelected = selectedPlayers.has(player.user_id)
              return (
                <div
                  key={player.user_id}
                  onClick={() => togglePlayer(player.user_id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500/20' 
                      : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium truncate">
                      {getDisplayName(player)}
                    </span>
                    {isSelected && (
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getPlayerColor(player.user_id) }}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {selectedPlayers.size > 0 && timelineData.length > 0 ? (
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  domain={[0, 10]} 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => value.toFixed(2)}
                  labelFormatter={(label) => label}
                  itemFormatter={(value: number, name: string) => {
                    const player = players.find(p => p.user_id === name)
                    const displayName = player ? getDisplayName(player) : name
                    return [value.toFixed(2), displayName]
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: '#fff' }}
                  formatter={(value) => {
                    const player = players.find(p => p.user_id === value)
                    return getDisplayName(player!)
                  }}
                />
                {Array.from(selectedPlayers).map(playerId => (
                  <Line
                    key={playerId}
                    type="monotone"
                    dataKey={playerId}
                    stroke={getPlayerColor(playerId)}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : selectedPlayers.size > 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <p className="text-xl text-slate-400 mb-2">
              No data available for selected players
            </p>
            <p className="text-sm text-slate-500">
              Selected players have no votes yet, or no vote changes in this time range.<br/>
              The timeline shows when player ratings change over time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <p className="text-xl text-slate-400">
              Select players to view their performance timeline
            </p>
          </CardContent>
        </Card>
      )}

      {/* Player Stats Cards */}
      {selectedPlayers.size > 0 && timelineData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from(selectedPlayers).map(playerId => {
            const player = players.find(p => p.user_id === playerId)
            const stats = playerStats.get(playerId)
            if (!player || !stats) return null

            return (
              <Card key={playerId} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPlayerColor(playerId) }}
                    />
                    <span className="font-semibold text-white">{getDisplayName(player)}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current:</span>
                      <span className="text-white font-semibold">{stats.current.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Peak:</span>
                      <span className="text-green-400 font-semibold">{stats.peak.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Low:</span>
                      <span className="text-red-400 font-semibold">{stats.low.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Trend:</span>
                      <Badge 
                        className={
                          stats.trend === 'up' ? 'bg-green-600' :
                          stats.trend === 'down' ? 'bg-red-600' :
                          'bg-slate-600'
                        }
                      >
                        {stats.trend === 'up' ? '↑ Rising' :
                         stats.trend === 'down' ? '↓ Falling' :
                         '→ Stable'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

