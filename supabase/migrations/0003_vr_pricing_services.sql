insert into public.resources (slug, name, kind) values
  ('ps5-console', 'PS5 console', 'equipment')
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
  ('vr-30', 'VR 30 хв', 'vr', 'VR session priced per one VR zone.', 30, 10, 10, 1, 6, 10),
  ('vr-60', 'VR 60 хв', 'vr', 'VR session priced per one VR zone.', 60, 10, 15, 1, 6, 20),
  ('vr-90', 'VR 90 хв', 'vr', 'VR session priced per one VR zone.', 90, 10, 15, 1, 6, 30),
  ('ps5-60-1', 'PS5 60 хв · 1 людина', 'vr', 'PS5 session for one guest.', 60, 5, 10, 1, 1, 40),
  ('ps5-60-2', 'PS5 60 хв · 2 людини', 'vr', 'PS5 session for two guests.', 60, 5, 10, 2, 2, 50),
  ('ps5-120-1', 'PS5 120 хв · 1 людина', 'vr', 'PS5 session for one guest.', 120, 5, 10, 1, 1, 60),
  ('ps5-120-2', 'PS5 120 хв · 2 людини', 'vr', 'PS5 session for two guests.', 120, 5, 10, 2, 2, 70),
  ('novamix2-60', 'NovaMix2 60 хв · VR + PS5', 'vr', 'One hour combined VR and PS5 format.', 60, 10, 15, 2, 2, 80),
  ('birthday-3h', 'День народження · 3 години', 'event', 'Birthday package for 4-10 guests.', 180, 20, 30, 4, 10, 90)
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
where slug in ('vr-first-dive', 'vr-squad', 'vr-event');

insert into public.service_resources (service_id, resource_id)
select services.id, resources.id
from public.services services
join public.resources resources on resources.slug in ('vr-room', 'vr-stations', 'nova-host')
where services.slug in ('vr-30', 'vr-60', 'vr-90')
on conflict do nothing;

insert into public.service_resources (service_id, resource_id)
select services.id, resources.id
from public.services services
join public.resources resources on resources.slug in ('vr-room', 'ps5-console')
where services.slug in ('ps5-60-1', 'ps5-60-2', 'ps5-120-1', 'ps5-120-2')
on conflict do nothing;

insert into public.service_resources (service_id, resource_id)
select services.id, resources.id
from public.services services
join public.resources resources on resources.slug in ('vr-room', 'vr-stations', 'ps5-console', 'nova-host')
where services.slug in ('novamix2-60', 'birthday-3h')
on conflict do nothing;
