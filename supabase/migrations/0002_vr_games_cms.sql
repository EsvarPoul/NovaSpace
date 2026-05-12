create table if not exists public.vr_games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  genre text not null,
  genre_key text not null check (genre_key in ('arcade', 'coop', 'action', 'story', 'horror', 'quest')),
  tags text[] not null default '{}',
  players text not null,
  player_key text not null check (player_key in ('solo', 'coop', 'online')),
  duration text not null,
  duration_key text not null,
  level text not null,
  short_text text not null,
  description text not null,
  features text[] not null default '{}',
  recommended_for text not null,
  media_tone text not null default 'cyan' check (media_tone in ('cyan', 'blue', 'violet', 'magenta', 'pink', 'green', 'gold', 'ice')),
  preview_image_path text,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vr_games_active_sort_idx on public.vr_games(active, sort_order, title);

drop trigger if exists vr_games_touch_updated_at on public.vr_games;
create trigger vr_games_touch_updated_at
before update on public.vr_games
for each row execute function public.touch_updated_at();

alter table public.vr_games enable row level security;

drop policy if exists "Public can read active VR games" on public.vr_games;
create policy "Public can read active VR games"
on public.vr_games for select
using (active = true or public.is_booking_manager());

drop policy if exists "Managers can insert VR games" on public.vr_games;
create policy "Managers can insert VR games"
on public.vr_games for insert
with check (public.is_booking_manager());

drop policy if exists "Managers can update VR games" on public.vr_games;
create policy "Managers can update VR games"
on public.vr_games for update
using (public.is_booking_manager())
with check (public.is_booking_manager());

drop policy if exists "Managers can delete VR games" on public.vr_games;
create policy "Managers can delete VR games"
on public.vr_games for delete
using (public.is_booking_manager());

grant select on public.vr_games to anon, authenticated;
grant insert, update, delete on public.vr_games to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vr-game-previews',
  'vr-game-previews',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read VR game previews" on storage.objects;
create policy "Public can read VR game previews"
on storage.objects for select
using (bucket_id = 'vr-game-previews');

drop policy if exists "Managers can upload VR game previews" on storage.objects;
create policy "Managers can upload VR game previews"
on storage.objects for insert
with check (bucket_id = 'vr-game-previews' and public.is_booking_manager());

drop policy if exists "Managers can update VR game previews" on storage.objects;
create policy "Managers can update VR game previews"
on storage.objects for update
using (bucket_id = 'vr-game-previews' and public.is_booking_manager())
with check (bucket_id = 'vr-game-previews' and public.is_booking_manager());

drop policy if exists "Managers can delete VR game previews" on storage.objects;
create policy "Managers can delete VR game previews"
on storage.objects for delete
using (bucket_id = 'vr-game-previews' and public.is_booking_manager());

insert into public.vr_games (
  slug,
  title,
  genre,
  genre_key,
  tags,
  players,
  player_key,
  duration,
  duration_key,
  level,
  short_text,
  description,
  features,
  recommended_for,
  media_tone,
  sort_order
) values
  (
    'solo-flow',
    'Solo Flow',
    'Аркада',
    'arcade',
    array['solo', 'ритм', 'швидкий старт'],
    '1 гравець',
    'solo',
    '30-60 хв',
    '60',
    'Легкий старт',
    'Короткі динамічні ігри для першого знайомства з VR без складних правил.',
    'Solo Flow підходить для першого візиту, розігріву перед командною грою або гостя, який хоче спробувати VR у власному темпі. Адміністратор допоможе підібрати гру, налаштувати шолом і пояснить керування.',
    array['інструктаж перед стартом', 'підбір гри під рівень', 'комфортний темп'],
    'новачків, дітей після уточнення віку, гостей без VR-досвіду',
    'cyan',
    10
  ),
  (
    'coop-mission',
    'Co-op Mission',
    'Кооператив',
    'coop',
    array['co-op', 'до 4 осіб', 'команда'],
    '2-4',
    'coop',
    '60 хв',
    '60',
    'Командний',
    'Місії, де гравці проходять завдання разом і постійно комунікують.',
    'Co-op Mission збирає компанію навколо спільної задачі: пройти кімнати, розділити ролі, домовлятися і реагувати на підказки. Це хороший формат для друзів, сімей та невеликих команд.',
    array['командні загадки', 'ролі для кожного', 'підходить новачкам'],
    'компаній до 4 осіб, сімейних візитів, невеликих свят',
    'green',
    20
  ),
  (
    'online-arena',
    'Online Arena',
    'Екшен',
    'action',
    array['online', 'арена', 'драйв'],
    '2-6',
    'online',
    '45-60 хв',
    '45-60',
    'Драйвовий',
    'Активні арени та онлайн-режими для компаній, які хочуть змагання.',
    'Online Arena створена для швидкого темпу: короткі раунди, командна взаємодія, рух і спортивне відчуття VR-матчу. Добре заходить на дні народження та корпоративи.',
    array['онлайн-режими', 'змагальний формат', '6 VR-зон'],
    'днів народження, корпоративів, активних компаній',
    'blue',
    30
  ),
  (
    'story-date',
    'Story Date',
    'Сюжет',
    'story',
    array['для двох', 'атмосфера', 'спокійно'],
    '2',
    'coop',
    '60 хв',
    '60',
    'Кінематографічний',
    'Атмосферні VR-історії для пари або спокійного вечора удвох.',
    'Story Date більше схожа на інтерактивну пригоду: менше хаосу, більше атмосфери, світла і присутності в іншому просторі. Формат підходить для побачення або спокійного вечора.',
    array['кімната для пари', 'м''який темп', 'атмосферний сюжет'],
    'пар, побачень, гостей, які хочуть спокійний VR',
    'violet',
    40
  ),
  (
    'horror-night',
    'Horror Night',
    'Horror',
    'horror',
    array['напруга', 'команда', 'емоції'],
    '2-4',
    'coop',
    '45-60 хв',
    '45-60',
    'Інтенсивний',
    'Контрольований horror-досвід для компаній, які хочуть яскравих емоцій.',
    'Horror Night грає на атмосфері, звуці та командній напрузі. Перед стартом адміністратор пояснює формат, а сценарій підбирається так, щоб було яскраво, але без зайвого дискомфорту.',
    array['контрольований страх', 'сильний звук', 'командна підтримка'],
    'сміливих компаній, вечірок, гостей із досвідом VR',
    'magenta',
    50
  ),
  (
    'family-quest',
    'Family Quest',
    'Квест',
    'quest',
    array['родина', 'діти', 'легко'],
    '1-4',
    'coop',
    '30-60 хв',
    '60',
    'Сімейний',
    'Легкі пригоди й квести для сімейного візиту після уточнення віку дітей.',
    'Family Quest збирає прості, зрозумілі сценарії з доброзичливою динамікою. Адміністратор допомагає підібрати гру за віком, досвідом і рівнем активності гостей.',
    array['підбір за віком', 'просте керування', 'спокійний супровід'],
    'сімей, дитячих форматів після уточнення віку, першого VR',
    'gold',
    60
  )
on conflict (slug) do update set
  title = excluded.title,
  genre = excluded.genre,
  genre_key = excluded.genre_key,
  tags = excluded.tags,
  players = excluded.players,
  player_key = excluded.player_key,
  duration = excluded.duration,
  duration_key = excluded.duration_key,
  level = excluded.level,
  short_text = excluded.short_text,
  description = excluded.description,
  features = excluded.features,
  recommended_for = excluded.recommended_for,
  media_tone = excluded.media_tone,
  sort_order = excluded.sort_order,
  active = true;
