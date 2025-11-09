"use client"

import { useEffect, useState } from 'react'
import { supabase, Player, Vote } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function RatePage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [myVotes, setMyVotes] = useState<Map<string, number>>(new Map())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hideRated, setHideRated] = useState(false)
  const [pendingVotes, setPendingVotes] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setCurrentUserId(user.id)

    // Load all players except current user
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .neq('user_id', user.id)
      .order('display_name')

    if (playersError) {
      console.error('Error loading players:', playersError)
      return
    }

    // Load current user's votes
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .eq('voter_id', user.id)

    if (votesError) {
      console.error('Error loading votes:', votesError)
      return
    }

    const votesMap = new Map<string, number>()
    votesData?.forEach((vote: Vote) => {
      votesMap.set(vote.target_id, vote.score)
    })

    setPlayers(playersData || [])
    setMyVotes(votesMap)
    setLoading(false)
  }

  const handleVoteChange = (targetId: string, score: number) => {
    // Update local state immediately
    setMyVotes(prev => new Map(prev).set(targetId, score))
    
    // Mark as pending
    setPendingVotes(prev => new Map(prev).set(targetId, score))
    
    // Debounce the actual save
    const timeoutId = setTimeout(() => {
      saveVote(targetId, score)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  const saveVote = async (targetId: string, score: number) => {
    if (!currentUserId) return

    const { error } = await supabase
      .from('votes')
      .upsert({
        voter_id: currentUserId,
        target_id: targetId,
        score: score,
      }, {
        onConflict: 'voter_id,target_id'
      })

    if (error) {
      console.error('Error saving vote:', error)
      alert('Error saving vote. Please try again.')
    } else {
      // Remove from pending
      setPendingVotes(prev => {
        const newMap = new Map(prev)
        newMap.delete(targetId)
        return newMap
      })
    }
  }

  const getAvatarUrl = (player: Player) => {
    if (player.avatar_url) {
      // Discord CDN URLs
      if (player.avatar_url.startsWith('http')) {
        return player.avatar_url
      }
      // If it's just the hash, construct the full URL
      if (player.discord_id) {
        return `https://cdn.discordapp.com/avatars/${player.discord_id}/${player.avatar_url}.png`
      }
    }
    return null
  }

  const unratedCount = players.filter(p => !myVotes.has(p.user_id)).length
  const displayedPlayers = hideRated 
    ? players.filter(p => !myVotes.has(p.user_id))
    : players

  if (loading) {
    return <div className="text-white text-center">Loading players...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Rate Players</h1>
          <p className="text-white/70">
            {unratedCount > 0 ? (
              <>You have <Badge variant="destructive">{unratedCount} unrated</Badge> players</>
            ) : (
              <span className="text-green-400">✓ You've rated everyone!</span>
            )}
          </p>
        </div>
        {unratedCount < players.length && (
          <Button
            variant="outline"
            onClick={() => setHideRated(!hideRated)}
            className="text-white border-white/20 hover:bg-white/10"
          >
            {hideRated ? 'Show All' : 'Hide Rated'}
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {displayedPlayers.map(player => {
          const currentScore = myVotes.get(player.user_id)
          const isPending = pendingVotes.has(player.user_id)
          const avatarUrl = getAvatarUrl(player)

          const displayName = player.custom_name || player.display_name || 'Unknown Player'
          
          return (
            <Card key={player.user_id} className={!currentScore ? 'border-destructive/50' : ''}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={displayName}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                      {displayName[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {displayName}
                      {!currentScore && (
                        <Badge variant="destructive" className="text-xs">Please Rate</Badge>
                      )}
                      {isPending && (
                        <Badge variant="secondary" className="text-xs">Saving...</Badge>
                      )}
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {currentScore || '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">/ 10</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={currentScore || 5}
                    onValueChange={(value) => handleVoteChange(player.user_id, value)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 - Beginner</span>
                    <span>5 - Average</span>
                    <span>10 - Pro</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {displayedPlayers.length === 0 && hideRated && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-xl text-muted-foreground">
              🎉 You've rated all players! 
            </p>
            <Button 
              onClick={() => setHideRated(false)} 
              className="mt-4"
            >
              Show All Players
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

