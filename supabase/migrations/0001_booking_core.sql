create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null check (kind in ('vr', 'studio', 'equipment', 'staff', 'space')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  area text not null check (area in ('vr', 'studio', 'event')),
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  buffer_before_minutes integer not null default 0 check (buffer_before_minutes >= 0),
  buffer_after_minutes integer not null default 0 check (buffer_after_minutes >= 0),
  min_people integer not null default 1 check (min_people > 0),
  max_people integer not null default 1 check (max_people >= min_people),
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.service_resources (
  service_id uuid not null references public.services(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete restrict,
  primary key (service_id, resource_id)
);

create table if not exists public.business_hours (
  id bigint generated always as identity primary key,
  weekday integer not null check (weekday between 0 and 6),
  open_time time not null,
  close_time time not null,
  active boolean not null default true,
  check (open_time < close_time),
  unique (weekday, open_time, close_time)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete restrict,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  party_size integer not null check (party_size > 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  comment text,
  manager_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_at < end_at)
);

create table if not exists public.booking_resources (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete restrict,
  primary key (booking_id, resource_id)
);

create table if not exists public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table if not exists public.manager_users (
  user_id uuid primary key,
  created_at timestamptz not null default now()
);

create index if not exists bookings_time_idx on public.bookings using gist (tstzrange(start_at, end_at, '[)'));
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists booking_resources_resource_idx on public.booking_resources(resource_id);
create index if not exists blocked_times_range_idx on public.blocked_times using gist (tstzrange(starts_at, ends_at, '[)'));
create index if not exists blocked_times_resource_idx on public.blocked_times(resource_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_touch_updated_at on public.bookings;
create trigger bookings_touch_updated_at
before update on public.bookings
for each row execute function public.touch_updated_at();

create or replace function public.is_booking_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.manager_users manager_users
    where manager_users.user_id = auth.uid()
  );
$$;

create or replace function public.required_resource_ids(p_service_id uuid)
returns table(resource_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select service_resources.resource_id
  from public.service_resources service_resources
  join public.resources resources on resources.id = service_resources.resource_id
  where service_resources.service_id = p_service_id
    and resources.active = true
  order by service_resources.resource_id;
$$;

create or replace function public.get_available_slots(
  p_service_slug text,
  p_date date,
  p_party_size integer default null,
  p_step_minutes integer default 30
)
returns table(slot_start timestamptz, slot_end timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_service public.services%rowtype;
  v_hours public.business_hours%rowtype;
  v_slot_local timestamp;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_buffered_start timestamptz;
  v_buffered_end timestamptz;
begin
  select *
    into v_service
  from public.services
  where slug = p_service_slug
    and active = true;

  if not found then
    raise exception 'Unknown or inactive service: %', p_service_slug using errcode = 'P0001';
  end if;

  if p_party_size is not null and (p_party_size < v_service.min_people or p_party_size > v_service.max_people) then
    return;
  end if;

  if p_date < (now() at time zone 'Europe/Kyiv')::date then
    return;
  end if;

  for v_hours in
    select *
    from public.business_hours
    where weekday = extract(dow from p_date)::integer
      and active = true
    order by open_time
  loop
    for v_slot_local in
      select generate_series(
        p_date::timestamp + v_hours.open_time,
        p_date::timestamp + v_hours.close_time - make_interval(mins => v_service.duration_minutes),
        make_interval(mins => greatest(p_step_minutes, 5))
      )
    loop
      v_slot_start := v_slot_local at time zone 'Europe/Kyiv';
      v_slot_end := v_slot_start + make_interval(mins => v_service.duration_minutes);
      v_buffered_start := v_slot_start - make_interval(mins => v_service.buffer_before_minutes);
      v_buffered_end := v_slot_end + make_interval(mins => v_service.buffer_after_minutes);

      if not exists (
        select 1
        from public.required_resource_ids(v_service.id) needed
        where exists (
          select 1
          from public.booking_resources booking_resources
          join public.bookings bookings on bookings.id = booking_resources.booking_id
          join public.services existing_service on existing_service.id = bookings.service_id
          where booking_resources.resource_id = needed.resource_id
            and bookings.status in ('pending', 'confirmed')
            and tstzrange(
              bookings.start_at - make_interval(mins => existing_service.buffer_before_minutes),
              bookings.end_at + make_interval(mins => existing_service.buffer_after_minutes),
              '[)'
            ) && tstzrange(v_buffered_start, v_buffered_end, '[)')
        )
      )
      and not exists (
        select 1
        from public.blocked_times blocked_times
        where (blocked_times.resource_id is null or blocked_times.resource_id in (
          select needed.resource_id from public.required_resource_ids(v_service.id) needed
        ))
          and tstzrange(blocked_times.starts_at, blocked_times.ends_at, '[)') && tstzrange(v_buffered_start, v_buffered_end, '[)')
      ) then
        slot_start := v_slot_start;
        slot_end := v_slot_end;
        return next;
      end if;
    end loop;
  end loop;
end;
$$;

create or replace function public.create_pending_booking(
  p_service_slug text,
  p_start_at timestamptz,
  p_customer_name text,
  p_customer_phone text,
  p_party_size integer,
  p_customer_email text default null,
  p_comment text default null
)
returns public.bookings
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_service public.services%rowtype;
  v_booking public.bookings%rowtype;
  v_resource_id uuid;
  v_end_at timestamptz;
  v_buffered_start timestamptz;
  v_buffered_end timestamptz;
begin
  select *
    into v_service
  from public.services
  where slug = p_service_slug
    and active = true;

  if not found then
    raise exception 'Unknown or inactive service: %', p_service_slug using errcode = 'P0001';
  end if;

  if p_party_size < v_service.min_people or p_party_size > v_service.max_people then
    raise exception 'Party size is outside service limits' using errcode = 'P0001';
  end if;

  if length(trim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'Customer name is required' using errcode = 'P0001';
  end if;

  if length(regexp_replace(coalesce(p_customer_phone, ''), '[^0-9+]', '', 'g')) < 7 then
    raise exception 'Customer phone is required' using errcode = 'P0001';
  end if;

  v_end_at := p_start_at + make_interval(mins => v_service.duration_minutes);
  v_buffered_start := p_start_at - make_interval(mins => v_service.buffer_before_minutes);
  v_buffered_end := v_end_at + make_interval(mins => v_service.buffer_after_minutes);

  if p_start_at < now() then
    raise exception 'Cannot create a booking in the past' using errcode = 'P0001';
  end if;

  for v_resource_id in
    select needed.resource_id
    from public.required_resource_ids(v_service.id) needed
    order by needed.resource_id
  loop
    perform pg_advisory_xact_lock(hashtext(v_resource_id::text));
  end loop;

  if exists (
    select 1
    from public.required_resource_ids(v_service.id) needed
    where exists (
      select 1
      from public.booking_resources booking_resources
      join public.bookings bookings on bookings.id = booking_resources.booking_id
      join public.services existing_service on existing_service.id = bookings.service_id
      where booking_resources.resource_id = needed.resource_id
        and bookings.status in ('pending', 'confirmed')
        and tstzrange(
          bookings.start_at - make_interval(mins => existing_service.buffer_before_minutes),
          bookings.end_at + make_interval(mins => existing_service.buffer_after_minutes),
          '[)'
        ) && tstzrange(v_buffered_start, v_buffered_end, '[)')
    )
  ) then
    raise exception 'Selected slot is no longer available' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.blocked_times blocked_times
    where (blocked_times.resource_id is null or blocked_times.resource_id in (
      select needed.resource_id from public.required_resource_ids(v_service.id) needed
    ))
      and tstzrange(blocked_times.starts_at, blocked_times.ends_at, '[)') && tstzrange(v_buffered_start, v_buffered_end, '[)')
  ) then
    raise exception 'Selected slot is blocked by manager' using errcode = 'P0001';
  end if;

  insert into public.bookings (
    service_id,
    customer_name,
    customer_phone,
    customer_email,
    party_size,
    start_at,
    end_at,
    status,
    comment
  )
  values (
    v_service.id,
    trim(p_customer_name),
    trim(p_customer_phone),
    nullif(trim(coalesce(p_customer_email, '')), ''),
    p_party_size,
    p_start_at,
    v_end_at,
    'pending',
    nullif(trim(coalesce(p_comment, '')), '')
  )
  returning * into v_booking;

  insert into public.booking_resources (booking_id, resource_id)
  select v_booking.id, needed.resource_id
  from public.required_resource_ids(v_service.id) needed;

  return v_booking;
end;
$$;

create or replace function public.list_booking_board(p_from timestamptz, p_to timestamptz)
returns table(
  id uuid,
  service_name text,
  service_slug text,
  area text,
  customer_name text,
  customer_phone text,
  customer_email text,
  party_size integer,
  start_at timestamptz,
  end_at timestamptz,
  status text,
  comment text,
  manager_note text,
  resource_names text[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_booking_manager() then
    raise exception 'Manager access required' using errcode = '42501';
  end if;

  return query
  select
    bookings.id,
    services.name,
    services.slug,
    services.area,
    bookings.customer_name,
    bookings.customer_phone,
    bookings.customer_email,
    bookings.party_size,
    bookings.start_at,
    bookings.end_at,
    bookings.status,
    bookings.comment,
    bookings.manager_note,
    array_agg(resources.name order by resources.name)
  from public.bookings bookings
  join public.services services on services.id = bookings.service_id
  left join public.booking_resources booking_resources on booking_resources.booking_id = bookings.id
  left join public.resources resources on resources.id = booking_resources.resource_id
  where bookings.start_at < p_to
    and bookings.end_at > p_from
  group by bookings.id, services.id
  order by bookings.start_at, bookings.created_at;
end;
$$;

create or replace function public.update_booking_status(
  p_booking_id uuid,
  p_status text,
  p_manager_note text default null
)
returns public.bookings
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  if not public.is_booking_manager() then
    raise exception 'Manager access required' using errcode = '42501';
  end if;

  if p_status not in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show') then
    raise exception 'Unsupported booking status: %', p_status using errcode = 'P0001';
  end if;

  update public.bookings
  set status = p_status,
      manager_note = coalesce(nullif(trim(coalesce(p_manager_note, '')), ''), manager_note)
  where id = p_booking_id
  returning * into v_booking;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0001';
  end if;

  return v_booking;
end;
$$;

create or replace function public.add_blocked_time(
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_reason text default null,
  p_resource_slug text default null
)
returns public.blocked_times
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_resource_id uuid;
  v_block public.blocked_times%rowtype;
begin
  if not public.is_booking_manager() then
    raise exception 'Manager access required' using errcode = '42501';
  end if;

  if p_starts_at >= p_ends_at then
    raise exception 'Block start must be before end' using errcode = 'P0001';
  end if;

  if p_resource_slug is not null and length(trim(p_resource_slug)) > 0 then
    select id into v_resource_id
    from public.resources
    where slug = p_resource_slug;

    if not found then
      raise exception 'Unknown resource: %', p_resource_slug using errcode = 'P0001';
    end if;
  end if;

  insert into public.blocked_times(resource_id, starts_at, ends_at, reason)
  values (v_resource_id, p_starts_at, p_ends_at, nullif(trim(coalesce(p_reason, '')), ''))
  returning * into v_block;

  return v_block;
end;
$$;

alter table public.resources enable row level security;
alter table public.services enable row level security;
alter table public.service_resources enable row level security;
alter table public.business_hours enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_resources enable row level security;
alter table public.blocked_times enable row level security;
alter table public.manager_users enable row level security;

drop policy if exists "Public can read active resources" on public.resources;
create policy "Public can read active resources"
on public.resources for select
using (active = true);

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services"
on public.services for select
using (active = true);

drop policy if exists "Public can read service resources" on public.service_resources;
create policy "Public can read service resources"
on public.service_resources for select
using (true);

drop policy if exists "Public can read business hours" on public.business_hours;
create policy "Public can read business hours"
on public.business_hours for select
using (active = true);

drop policy if exists "Managers can read bookings" on public.bookings;
create policy "Managers can read bookings"
on public.bookings for select
using (public.is_booking_manager());

drop policy if exists "Managers can read booking resources" on public.booking_resources;
create policy "Managers can read booking resources"
on public.booking_resources for select
using (public.is_booking_manager());

drop policy if exists "Managers can read blocked times" on public.blocked_times;
create policy "Managers can read blocked times"
on public.blocked_times for select
using (public.is_booking_manager());

drop policy if exists "Managers can read manager users" on public.manager_users;
create policy "Managers can read manager users"
on public.manager_users for select
using (public.is_booking_manager());

grant usage on schema public to anon, authenticated;
grant select on public.resources, public.services, public.service_resources, public.business_hours to anon, authenticated;
grant execute on function public.get_available_slots(text, date, integer, integer) to anon, authenticated;
grant execute on function public.create_pending_booking(text, timestamptz, text, text, integer, text, text) to anon, authenticated;
grant execute on function public.list_booking_board(timestamptz, timestamptz) to authenticated;
grant execute on function public.update_booking_status(uuid, text, text) to authenticated;
grant execute on function public.add_blocked_time(timestamptz, timestamptz, text, text) to authenticated;

insert into public.resources (slug, name, kind) values
  ('vr-room', 'VR room', 'space'),
  ('vr-stations', 'VR stations', 'equipment'),
  ('studio-room', 'Photo studio', 'studio'),
  ('studio-light', 'Studio lighting kit', 'equipment'),
  ('nova-host', 'Nova host', 'staff')
on conflict (slug) do update set
  name = excluded.name,
  kind = excluded.kind,
  active = true;

insert into public.services (
  slug,
  name,
  area,
  description,
  duration_minutes,
  buffer_before_minutes,
  buffer_after_minutes,
  min_people,
  max_people,
  sort_order
) values
  ('vr-first-dive', 'VR First Dive', 'vr', 'Intro VR session for a small group.', 60, 10, 15, 1, 2, 10),
  ('vr-squad', 'VR Squad', 'vr', 'Team VR session for friends or small events.', 75, 10, 15, 3, 6, 20),
  ('vr-event', 'VR Event', 'event', 'Longer birthday, corporate, or private VR format.', 150, 20, 30, 4, 12, 30),
  ('studio-rent', 'Оренда студії · 600 грн./год.', 'studio', 'Studio rental from one hour. Photographer is paid separately when needed.', 60, 15, 15, 1, 5, 40)
on conflict (slug) do update set
  name = excluded.name,
  area = excluded.area,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  buffer_before_minutes = excluded.buffer_before_minutes,
  buffer_after_minutes = excluded.buffer_after_minutes,
  min_people = excluded.min_people,
  max_people = excluded.max_people,
  sort_order = excluded.sort_order,
  active = true;

update public.services
set active = false
where slug in ('studio-light', 'studio-story', 'studio-brand');

insert into public.service_resources (service_id, resource_id)
select services.id, resources.id
from public.services services
join public.resources resources on resources.slug in ('vr-room', 'vr-stations', 'nova-host')
where services.slug in ('vr-first-dive', 'vr-squad', 'vr-event')
on conflict do nothing;

insert into public.service_resources (service_id, resource_id)
select services.id, resources.id
from public.services services
join public.resources resources on resources.slug in ('studio-room', 'studio-light')
where services.slug = 'studio-rent'
on conflict do nothing;

insert into public.business_hours (weekday, open_time, close_time, active)
select weekday, time '10:00', time '21:00', true
from generate_series(0, 6) as weekday
on conflict (weekday, open_time, close_time) do update set active = true;
