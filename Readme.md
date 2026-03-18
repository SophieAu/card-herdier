# 🐶 Card Herdier

My personal Pokémon Card tracker. Checks an API, compares to the DB and then sends me an email

## What It Does

1. Runs daily at 7:00 AM (via Deno Cron)
2. Fetches your list of tracked Pokémon from the database
3. Queries the Pokémon TCG API (https://tcgdex.dev) for all cards featuring those Pokémon
4. Filters out cards you've already seen
5. Filters out TCG Pocket exclusive sets
6. Saves new cards to the database
7. Sends you an email with details about the new releases

## Prerequisites

- [Deno](https://deno.land/) installed
- A [Neon](https://neon.tech/) database (PostgreSQL)
- A [Resend](https://resend.com/) account for sending emails
- An [Axiom](https://axiom.co/) account for logging (optional but recommended)


## Environment Variables

Create a `.env` file (or set these in your deployment platform):

```bash
PGHOST=your_neon_database_connection_string
PGDATABASE=
PGUSER=
PGPASSWORD=

RESEND_API_KEY=your_resend_api_key
EMAIL_RECIPIENT=your_email@example.com

AXIOM_TOKEN=your_axiom_api_token  # Optional but recommended

IS_PRODUCTION=true  # Set only in production timeline to prevent double cron runs
```

**Note:** Deno Deploy runs crons on both production and preview timelines. The `IS_PRODUCTION` env var ensures the cron only executes in production to avoid duplicate emails and database writes.

## Database Setup

The project uses Drizzle ORM with Neon PostgreSQL.

### Sync Database Schema

The project uses `drizzle-kit pull` to introspect your Neon database and generate the schema:

```bash
deno task db-gen
```

**Note:** After running `db-gen`, you'll need to manually find-replace `mode: 'string'` with `mode: 'date'` in the generated schema file for timestamp fields. This allows you to use JavaScript `Date` objects instead of ISO strings.

### Database Tables

The required tables are:
- `tracked_pokemon` - List of Pokémon you want to track
- `pokemon_cards` - Cards you've already been notified about
- `notification_email_log` - Log of email attempts (success/failure tracking)

### Add Pokémon to Track

You'll need to manually add Pokémon to the `tracked_pokemon` table. Connect to your Neon database and insert records:

```sql
INSERT INTO tracked_pokemon (name) VALUES
  ('squirtle'),
  ('mareep'),
  ('wooloo'),
  ('miltank');
```

or just add new pokemon through the Neon UI

## Local Development

### Run Once (Test)

Call the handler funtion directly in `main.ts` and then run

```bash
deno task dev
```

This will run the check immediately instead of waiting for the cron schedule. Note: the cron schedule won't trigger locally, only the handler function runs.

**Other available tasks:**

```bash
deno task lint         # Run linter
deno task format       # Format code
deno task typecheck    # Type-check TypeScript files
deno task db-gen       # Sync database schema from Neon
```

## Deployment

The app is designed to run on [Deno Deploy](https://deno.com/deploy):

1. Push your code to GitHub
2. Create a new Deno Deploy project
3. Link it to your repository
4. Add your environment variables in the Deno Deploy dashboard:
   - Add `IS_PRODUCTION=true` **only to the production timeline** (not preview)
   - Add all other env vars to both timelines
5. Deploy!

The cron job will run automatically on the schedule.

**Important Notes:**
- Deno Deploy requires a `Deno.serve()` call even for cron-only apps (the code includes a minimal server for this)
- The free tier has limited memory-time quota - add a payment card to get 100x limits (still free unless you exceed them)
- Logs are retained for 1 year on the new Deno Deploy platform
- If you encounter phantom billing issues, try deleting and recreating your Deno Deploy account

## Project Structure

```
card-herdier/
├── src/
│   ├── main.ts           # Cron job entry point
│   ├── handler.ts        # Main business logic
│   ├── types.ts          # TypeScript type definitions
│   └── adapters/
│       ├── api.ts        # Pokémon TCG API client
│       ├── db.ts         # Neon database queries (Drizzle)
│       ├── email.ts      # Resend email client
│       └── logging.ts    # Logger setup
├── drizzle/              # Database migrations
├── deno.json             # Deno configuration & tasks
└── drizzle.config.ts     # Drizzle ORM configuration
```

## Monitoring

Logs are available in both Axiom (30 day retention) and Deno Deploy (1 year retention).

**Email Logging:**
All email send attempts (success and failure) are logged to the `notification_email_log` table in your database with timestamps and email body content for debugging.

## Troubleshooting

**Not receiving emails?**
- Check your Resend API key is valid
- Verify `EMAIL_RECIPIENT` is set correctly
- Check logs (Axiom or Deno Deploy) for email errors
- Check the `notification_email_log` table in your database for failed attempts

**No cards being found?**
- Make sure you've added Pokémon to the `tracked_pokemon` table
- Check that the Pokémon names match the API's naming. The API is using English names.

**Database errors?**
- Confirm your `DATABASE_URL` is correct
- Check that your Neon database is active (free tier has limits)
- Verify the schema is up to date (run `deno task db-gen`)

**Cron not running?**
- Verify `IS_PRODUCTION=true` is set in production timeline
- Check Deno Deploy's cron dashboard to see scheduled runs
- Use cron string syntax `"0 7 * * *"` instead of object syntax for more reliable scheduling
- Check if Deno Deploy had any service outages

**Logs not appearing in Axiom?**
- Verify `AXIOM_TOKEN` is set correctly
- Check that the dataset name matches in both code and Axiom dashboard
- Axiom ingestion might have a slight delay (refresh after a minute)

## Monthly Maintenance

To keep Card Herdier running smoothly, perform these checks monthly:

**Functionality & Monitoring:**

- [ ] Check Axiom dashboard - has the cron run successfully each day? (you should have gotten an email if not)
- [ ] Check `notification_email_log` table - any failed email sends?
- [ ] Verify you're receiving emails when new cards release
- [ ] Check Deno Deploy dashboard - any errors or warnings?

**Dependencies & Updates:**

- [ ] Run `deno outdated` to check for package updates
- [ ] Review security advisories: `deno task lint` (and ignore the drizzle sql error. it's auto-gen)
- [ ] Update dependencies if needed (test locally first!)

**Infrastructure:**

- [ ] Check Deno Deploy memory usage - are you approaching limits?
- [ ] Verify Neon database usage/storage limits (free tier)
- [ ] Check Resend email quota usage
- [ ] Verify Axiom log retention and quota

**Optional:**

- [ ] Test the cron manually: `deno task dev`
- [ ] Review and update this README if anything changed
- [ ] Check for any Deno Deploy platform updates or breaking changes

## Notes

- Deno Deploy (new platform) keeps logs for 1 year, but Axiom provides better querying and monitoring
- New cards are only saved once - you won't get duplicate notifications
- TCG Pocket exclusive sets are filtered out automatically
- If database insertion fails, you'll get a warning in the email but the job will continue
- Email send attempts (both success and failure) are logged to the database
- The cron runs in production timeline only to prevent double executions

## Why "Card Herdier"?

Because Herdier is a good dog and this app herds cards. Obviously. 🐶
