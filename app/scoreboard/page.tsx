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
      .eq('plays_rematch', true) // Only show active rematch players
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
    if (score >= 8.5) return 'text-green-500'
    if (score >= 7) return 'text-blue-500'
    if (score >= 5) return 'text-yellow-500'
    if (score >= 2.5) return 'text-orange-500'
    return 'text-red-500'
  }

  const getRankTitle = (score: number) => {
    if (score >= 8.5) return { emoji: '👑', title: 'Kral', color: 'bg-green-600' }
    if (score >= 7) return { emoji: '🎖️', title: 'Vezir', color: 'bg-blue-600' }
    if (score >= 5) return { emoji: '⚔️', title: 'Komutan', color: 'bg-yellow-600' }
    if (score >= 2.5) return { emoji: '🪓', title: 'Oduncu', color: 'bg-orange-600' }
    return { emoji: '🗑️', title: 'Çöp', color: 'bg-red-700' }
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
          const rankTitle = getRankTitle(avgScore)

          return (
            <Card 
              key={rating.player_id} 
              className={index < 3 ? 'border-primary/50 bg-primary/5' : 'bg-slate-800/50 border-slate-700'}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className={`font-bold w-12 text-center text-white ${index < 3 ? 'text-5xl' : 'text-3xl'}`}>
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
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`${rankTitle.color} px-2 py-0.5 rounded text-white text-xs font-semibold flex items-center gap-1`}>
                        <span>{rankTitle.emoji}</span>
                        <span>{rankTitle.title}</span>
                      </div>
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

