"use client"

import { useEffect, useState } from 'react'
import { supabase, Player, Vote } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { AppButton } from '@/components/AppButton'

export default function RatePage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [myVotes, setMyVotes] = useState<Map<string, number>>(new Map())
  const [pendingChanges, setPendingChanges] = useState<Map<string, number>>(new Map())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hideRated, setHideRated] = useState(false)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setCurrentUserId(user.id)

    // Load all players except current user (only rematch players)
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .neq('user_id', user.id)
      .eq('plays_rematch', true)
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
    // Mark as having unsaved changes
    setPendingChanges(prev => new Map(prev).set(targetId, score))
  }

  const saveVote = async (targetId: string, score: number) => {
    if (!currentUserId) return

    // Mark as saving
    setSavingIds(prev => new Set(prev).add(targetId))

    const { error } = await supabase
      .from('votes')
      .upsert({
        voter_id: currentUserId,
        target_id: targetId,
        score: score,
      }, {
        onConflict: 'voter_id,target_id'
      })

    // Done saving
    setSavingIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(targetId)
      return newSet
    })

    if (error) {
      console.error('Error saving vote:', error)
      alert('Error saving vote. Please try again.')
    } else {
      // Update saved votes
      setMyVotes(prev => new Map(prev).set(targetId, score))
      // Remove from pending changes
      setPendingChanges(prev => {
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
  
  const totalPendingCount = pendingChanges.size

  if (loading) {
    return <div className="text-white text-center">Loading players...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-white">Rate Players</h1>
          {unratedCount < players.length && (
            <AppButton
              onClick={() => setHideRated(!hideRated)}
              variant="secondary"
            >
              {hideRated ? 'Show All' : 'Hide Rated'}
            </AppButton>
          )}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-white/70">
            {unratedCount > 0 ? (
              <>You have <Badge variant="destructive">{unratedCount} unrated</Badge> players</>
            ) : (
              <span className="text-green-400">✓ You've rated everyone!</span>
            )}
          </p>
          {totalPendingCount > 0 && (
            <Badge className="bg-yellow-600 text-white">
              {totalPendingCount} unsaved change{totalPendingCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {displayedPlayers.map(player => {
          const savedScore = myVotes.get(player.user_id)
          const pendingScore = pendingChanges.get(player.user_id)
          const currentScore = pendingScore !== undefined ? pendingScore : savedScore
          const hasUnsavedChanges = pendingChanges.has(player.user_id)
          const isSaving = savingIds.has(player.user_id)
          const avatarUrl = getAvatarUrl(player)
          const displayName = player.custom_name || player.display_name || 'Unknown Player'
          
          return (
            <Card key={player.user_id} className={savedScore === undefined ? 'border-destructive border-2 bg-destructive/10' : 'bg-slate-800/50 border-slate-700'}>
              <CardContent className="p-4">
                {/* Header: Avatar + Name + Badges | Score */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={displayName}
                        className="w-12 h-12 rounded-full ring-2 ring-slate-700 mt-2"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg text-white ring-2 ring-slate-700 mt-2">
                        {displayName[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-white text-base mb-1">{displayName}</div>
                      <div className="flex items-center gap-1.5">
                        {savedScore === undefined && (
                          <Badge variant="destructive" className="text-xs animate-pulse px-2 py-0">NOT RATED</Badge>
                        )}
                        {hasUnsavedChanges && !isSaving && (
                          <Badge className="text-xs bg-yellow-600 text-white px-2 py-0">Unsaved</Badge>
                        )}
                        {isSaving && (
                          <Badge variant="secondary" className="text-xs px-2 py-0">Saving...</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold" style={{ color: currentScore !== undefined ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                    {currentScore !== undefined ? currentScore.toFixed(2) : '—'}
                  </div>
                </div>

                {/* Warning Message */}
                {savedScore === undefined && pendingScore === undefined && (
                  <div className="text-center text-xs text-destructive font-medium mb-3 bg-destructive/10 py-1.5 rounded">
                    ⚠️ Drag the slider to rate this player
                  </div>
                )}
                
                {/* Slider */}
                <div className={`mb-3 ${savedScore === undefined && pendingScore === undefined ? 'opacity-50' : ''}`}>
                  <Slider
                    min={0}
                    max={10}
                    step={0.25}
                    value={currentScore !== undefined ? currentScore : 5.0}
                    onValueChange={(value) => handleVoteChange(player.user_id, value)}
                    disabled={isSaving}
                    className="mb-1"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>0.0</span>
                    <span>5.0</span>
                    <span>10.0</span>
                  </div>
                </div>

                {/* Save Button */}
                {hasUnsavedChanges && (
                  <AppButton 
                    onClick={() => saveVote(player.user_id, currentScore!)}
                    disabled={isSaving}
                    fullWidth
                    size="sm"
                    variant="success"
                  >
                    {isSaving ? 'Saving...' : 'Save Vote'}
                  </AppButton>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {displayedPlayers.length === 0 && hideRated && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <p className="text-xl text-white">
              🎉 You've rated all players! 
            </p>
            <AppButton 
              onClick={() => setHideRated(false)} 
              className="mt-4"
              variant="primary"
            >
              Show All Players
            </AppButton>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

