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
