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

## VR games CMS

Run `supabase/migrations/0002_vr_games_cms.sql` after the booking core migration to add:

- `public.vr_games` for the `/vr` games catalog
- the public `vr-game-previews` Storage bucket
- manager-only write policies for game rows and preview uploads

Managers can edit the catalog at `/admin/vr-games` with the same Supabase Auth user used for `/admin/bookings`.

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

## Telegram booking bot

The quick notification bot lives in `booking-bot/`. It has no manager actions: users enter the password once, then the bot forwards every new booking posted to its HTTP endpoint.

1. Create a Telegram bot through BotFather and copy its token.
2. Copy the bot env example:

```bash
cd booking-bot
cp .env.example .env
```

3. Fill `TELEGRAM_BOT_TOKEN` and `BOT_WEBHOOK_SECRET`. `BOT_PASSWORD` defaults to `0912`.
4. Start it:

```bash
npm start
```

5. In Telegram, open the bot, send `/start`, then enter `0912`.
6. Send new bookings to:

```bash
POST http://localhost:8787/booking
X-Booking-Secret: your_secret
Content-Type: application/json
```

Example body:

```json
{
  "record": {
    "service_name": "VR Squad",
    "customer_name": "Олена",
    "customer_phone": "+380501112233",
    "party_size": 4,
    "start_at": "2026-05-12T15:00:00+03:00",
    "end_at": "2026-05-12T16:15:00+03:00",
    "comment": "День народження"
  }
}
```

For Supabase, create a Database Webhook on inserts into `public.bookings` and point it to the public URL of `/booking`. Add the same secret as the `X-Booking-Secret` header.
