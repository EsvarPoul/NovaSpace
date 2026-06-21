alter table public.resources
  add column if not exists capacity integer not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'resources_capacity_positive'
      and conrelid = 'public.resources'::regclass
  ) then
    alter table public.resources
      add constraint resources_capacity_positive check (capacity > 0);
  end if;
end;
$$;

alter table public.service_resources
  add column if not exists capacity_usage text not null default 'booking';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'service_resources_capacity_usage_check'
      and conrelid = 'public.service_resources'::regclass
  ) then
    alter table public.service_resources
      add constraint service_resources_capacity_usage_check
      check (capacity_usage in ('booking', 'party_size', 'exclusive'));
  end if;
end;
$$;

update public.resources
set capacity = case slug
  when 'vr-room' then 6
  when 'vr-stations' then 6
  when 'nova-host' then 6
  else 1
end
where slug in (
  'vr-room',
  'vr-stations',
  'nova-host',
  'ps5-console',
  'studio-room',
  'studio-light'
);

update public.service_resources
set capacity_usage = 'booking';

update public.service_resources service_resources
set capacity_usage = 'party_size'
from public.services services,
     public.resources resources
where service_resources.service_id = services.id
  and service_resources.resource_id = resources.id
  and services.slug in ('vr-first-dive', 'vr-squad', 'vr-30', 'vr-60', 'vr-90')
  and resources.slug in ('vr-room', 'vr-stations', 'nova-host');

update public.service_resources service_resources
set capacity_usage = 'party_size'
from public.services services,
     public.resources resources
where service_resources.service_id = services.id
  and service_resources.resource_id = resources.id
  and services.slug in ('ps5-60-1', 'ps5-60-2', 'ps5-120-1', 'ps5-120-2')
  and resources.slug = 'vr-room';

update public.service_resources service_resources
set capacity_usage = 'party_size'
from public.services services,
     public.resources resources
where service_resources.service_id = services.id
  and service_resources.resource_id = resources.id
  and services.slug = 'novamix2-60'
  and resources.slug in ('vr-room', 'vr-stations');

update public.service_resources service_resources
set capacity_usage = 'exclusive'
from public.services services
where service_resources.service_id = services.id
  and services.slug in ('vr-event', 'birthday-3h');

create or replace function public.booking_resource_units(
  p_capacity_usage text,
  p_capacity integer,
  p_party_size integer
)
returns integer
language sql
immutable
as $$
  select case p_capacity_usage
    when 'exclusive' then greatest(coalesce(p_capacity, 1), 1)
    when 'party_size' then greatest(coalesce(p_party_size, 1), 1)
    else 1
  end;
$$;

drop function if exists public.get_available_slots(text, date, integer, integer);

create or replace function public.get_available_slots(
  p_service_slug text,
  p_date date,
  p_party_size integer default null,
  p_step_minutes integer default 30
)
returns table(
  slot_start timestamptz,
  slot_end timestamptz,
  available_places integer,
  total_places integer
)
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
  v_requested_party_size integer;
  v_available_places integer;
  v_total_places integer;
  v_has_capacity boolean;
begin
  select *
    into v_service
  from public.services
  where slug = p_service_slug
    and active = true;

  if not found then
    raise exception 'Unknown or inactive service: %', p_service_slug using errcode = 'P0001';
  end if;

  v_requested_party_size := coalesce(p_party_size, v_service.min_people);

  if v_requested_party_size < v_service.min_people or v_requested_party_size > v_service.max_people then
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

      if exists (
        select 1
        from public.blocked_times blocked_times
        where (blocked_times.resource_id is null or blocked_times.resource_id in (
          select service_resources.resource_id
          from public.service_resources service_resources
          join public.resources resources on resources.id = service_resources.resource_id
          where service_resources.service_id = v_service.id
            and resources.active = true
        ))
          and tstzrange(blocked_times.starts_at, blocked_times.ends_at, '[)') && tstzrange(v_buffered_start, v_buffered_end, '[)')
      ) then
        continue;
      end if;

      select
        coalesce(
          min(resources.capacity) filter (where service_resources.capacity_usage = 'party_size'),
          min(resources.capacity),
          0
        ),
        coalesce(
          min(resources.capacity - coalesce(used_resource.used_units, 0)) filter (where service_resources.capacity_usage = 'party_size'),
          min(resources.capacity - coalesce(used_resource.used_units, 0)),
          0
        ),
        coalesce(
          bool_and(
            resources.capacity - coalesce(used_resource.used_units, 0) >= public.booking_resource_units(
              service_resources.capacity_usage,
              resources.capacity,
              v_requested_party_size
            )
          ),
          false
        )
      into v_total_places, v_available_places, v_has_capacity
      from public.service_resources service_resources
      join public.resources resources on resources.id = service_resources.resource_id
      left join lateral (
        select coalesce(sum(public.booking_resource_units(
          existing_service_resources.capacity_usage,
          existing_resources.capacity,
          bookings.party_size
        )), 0)::integer as used_units
        from public.booking_resources booking_resources
        join public.bookings bookings on bookings.id = booking_resources.booking_id
        join public.services existing_service on existing_service.id = bookings.service_id
        join public.service_resources existing_service_resources
          on existing_service_resources.service_id = bookings.service_id
         and existing_service_resources.resource_id = booking_resources.resource_id
        join public.resources existing_resources on existing_resources.id = booking_resources.resource_id
        where booking_resources.resource_id = resources.id
          and bookings.status in ('pending', 'confirmed')
          and tstzrange(
            bookings.start_at - make_interval(mins => existing_service.buffer_before_minutes),
            bookings.end_at + make_interval(mins => existing_service.buffer_after_minutes),
            '[)'
          ) && tstzrange(v_buffered_start, v_buffered_end, '[)')
      ) used_resource on true
      where service_resources.service_id = v_service.id
        and resources.active = true;

      if v_has_capacity then
        slot_start := v_slot_start;
        slot_end := v_slot_end;
        available_places := greatest(v_available_places, 0);
        total_places := greatest(v_total_places, 0);
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
  v_has_capacity boolean;
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
    select service_resources.resource_id
    from public.service_resources service_resources
    join public.resources resources on resources.id = service_resources.resource_id
    where service_resources.service_id = v_service.id
      and resources.active = true
    order by service_resources.resource_id
  loop
    perform pg_advisory_xact_lock(hashtext(v_resource_id::text));
  end loop;

  if exists (
    select 1
    from public.blocked_times blocked_times
    where (blocked_times.resource_id is null or blocked_times.resource_id in (
      select service_resources.resource_id
      from public.service_resources service_resources
      join public.resources resources on resources.id = service_resources.resource_id
      where service_resources.service_id = v_service.id
        and resources.active = true
    ))
      and tstzrange(blocked_times.starts_at, blocked_times.ends_at, '[)') && tstzrange(v_buffered_start, v_buffered_end, '[)')
  ) then
    raise exception 'Selected slot is blocked by manager' using errcode = 'P0001';
  end if;

  select coalesce(
    bool_and(
      resources.capacity - coalesce(used_resource.used_units, 0) >= public.booking_resource_units(
        service_resources.capacity_usage,
        resources.capacity,
        p_party_size
      )
    ),
    false
  )
  into v_has_capacity
  from public.service_resources service_resources
  join public.resources resources on resources.id = service_resources.resource_id
  left join lateral (
    select coalesce(sum(public.booking_resource_units(
      existing_service_resources.capacity_usage,
      existing_resources.capacity,
      bookings.party_size
    )), 0)::integer as used_units
    from public.booking_resources booking_resources
    join public.bookings bookings on bookings.id = booking_resources.booking_id
    join public.services existing_service on existing_service.id = bookings.service_id
    join public.service_resources existing_service_resources
      on existing_service_resources.service_id = bookings.service_id
     and existing_service_resources.resource_id = booking_resources.resource_id
    join public.resources existing_resources on existing_resources.id = booking_resources.resource_id
    where booking_resources.resource_id = resources.id
      and bookings.status in ('pending', 'confirmed')
      and tstzrange(
        bookings.start_at - make_interval(mins => existing_service.buffer_before_minutes),
        bookings.end_at + make_interval(mins => existing_service.buffer_after_minutes),
        '[)'
      ) && tstzrange(v_buffered_start, v_buffered_end, '[)')
  ) used_resource on true
  where service_resources.service_id = v_service.id
    and resources.active = true;

  if not v_has_capacity then
    raise exception 'Selected slot is no longer available' using errcode = 'P0001';
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
  select v_booking.id, service_resources.resource_id
  from public.service_resources service_resources
  join public.resources resources on resources.id = service_resources.resource_id
  where service_resources.service_id = v_service.id
    and resources.active = true;

  return v_booking;
end;
$$;

grant execute on function public.booking_resource_units(text, integer, integer) to anon, authenticated;
grant execute on function public.get_available_slots(text, date, integer, integer) to anon, authenticated;
grant execute on function public.create_pending_booking(text, timestamptz, text, text, integer, text, text) to anon, authenticated;
