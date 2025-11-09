# Testing Guide

## Creating Test Data

Since you need multiple players to test features but your friends aren't actively using the app during development, you can seed fake test data.

### Quick Start

1. **Add Test Players:**
   - Go to Supabase → SQL Editor
   - Run `supabase/seed-test-data.sql`
   - Creates 8 fake players with ~30 votes

2. **Test Your Features:**
   - Test players will appear in scoreboard, votes matrix, etc.
   - You can rate them from your real account
   - They can't sign in (no auth records)

3. **Clean Up:**
   - When done testing, run `supabase/cleanup-test-data.sql`
   - Removes all test players and their votes

### Test Players Created

| Name | Custom Name | Sample Score |
|------|-------------|--------------|
| Alice | Pro Alice | ~8.5 |
| Bob | - | ~8.0 |
| Charlie | Chuck | ~7.0 |
| Diana | - | ~7.5 |
| Eve | E-Money | ~7.8 |
| Frank | - | ~6.5 |
| Grace | Amazing Grace | ~8.2 |
| Henry | - | ~7.0 |

### What Gets Created

- **8 fake players** in the `players` table
- **~30 votes** between them (realistic distribution)
- **Scores ranging from 5.5 to 9.75** (uses decimal values)
- **Some with custom names**, some without (tests both cases)

### Benefits

✅ Quick setup (one SQL command)  
✅ Realistic data distribution  
✅ Tests decimal scoring  
✅ Tests custom names  
✅ Easy cleanup  
✅ Repeatable (can re-run anytime)  

### Limitations

⚠️ Test players can't sign in (no auth.users records)  
⚠️ You can't vote AS them (only your real account can vote)  
⚠️ They won't show in vote history (no real actions)  

## Alternative: Multiple Discord Accounts

If you need to test the full auth flow or vote AS different users:

1. Create multiple Discord accounts
2. Use different browsers/incognito windows
3. Sign in with each account
4. More realistic but more tedious

## Testing Checklist

When testing with fake data:

- [ ] Scoreboard displays all 8 players
- [ ] Votes matrix shows the vote grid
- [ ] Average scores calculate correctly
- [ ] Sorting works properly
- [ ] Custom names display correctly
- [ ] Your real account can vote for test players
- [ ] Color coding works (green/blue/yellow/orange)
- [ ] Decimal scores display properly (7.25, 8.50, etc.)

## Production Safety

⚠️ **NEVER run seed script in production!**

The seed script uses fake UUIDs that won't match real auth.users records. Only use this in:
- Local development
- Development Supabase project
- Test environments

For production, you need real Discord users signing in.

