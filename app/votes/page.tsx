"use client"

import { useEffect, useState } from 'react'
import { supabase, Player, Vote } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type VoteWithNames = Vote & {
  voter?: Player
  target?: Player
}

export default function VotesPage() {
  const [votes, setVotes] = useState<VoteWithNames[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllVotes()
  }, [])

  const loadAllVotes = async () => {
    // Get all players
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .order('display_name')

    // Get all votes
    const { data: votesData } = await supabase
      .from('votes')
      .select('*')

    if (!playersData || !votesData) {
      setLoading(false)
      return
    }

    // Create player lookup map
    const playersMap = new Map(playersData.map(p => [p.user_id, p]))

    // Enrich votes with player names
    const enrichedVotes = votesData.map(v => ({
      ...v,
      voter: playersMap.get(v.voter_id),
      target: playersMap.get(v.target_id)
    }))

    setVotes(enrichedVotes)
    setPlayers(playersData)
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

  const getDisplayName = (player: Player) => {
    return player.custom_name || player.display_name || 'Unknown'
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
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-xl text-muted-foreground">
              No players yet. Start by signing in!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
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
                        className="p-3 border border-slate-600 text-center text-white text-sm font-semibold min-w-[100px] bg-slate-800"
                        title={getDisplayName(target)}
                      >
                        <div className="truncate max-w-[100px]">
                          {getDisplayName(target)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map(voter => (
                    <tr key={voter.user_id} className="hover:bg-slate-700/30">
                      <td className="sticky left-0 bg-slate-800 z-10 p-3 border border-slate-600 font-semibold text-white">
                        <div className="truncate max-w-[150px]" title={getDisplayName(voter)}>
                          {getDisplayName(voter)}
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
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-600/20 border border-green-600/40"></div>
                <span>8-10 (Pro)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600/20 border border-blue-600/40"></div>
                <span>6-7 (Good)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-yellow-600/20 border border-yellow-600/40"></div>
                <span>4-5 (Average)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-orange-600/20 border border-orange-600/40"></div>
                <span>1-3 (Beginner)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-800/30 border border-gray-700"></div>
                <span>? (Not voted)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

