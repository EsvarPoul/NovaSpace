# NOVA Booking Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_booking_core.sql` in the SQL editor or through the Supabase CLI.
3. Copy `.env.example` to `.env` and fill:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
4. In Supabase Auth, make sure the Email provider is enabled.
5. Create the manager manually in Supabase Dashboard -> Authentication -> Users -> Add user, then set an email and password.
6. Copy that user's auth UUID and add it to `public.manager_users`:

```sql
insert into public.manager_users (user_id)
values ('00000000-0000-0000-0000-000000000000')
on conflict (user_id) do nothing;
```

Public users can read services and call the booking RPC. Manager board actions require an authenticated user listed in `manager_users`.
Do not put a `service_role` key in frontend code or in `PUBLIC_*` environment variables.
