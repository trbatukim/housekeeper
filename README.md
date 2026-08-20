# HouseKeeper

A shared household management app. Create or join a household with your roommates and keep track of groceries, expenses, laundry, and dishes together, with optional push notifications when a laundry or dishwasher cycle finishes.

## Features

- **Accounts & households** — sign up, log in, create a household or join one with its ID, and manage members from a shared sidebar.
- **Household themes** — pick a primary color per household to personalize its pages.
- **Groceries** — add, check off, and clear a shared shopping list.
- **Expenses** — log one-time or recurring costs with an amount, category, and paid-on date; recurring expenses roll over automatically.
- **Laundry** — start a load with an expected end time and track its status.
- **Dishes** — track sink/dishwasher status and run a dishwasher cycle with an end time.
- **Notifications** — subscribe to a household's [ntfy.sh](https://ntfy.sh) topic to get notified when laundry or dishwasher cycles finish.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) with React 19 and TypeScript
- [Supabase](https://supabase.com) for auth and Postgres data
- [Vitest](https://vitest.dev) + Testing Library for tests

## Getting started

### Prerequisites

- Node.js
- A [Supabase](https://supabase.com) project

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root with your Supabase project credentials:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```

3. Apply the database schema to your Supabase project by running [`supabase/schema.sql`](supabase/schema.sql) in the SQL Editor (or via `supabase db push` if you're using the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)). It sets up all tables, row-level security policies, and functions the app depends on.

4. Start the dev server:

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

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
