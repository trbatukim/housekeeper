# HouseKeeper

A shared household management app. Create or join a household with your roommates and keep track of groceries, expenses, meals, laundry, and dishes together, with push notifications and iPhone live activities when a laundry or dishwasher cycle finishes.

## Features

- **Accounts & households**: Sign up, log in, create a household or join one with its ID, rename it, and manage members from a shared sidebar.
- **Household themes**: Pick a primary color per household to personalize its pages.
- **Groceries**: Add items with an amount and unit, edit them, check them off, and clear either the whole list or just the checked items.
- **Expenses**: Log one-time or recurring costs with an amount, category, and paid-on date; edit them later, and recurring ones roll over automatically.
- **Meal planner**: Keep a library of the household's meals, give each one its ingredients with amounts and units (picking from ingredients the household already saved, or adding new ones with a custom unit), and plan meals onto the days of the week. Tick the ingredients of any meal to push them straight onto the grocery list, skipping anything that is already there.
- **Laundry**: Start a load with an expected end time and track its status.
- **Dishes**: Track sink/dishwasher status and run a dishwasher cycle with an end time.
- **Notifications**: Subscribe to a household's [ntfy.sh](https://ntfy.sh) topic to get notified when laundry or dishwasher cycles finish or when your housemates decide to remind you of groceries and expenses.
- **Live activities**: Save a [PushWard](https://pushward.app) integration key to get a running countdown on your iPhone's Lock Screen and Dynamic Island while a laundry load or dishwasher cycle is going. Keys are per person, so starting a cycle pushes an activity to every member of the household who has saved one, and the activity ends when the cycle finishes or is cleared. Keys are stored encrypted with AES-256-GCM and can be removed again from the in-app info page.
- **API**: Generate an API key per household from the settings page, then start a laundry load or dishwasher cycle, add a grocery item, or log an expense from anything that can send an HTTP request. Keys are stored as SHA-256 hashes and shown only once, generating a new one replaces the old, and a key stops working if its owner leaves the household.
- **Installable**: Ships a web app manifest and icons, so it can be installed from the browser and run as a standalone app on desktop or mobile.
- **Demo mode**: Click "Explore Demo" on the welcome page to drop into a pre-filled household with no signup, powered by a throwaway Supabase anonymous account. Sign up from inside the demo to keep the data on a real account.
- **Feedback**: A feedback button on every page for reporting bugs or ideas straight from the app.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) with React 19 and TypeScript
- [Supabase](https://supabase.com) for auth and Postgres data
- [Tailwind CSS](https://tailwindcss.com) v4
- [Vitest](https://vitest.dev) + Testing Library for tests
- [ntfy.sh](https://ntfy.sh) for push notifications and [PushWard](https://pushward.app) for iOS live activities
- [Redoc](https://redocly.com) on GitHub Pages for the API reference

## Getting started

### Prerequisites

- Node.js
- A [Supabase](https://supabase.com) project

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   PUSHWARD_ENCRYPTION_KEY=
   ```

   The first three come from your Supabase project settings. `SUPABASE_SERVICE_ROLE_KEY` is used server-side only, to look up the PushWard keys of everyone in a household without going through row-level security, so keep it out of the browser and out of version control.

   `PUSHWARD_ENCRYPTION_KEY` is the key the app encrypts stored PushWard keys with. It has to be 32 bytes of hex:

   ```bash
   openssl rand -hex 32
   ```

   All four are required. The last two only matter for live activities, but the laundry and dishes pages import that code, so the pages will fail if they are unset.

3. Apply the database schema to your Supabase project by running [`supabase/schema.sql`](supabase/schema.sql) in the SQL Editor (or via `supabase db push` if you're using the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)). It sets up all tables, row-level security policies, and functions the app depends on.

4. In the Supabase dashboard, go to **Authentication → Sign In / Providers** and turn on **Allow anonymous sign-ins**. This is what powers demo mode; without it, the "Explore Demo" button will fail.

5. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database

The Postgres schema (tables, RLS policies, functions, grants) lives in [`supabase/schema.sql`](supabase/schema.sql). It's a schema-only dump from the linked Supabase project, generated with:

```bash
npx supabase db dump -f supabase/schema.sql
```

Re-run that command after making schema changes to keep the file in sync.

## API

Every endpoint takes an API key as a bearer token. Generate one per household from the settings page.

```bash
curl -X POST https://housekeeper-tan.vercel.app/api/laundry \
  -H "Authorization: Bearer $HOUSEKEEPER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"hours": 1, "minutes": 30}'
```

| Endpoint | Body |
| --- | --- |
| `POST /api/laundry` | `hours` and `minutes`, both optional, defaulting to a 2 hour cycle |
| `GET /api/laundry` | None |
| `DELETE /api/laundry` | `id` |
| `POST /api/dishwasher` | `hours` and `minutes`, both optional, defaulting to a 2 hour cycle |
| `GET /api/dishwasher` | None |
| `DELETE /api/dishwasher` | `id` |
| `POST /api/groceries` | `name`, `amount`, `amount_type` |
| `GET /api/groceries` | None |
| `PUT /api/groceries` | `id`, plus at least one of `name`, `amount`, `amount_type` |
| `DELETE /api/groceries` | `name` or `id` |
| `POST /api/expenses` | `description`, `amount`, `currency`, `type`, and `due_date` as `dd.mm.yyyy` |
| `GET /api/expenses` | None |
| `PUT /api/expenses` | `id`, plus at least one of `description`, `amount`, `currency`, `type`, `due_date` |
| `DELETE /api/expenses` | `description` or `id` |

`GET` returns every row for the key's household.

The full reference, with every validation rule and error response, is published at [trbatukim.github.io/housekeeper](https://trbatukim.github.io/housekeeper) from [`docs/openapi.yaml`](docs/openapi.yaml). Update that spec in the same commit as any route change to keep the two in sync.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Contributors

[![Contributors](https://contrib.rocks/image?repo=trbatukim/housekeeper)](https://github.com/trbatukim/housekeeper/graphs/contributors)

## License

See [LICENSE](LICENSE).
