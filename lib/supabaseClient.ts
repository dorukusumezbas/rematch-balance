import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type Player = {
  user_id: string
  discord_id: string | null
  display_name: string | null
  custom_name: string | null
  avatar_url: string | null
  joined_at: string
}

export type Vote = {
  voter_id: string
  target_id: string
  score: number
  updated_at: string
}

export type PlayerRating = {
  player_id: string
  display_name: string | null
  avatar_url: string | null
  avg_score: number
  voter_count: number
}

export const supabase = createClientComponentClient()

export async function ensurePlayer(userId: string, metadata: any) {
  const { error } = await supabase
    .from('players')
    .upsert({
      user_id: userId,
      discord_id: metadata.provider_id || metadata.sub,
      display_name: metadata.full_name || metadata.name || metadata.user_name,
      avatar_url: metadata.avatar_url || metadata.picture,
    }, {
      onConflict: 'user_id'
    })
  
  if (error) {
    console.error('Error upserting player:', error)
  }
}

