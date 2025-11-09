"use client"

import { useEffect, useState } from 'react'
import { supabase, PlayerRating } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ScoreboardPage() {
  const [ratings, setRatings] = useState<PlayerRating[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRatings()
  }, [])

  const loadRatings = async () => {
    const { data, error } = await supabase
      .from('player_ratings')
      .select('*')
      .order('avg_score', { ascending: false })

    if (error) {
      console.error('Error loading ratings:', error)
      return
    }

    setRatings(data || [])
    setLoading(false)
  }

  const getAvatarUrl = (rating: PlayerRating) => {
    if (rating.avatar_url) {
      if (rating.avatar_url.startsWith('http')) {
        return rating.avatar_url
      }
    }
    return null
  }

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500'
    if (score >= 6) return 'text-blue-500'
    if (score >= 4) return 'text-yellow-500'
    return 'text-orange-500'
  }

  if (loading) {
    return <div className="text-white text-center">Loading scoreboard...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">🏆 Scoreboard</h1>
        <p className="text-white/70">
          Player rankings based on community ratings
        </p>
      </div>

      <div className="grid gap-3">
        {ratings.map((rating, index) => {
          const avatarUrl = getAvatarUrl(rating)
          const avgScore = typeof rating.avg_score === 'number' 
            ? rating.avg_score 
            : parseFloat(String(rating.avg_score))

          return (
            <Card 
              key={rating.player_id} 
              className={index < 3 ? 'border-primary/50 bg-primary/5' : 'bg-slate-800/50'}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold w-12 text-center text-white">
                    {getRankEmoji(index)}
                  </div>
                  
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={rating.display_name || 'Player'}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl text-white">
                      {(rating.display_name || '?')[0].toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="font-semibold text-lg text-white">
                      {rating.display_name || 'Unknown Player'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {rating.voter_count} {rating.voter_count === 1 ? 'vote' : 'votes'}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-4xl font-bold ${getScoreColor(avgScore)}`}>
                      {avgScore.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">/ 10.00</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {ratings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-xl text-muted-foreground">
              No ratings yet. Be the first to rate players!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

