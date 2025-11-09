"use client"

import { useEffect, useState } from 'react'
import { supabase, VoteHistory, Player } from '@/lib/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type HistoryWithPlayer = VoteHistory & {
  target_player?: Player
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryWithPlayer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get vote history
    const { data: historyData, error: historyError } = await supabase
      .from('vote_history')
      .select('*')
      .eq('voter_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200)

    if (historyError) {
      console.error('Error loading history:', historyError)
      return
    }

    // Get unique target IDs
    const targetIds = [...new Set(historyData?.map(h => h.target_id) || [])]

    // Fetch player names for all targets
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .in('user_id', targetIds)

    const playersMap = new Map(playersData?.map(p => [p.user_id, p]) || [])

    // Merge data
    const enrichedHistory = historyData?.map(h => ({
      ...h,
      target_player: playersMap.get(h.target_id)
    })) || []

    setHistory(enrichedHistory)
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-600'
    if (score >= 6) return 'bg-blue-600'
    if (score >= 4) return 'bg-yellow-600'
    return 'bg-orange-600'
  }

  if (loading) {
    return <div className="text-white text-center">Loading history...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">📜 Vote History</h1>
        <p className="text-white/70">
          Your voting history - showing last {Math.min(history.length, 200)} votes
        </p>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-xl text-muted-foreground">
              No voting history yet. Go rate some players!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => {
            const displayName = entry.target_player?.custom_name 
              || entry.target_player?.display_name 
              || 'Unknown Player'
            
            return (
              <Card key={entry.id} className="hover:bg-accent/5 transition-colors">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge className={`${getScoreColor(entry.score)} text-white font-bold w-10 justify-center`}>
                        {entry.score}
                      </Badge>
                      <div>
                        <div className="font-medium text-white">
                          Rated <span className="text-primary">{displayName}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
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

