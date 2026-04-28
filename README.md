# Nova Site

Astro static site for NOVA with Supabase-backed booking and manager views.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment example and fill in the Supabase values:

```bash
cp .env.example .env
```

3. Start the dev server:

```bash
npm run dev
```

## Vercel deployment

Import this repository into Vercel. The deployment settings are committed in `vercel.json`:

- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

Add these environment variables in Vercel for both Production and Preview:

- `SITE_URL`: the production URL, for example `https://nova-site.vercel.app`
- `PUBLIC_SUPABASE_URL`: your Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY`: your Supabase public anon key

Vercel also provides `VERCEL_PROJECT_PRODUCTION_URL`; if `SITE_URL` is missing, `astro.config.mjs` uses that value before falling back to `https://nova.local`.

## Supabase checklist

1. Run `supabase/migrations/0001_booking_core.sql` in the Supabase SQL editor or through the Supabase CLI.
2. In Supabase Auth, add the Vercel production URL and any preview/custom domains that should be allowed for redirects.
3. Create the manager user in Supabase Dashboard -> Authentication -> Users.
4. Add that user's auth UUID to `public.manager_users`.
5. Keep the `service_role` key out of frontend code and out of all `PUBLIC_*` variables.

Public users can read services and create bookings through the booking RPC. Manager actions require an authenticated user listed in `manager_users`.

## Pre-deploy check

Run:

```bash
npm run build
```

After the first Vercel deployment, test:

- `/`
- `/studio`
- `/vr`
- `/booking`
- `/admin/bookings`

Create a test booking and confirm it appears in Supabase. Also verify that the manager page only exposes the data intended by your Supabase RLS policies.
