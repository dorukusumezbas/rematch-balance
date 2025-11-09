# Quick Start for AI Assistants

> Skip to the relevant section based on what you're trying to do.

## Project Context at a Glance

**What**: Player rating app for Discord community "ASLI CIKMAZI"  
**Stack**: Next.js 14 + Supabase + Vercel  
**Auth**: Discord OAuth  
**Status**: MVP deployed and working

## File Map (Most Important Files)

```
app/
  rate/page.tsx          ← Rating UI with sliders
  scoreboard/page.tsx    ← Rankings leaderboard
  profile/page.tsx       ← User settings
  
components/
  AuthGate.tsx           ← Auth wrapper + navigation
  
lib/
  supabaseClient.ts      ← DB client + types + helpers
  
supabase/migrations/     ← Database changes (numbered)
```

## Common Scenarios

### "Add a new database field"

1. Create `supabase/migrations/00X_add_field.sql`:
```sql
ALTER TABLE players ADD COLUMN new_field text;
```

2. Update type in `lib/supabaseClient.ts`:
```typescript
export type Player = {
  // existing fields...
  new_field: string | null
}
```

3. Update migration README
4. Tell user to run in Supabase SQL Editor

### "Add a new page"

1. Create `app/new-page/page.tsx`
2. Add nav link in `components/AuthGate.tsx`
3. Add home card in `app/page.tsx`

### "Query the database"

```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('field', value)
```

## Important Context

**Display Names:**
- Always prefer `custom_name` over `display_name`
- Use: `player.custom_name || player.display_name || 'Unknown'`

**Migrations:**
- Never modify old migrations
- Always use `IF EXISTS` / `IF NOT EXISTS`
- Update `supabase/migrations/README.md` table

**Security:**
- All queries protected by RLS
- Users can only modify their own data
- Can't vote for yourself (DB constraint)

**Auto-Save Pattern:**
```typescript
const [pending, setPending] = useState(new Map())

const handleChange = (id: string, value: any) => {
  // Update UI immediately
  setState(value)
  
  // Mark as pending
  setPending(prev => new Map(prev).set(id, value))
  
  // Debounce save
  setTimeout(() => saveToDb(id, value), 300)
}
```

## Code Patterns

**Component Structure:**
```typescript
"use client"  // Only if using hooks

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Page() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    const { data } = await supabase.from('table').select('*')
    setData(data || [])
    setLoading(false)
  }
  
  if (loading) return <div>Loading...</div>
  
  return <div>{/* render */}</div>
}
```

**UI Component:**
```typescript
import { cn } from "@/lib/utils"

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'custom'
}

const Component = React.forwardRef<HTMLDivElement, Props>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("base", className)} {...props} />
  )
)
```

## Project Rules

1. TypeScript strict mode - no `any`
2. Tailwind for styling - no custom CSS
3. Server components by default
4. Handle all errors gracefully
5. Update docs when changing architecture

## Testing

Manual test checklist:
- [ ] Auth flow (sign in/out)
- [ ] Can rate players
- [ ] Votes save and persist
- [ ] Scoreboard updates
- [ ] Profile changes work

## Deploy

Push to main → Vercel auto-deploys → Test production

## Where to Look

**Need to understand auth?** → `components/AuthGate.tsx`  
**Need to see DB types?** → `lib/supabaseClient.ts`  
**Need to add DB field?** → `supabase/migrations/`  
**Need to understand flow?** → `ARCHITECTURE.md`  
**Need setup steps?** → `SETUP.md`

