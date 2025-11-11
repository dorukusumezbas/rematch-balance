# Database Migrations

This folder contains all database schema changes in chronological order.

## How to Use

1. **Run migrations in order** (001, 002, 003, etc.) in your Supabase SQL Editor
2. **Keep track** of which migrations you've applied
3. **Never modify** old migrations - always create new ones
4. **Test locally first** if you set up a dev database

## Migration History

| #   | File                              | Description                                             | Applied? |
| --- | --------------------------------- | ------------------------------------------------------- | -------- |
| 001 | `001_initial_schema.sql`          | Initial database setup with players, votes, and ratings | ✅       |
| 002 | `002_add_custom_names.sql`        | Add custom_name field to players table                  | ✅       |
| 003 | `003_add_vote_history.sql`        | Add vote_history table with automatic logging trigger   | ⏳       |
| 004 | `004_change_score_to_decimal.sql` | Change score from integer to decimal (0.25 granularity) | ⏳       |
| 005 | `005_fix_score_precision.sql`     | Fix score precision numeric(3,2) → numeric(4,2) for 10.00 support | ⏳       |
| 006 | `006_add_plays_rematch_and_admin.sql` | Add plays_rematch and is_admin flags with admin RLS policies | ⏳       |
| 007 | `007_update_view_for_rematch_filter.sql` | Update player_ratings view to include plays_rematch field | ⏳       |
| 008 | `008_allow_zero_scores.sql`       | Allow 0 as a valid score (0.0-10.0 range instead of 1.0-10.0) | ⏳       |
| 009 | `009_exclude_non_rematch_voters.sql` | Exclude non-rematch players' votes from average calculations | ⏳       |
| 010 | `010_fix_vote_history_rls.sql`    | Fix RLS policy to allow reading all vote history (not just own) | ⏳       |
| 011 | `011_create_sait_tcs.sql`         | Create sait_tcs table for TC (Town Center) ranking feature | ⏳       |
| 012 | `012_make_sait_tcs_shared.sql`    | Make sait_tcs a shared list (remove user_id, only admins can edit) | ⏳       |

## Creating New Migrations

When you need to change the database:

1. Create a new file: `00X_description.sql`
2. Write your SQL changes (ALTER TABLE, CREATE, etc.)
3. Add it to the table above
4. Run it in Supabase SQL Editor
5. Mark it as ✅ Applied
6. Commit to git

## Example Migration

```sql
-- 003_add_feature_x.sql
-- Description: Add feature X to the app

ALTER TABLE players ADD COLUMN new_field text;

-- Always check if things exist before creating
CREATE INDEX IF NOT EXISTS idx_players_new_field
ON players(new_field);
```

## Tips

- ✅ **DO**: Use `IF NOT EXISTS` and `IF EXISTS` for idempotency
- ✅ **DO**: Add comments explaining WHY, not just WHAT
- ✅ **DO**: Test migrations on a copy first
- ❌ **DON'T**: Modify old migrations after they're applied
- ❌ **DON'T**: Delete migrations from git history
