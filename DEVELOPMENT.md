# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ (we use v25.1.0)
- npm 8+ (we use v11.6.2)
- Supabase account
- Discord application (for OAuth)

### Initial Setup

1. **Clone and install dependencies:**
```bash
git clone https://github.com/dorukusumezbas/rematch-balance.git
cd rematch-balance
npm install
```

2. **Set up environment variables:**
```bash
cp env.example .env.local
# Edit .env.local with your Supabase credentials
```

3. **Run development server:**
```bash
npm run dev
# Visit http://localhost:3000
```

See `SETUP.md` for detailed Supabase and Discord OAuth setup.

## Project Conventions

### File Naming
- Components: PascalCase (`AuthGate.tsx`)
- Pages: lowercase (`page.tsx` in folders)
- Utilities: camelCase (`supabaseClient.ts`)
- Migrations: numbered (`001_description.sql`)

### TypeScript
- Strict mode enabled
- Define types for all Supabase tables in `lib/supabaseClient.ts`
- Export types for reuse across components

### Styling
- Use Tailwind utility classes
- Component-specific styles via `className`
- Use `cn()` helper for conditional classes
- shadcn/ui pattern for reusable components

### Components
- Prefer server components (default in App Router)
- Add `"use client"` only when needed:
  - Using hooks (useState, useEffect)
  - Browser-only APIs
  - Event handlers
- Keep components small and focused

## Adding New Features

### Example: Adding a New Feature

**1. Database Changes:**
```bash
# Create migration
touch supabase/migrations/003_add_feature.sql

# Write SQL
vim supabase/migrations/003_add_feature.sql

# Update migration README
vim supabase/migrations/README.md

# Run in Supabase SQL Editor
# Mark as applied in README
```

**2. Update Types:**
```typescript
// lib/supabaseClient.ts
export type NewTable = {
  id: string
  field: string
  // ...
}
```

**3. Create Component/Page:**
```bash
mkdir app/new-feature
touch app/new-feature/page.tsx
```

**4. Add Navigation:**
```typescript
// components/AuthGate.tsx
<a href="/new-feature">New Feature</a>
```

**5. Test Locally:**
```bash
npm run dev
# Test all flows
```

**6. Commit and Push:**
```bash
git add .
git commit -m "Add new feature"
git push origin main
```

## Database Migrations

See `supabase/migrations/README.md` for detailed migration workflow.

**Golden Rules:**
1. Never modify existing migrations
2. Always use `IF EXISTS` / `IF NOT EXISTS`
3. Test migrations on a copy first
4. Update README table after creating
5. Commit migrations with code changes

## Common Tasks

### Adding a Supabase Query

```typescript
// In your component
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('field', value)

if (error) {
  console.error('Error:', error)
  return
}

// Use data
```

### Creating a New UI Component

```typescript
// components/ui/my-component.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface MyComponentProps 
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'custom'
}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("base-classes", className)}
        {...props}
      />
    )
  }
)
MyComponent.displayName = "MyComponent"

export { MyComponent }
```

### Adding a New Page

```typescript
// app/new-page/page.tsx
export default function NewPage() {
  return (
    <div>
      <h1>New Page</h1>
    </div>
  )
}
```

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Sign in with Discord
- [ ] User data populated in database
- [ ] Sign out works
- [ ] Session persists on refresh

**Rating System:**
- [ ] Can't see yourself in /rate
- [ ] Sliders work (1-10)
- [ ] Votes auto-save
- [ ] Votes persist on refresh
- [ ] Can update existing votes

**Scoreboard:**
- [ ] Shows all players with votes
- [ ] Sorted by average score
- [ ] Vote counts accurate
- [ ] Avatars display correctly

**Profile:**
- [ ] Can set custom name
- [ ] Custom name appears everywhere
- [ ] Can clear custom name

## Debugging

### Common Issues

**"No session" errors:**
- Check `.env.local` has correct Supabase URL and key
- Verify Discord OAuth callback URL matches Supabase
- Check browser console for auth errors

**Database query fails:**
- Check RLS policies allow the operation
- Verify user is authenticated
- Check browser console for error details

**Vercel deployment fails:**
- Check environment variables are set
- Verify `vercel.json` has correct framework
- Check build logs for errors

### Debugging Tools

```bash
# Check Supabase connection
# In browser console:
console.log(await supabase.auth.getSession())

# Check environment
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)

# View network requests
# Open DevTools → Network tab → Filter: "supabase"
```

## Code Quality

### Before Committing
- [ ] Code compiles without errors
- [ ] No console errors in browser
- [ ] Tested main user flows
- [ ] Removed debug console.logs
- [ ] Updated documentation if needed

### Git Commit Messages
```
Format: <type>: <description>

Examples:
feat: Add team balancing algorithm
fix: Resolve avatar loading issue
docs: Update setup instructions
refactor: Simplify rating component
chore: Update dependencies
```

## Deployment

### Pre-Deployment
1. Test locally thoroughly
2. Run migrations in Supabase prod
3. Update environment variables in Vercel
4. Update Discord/Supabase OAuth URLs

### Deployment Process
```bash
git push origin main
# Vercel auto-deploys
# Monitor: https://vercel.com/dashboard
```

### Post-Deployment
1. Visit production URL
2. Test authentication flow
3. Verify database queries work
4. Check all pages load correctly

## Getting Help

**Resources:**
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Tailwind Docs: https://tailwindcss.com/docs

**Project Files:**
- `README.md` - Project overview
- `SETUP.md` - Initial setup guide
- `ARCHITECTURE.md` - System design
- `.cursorrules` - AI assistant rules

