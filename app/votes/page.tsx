"use client"

import { useEffect, useState } from 'react'
import { supabase, Player, Vote } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type VoteWithNames = Vote & {
  voter?: Player
  target?: Player
}

type PlayerWithAvg = Player & {
  avg_score: number
}

export default function VotesPage() {
  const [votes, setVotes] = useState<VoteWithNames[]>([])
  const [players, setPlayers] = useState<PlayerWithAvg[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllVotes()
  }, [])

  const loadAllVotes = async () => {
    // Get all players with their avg scores (only rematch players)
    const { data: ratingsData } = await supabase
      .from('player_ratings')
      .select('*')
      .eq('plays_rematch', true)
      .order('display_name')

    // Get full player data
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .eq('plays_rematch', true)

    // Get all votes
    const { data: votesData } = await supabase
      .from('votes')
      .select('*')

    if (!playersData || !votesData || !ratingsData) {
      setLoading(false)
      return
    }

    // Create player lookup map with avg scores
    const ratingsMap = new Map(ratingsData.map(r => [r.player_id, r.avg_score]))
    const playersMap = new Map(playersData.map(p => [p.user_id, p]))
    
    // Merge players with their avg scores
    const playersWithAvg: PlayerWithAvg[] = playersData.map(p => ({
      ...p,
      avg_score: ratingsMap.get(p.user_id) || 0
    })).sort((a, b) => (a.custom_name || a.display_name || '').localeCompare(b.custom_name || b.display_name || ''))

    // Filter votes to only include those between rematch players
    const enrichedVotes = votesData
      .filter(v => playersMap.has(v.voter_id) && playersMap.has(v.target_id))
      .map(v => ({
        ...v,
        voter: playersMap.get(v.voter_id),
        target: playersMap.get(v.target_id)
      }))

    setVotes(enrichedVotes)
    setPlayers(playersWithAvg)
    setLoading(false)
  }

  const getVote = (voterId: string, targetId: string): number | null => {
    const vote = votes.find(v => v.voter_id === voterId && v.target_id === targetId)
    return vote ? vote.score : null
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-slate-700 text-slate-400 font-semibold'
    if (score >= 8) return 'bg-green-600 text-white font-bold'
    if (score >= 6) return 'bg-blue-600 text-white font-bold'
    if (score >= 4) return 'bg-yellow-600 text-white font-bold'
    return 'bg-orange-600 text-white font-bold'
  }

  const getDisplayName = (player: PlayerWithAvg) => {
    return player.custom_name || player.display_name || 'Unknown'
  }

  const getAvgScoreColor = (avg: number) => {
    if (avg >= 8) return 'text-green-400'
    if (avg >= 6) return 'text-blue-400'
    if (avg >= 4) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const getGenerosityScore = (voterId: string): number => {
    const voterVotes = votes.filter(v => v.voter_id === voterId)
    if (voterVotes.length === 0) return 0
    const sum = voterVotes.reduce((acc, v) => acc + v.score, 0)
    return sum / voterVotes.length
  }

  if (loading) {
    return <div className="text-white text-center">Loading votes matrix...</div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">🗳️ All Votes Matrix</h1>
        <p className="text-white/70">
          See who voted what for everyone - complete transparency
        </p>
      </div>

      {players.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <p className="text-xl text-white">
              No players yet. Start by signing in!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Votes Grid ({votes.length} total votes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-slate-800 z-10 p-3 border border-slate-600 text-left text-white font-bold min-w-[150px]">
                      Voter → Target
                    </th>
                    {players.map(target => (
                      <th 
                        key={target.user_id} 
                        className="p-3 border border-slate-600 text-center text-sm font-semibold min-w-[120px] bg-slate-800"
                        title={`${getDisplayName(target)} - Avg: ${target.avg_score.toFixed(2)}`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="truncate text-white">
                            {getDisplayName(target)}
                          </span>
                          <span className={`text-xs font-bold ${getAvgScoreColor(target.avg_score)}`}>
                            {target.avg_score.toFixed(2)}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map(voter => {
                    const generosityScore = getGenerosityScore(voter.user_id)
                    return (
                    <tr key={voter.user_id} className="hover:bg-slate-700/30">
                      <td className="sticky left-0 bg-slate-800 z-10 p-3 border border-slate-600">
                        <div className="flex items-center justify-between gap-3" title={`${getDisplayName(voter)} - Generosity: ${generosityScore.toFixed(2)} (average score they give to others)`}>
                          <span className="font-semibold text-white truncate">
                            {getDisplayName(voter)}
                          </span>
                          <span className={`text-xs font-bold whitespace-nowrap ${getAvgScoreColor(generosityScore)}`}>
                            G: {generosityScore.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      {players.map(target => {
                        const isSelf = voter.user_id === target.user_id
                        const score = isSelf ? null : getVote(voter.user_id, target.user_id)
                        
                        return (
                          <td 
                            key={target.user_id} 
                            className={`p-3 border border-slate-600 text-center ${
                              isSelf ? 'bg-slate-900/50' : 'bg-slate-900/20'
                            }`}
                          >
                            {isSelf ? (
                              <div className="text-gray-500 text-sm font-medium">-</div>
                            ) : (
                              <div className={`text-base py-2 px-3 rounded ${getScoreColor(score)}`}>
                                {score ? score.toFixed(2) : '?'}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-green-600"></div>
                  <span>8-10 (Pro)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-600"></div>
                  <span>6-7 (Good)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-yellow-600"></div>
                  <span>4-5 (Average)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-orange-600"></div>
                  <span>1-3 (Beginner)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-700"></div>
                  <span>? (Not voted)</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 bg-slate-900/30 p-2 rounded">
                <strong className="text-slate-300">G:</strong> Generosity Score - The average score this player gives to others (hover over row names to see details)
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

