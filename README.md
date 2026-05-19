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

## Docker deployment

The root `compose.yaml` builds the Astro site into static files and serves them with nginx.

Create a local `.env` file if you need production build variables:

```bash
SITE_URL=https://your-domain.example
SITE_PORT=8080
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

Then deploy or update:

```bash
git pull origin main
docker compose up -d --build --force-recreate
```

By default the site is exposed on host port `8080`. Set `SITE_PORT=80` in `.env` if the container should bind directly to port 80.

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

## VR pricing update

Run `supabase/migrations/0003_vr_pricing_services.sql` after the booking core migration to replace the old demo VR services with the current VR, PS5, NovaMix2, and birthday booking formats.

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

The booking bot lives in `booking-bot/`. Users enter the password once, then the bot forwards every new booking posted to its HTTP endpoint. When the booking payload includes the booking UUID, each Telegram notification includes Confirm and Cancel buttons that update the booking status in Supabase.

1. Create a Telegram bot through BotFather and copy its token.
2. Copy the bot env example:

```bash
cd booking-bot
cp .env.example .env
```

3. Fill `TELEGRAM_BOT_TOKEN`, `BOT_WEBHOOK_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. `BOT_PASSWORD` defaults to `0912`. Keep `SUPABASE_SERVICE_ROLE_KEY` only in the bot environment; never expose it through frontend or `PUBLIC_*` variables.
4. Start it:

```bash
npm start
```

Or run it with Docker:

```bash
cp authorized-chats.example.json authorized-chats.json
docker compose up -d --build
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
    "id": "00000000-0000-4000-8000-000000000000",
    "service_name": "VR 60 хв",
    "customer_name": "Олена",
    "customer_phone": "+380501112233",
    "party_size": 2,
    "start_at": "2026-05-12T15:00:00+03:00",
    "end_at": "2026-05-12T16:00:00+03:00",
    "comment": "Перший візит"
  }
}
```

The `record.id` field must be the UUID from `public.bookings.id`. If the payload has no booking ID, the bot still sends the notification but skips the action buttons because it cannot safely update the status.

For Supabase, create a Database Webhook on inserts into `public.bookings` and point it to the public URL of `/booking`. Add the same secret as the `X-Booking-Secret` header.
