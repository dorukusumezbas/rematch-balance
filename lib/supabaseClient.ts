import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Type definition for the players table
 * Stores user information from Discord OAuth
 */
export type Player = {
  user_id: string; // UUID from Supabase Auth
  discord_id: string | null; // Discord user ID
  display_name: string | null; // Discord username
  custom_name: string | null; // User-set custom display name (optional)
  avatar_url: string | null; // Discord avatar URL
  joined_at: string; // Account creation timestamp
  plays_rematch: boolean; // Whether player actively plays rematch games
  is_admin: boolean; // Admin flag for managing other players
};

/**
 * Type definition for the votes table
 * Stores player ratings (1-10 scale)
 * Composite PK (voter_id, target_id) ensures one vote per player pair
 */
export type Vote = {
  voter_id: string; // Who is voting
  target_id: string; // Who is being rated
  score: number; // Rating value (1-10)
  updated_at: string; // Last update timestamp
};

/**
 * Type definition for the player_ratings view
 * Aggregates votes to show average scores and vote counts
 */
export type PlayerRating = {
  player_id: string;
  display_name: string | null; // Uses custom_name if set, otherwise discord name
  avatar_url: string | null;
  avg_score: number; // Average of all votes (0 if no votes)
  voter_count: number; // Number of votes received
};

/**
 * Type definition for the vote_history table
 * Audit log of all vote changes with timestamps
 */
export type VoteHistory = {
  id: number;
  voter_id: string;
  target_id: string;
  score: number;
  created_at: string;
};

/**
 * Supabase client instance
 * Used for all database queries and auth operations
 */
export const supabase = createClientComponentClient();

/**
 * Ensures a player record exists for the authenticated user
 * Called after Discord OAuth login
 *
 * @param userId - Supabase Auth user UUID
 * @param metadata - User metadata from Discord OAuth
 */
export async function ensurePlayer(userId: string, metadata: any) {
  const { error } = await supabase.from("players").upsert(
    {
      user_id: userId,
      discord_id: metadata.provider_id || metadata.sub,
      display_name: metadata.full_name || metadata.name || metadata.user_name,
      avatar_url: metadata.avatar_url || metadata.picture,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    console.error("Error upserting player:", error);
  }
}
