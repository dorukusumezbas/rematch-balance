# Architecture Overview

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth with Discord OAuth
- **Deployment**: Vercel (auto-deploy from main branch)

## Project Structure

```
rematch-balance/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with AuthGate
│   ├── page.tsx                 # Home page with navigation cards
│   ├── rate/page.tsx            # Rate other players (1-10 slider)
│   ├── scoreboard/page.tsx      # View rankings and averages
│   ├── profile/page.tsx         # Edit custom display name
│   └── globals.css              # Global styles + Tailwind
│
├── components/
│   ├── AuthGate.tsx             # Authentication wrapper + navigation
│   └── ui/                      # Reusable UI components (shadcn-style)
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       └── slider.tsx
│
├── lib/
│   ├── supabaseClient.ts        # Supabase client + types + helpers
│   └── utils.ts                 # Utility functions (cn for classnames)
│
├── supabase/
│   └── migrations/              # Database migrations (numbered)
│       ├── 001_initial_schema.sql
│       ├── 002_add_custom_names.sql
│       └── README.md            # Migration tracker
│
├── .cursorrules                 # AI assistant project rules
├── ARCHITECTURE.md              # This file - system design
├── SETUP.md                     # Step-by-step setup guide
└── README.md                    # Project overview + quick start
```

## Data Model

### Tables

**players**
- `user_id` (uuid, PK) - References auth.users
- `discord_id` (text, unique) - Discord user ID
- `display_name` (text) - Discord username
- `custom_name` (text, nullable) - User-set custom name
- `avatar_url` (text) - Discord avatar URL
- `joined_at` (timestamptz) - Account creation timestamp

**votes**
- `voter_id` (uuid, PK) - Who voted
- `target_id` (uuid, PK) - Who was rated
- `score` (int, 1-10) - Rating value
- `updated_at` (timestamptz) - Last update time
- Constraint: Cannot vote for yourself
- Composite PK: (voter_id, target_id) - One vote per pair

### Views

**player_ratings**
- Aggregates votes to calculate:
  - `player_id` - Player UUID
  - `display_name` - Custom name (if set) or Discord name
  - `avatar_url` - Player avatar
  - `avg_score` - Average of all votes received
  - `voter_count` - Number of votes received

## Authentication Flow

1. User clicks "Sign in with Discord"
2. Supabase redirects to Discord OAuth
3. User authorizes the app
4. Discord redirects back to Supabase callback
5. Supabase redirects to app with session
6. `AuthGate.tsx` detects session
7. `ensurePlayer()` upserts user to `players` table
8. User is now authenticated and can use the app

## Key Features

### 1. Rating System (`/rate`)
- Fetch all players except current user
- Display with sliders (1-10)
- Auto-save on change (debounced 300ms)
- Upsert to `votes` table (last vote wins)
- Show "missing votes" count
- "Hide Rated" filter option

### 2. Scoreboard (`/scoreboard`)
- Query `player_ratings` view
- Sort by `avg_score` DESC
- Display medals for top 3
- Color-coded scores (green=8+, blue=6+, yellow=4+)
- Show vote counts

### 3. Profile (`/profile`)
- View Discord name (read-only)
- Set custom display name
- Update `custom_name` in `players` table
- Custom name used everywhere if set

## Security (RLS Policies)

### players table
- **Read**: Any authenticated user
- **Insert**: Users can only insert their own record
- **Update**: Users can only update their own record

### votes table
- **Read**: Any authenticated user
- **Insert**: Users can only insert votes where they are the voter
- **Update**: Users can only update their own votes
- **Constraint**: Cannot vote for yourself (DB-level check)

## State Management

- **No global state library** (React state + Supabase is enough)
- Component-level state with `useState`
- Data fetching with Supabase client in `useEffect`
- Real-time updates: Manual refresh (no subscriptions yet)

## API Routes

- **None!** Direct Supabase client calls from components
- Supabase handles auth, RLS, and data access
- No custom Next.js API routes needed for MVP

## Deployment

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### Deploy Process
1. Push to `main` branch on GitHub
2. Vercel auto-detects Next.js
3. Builds and deploys automatically
4. Environment variables set in Vercel dashboard

### Post-Deploy Checklist
- [ ] Update Discord OAuth redirects with Vercel URL
- [ ] Update Supabase Auth URLs with Vercel domain
- [ ] Test authentication flow
- [ ] Verify database connection

## Future Enhancements (Not Implemented Yet)

- Team balancing algorithm
- Vote history audit log
- Real-time updates with Supabase subscriptions
- Discord guild gating
- Player statistics and trends
- Mobile app views

