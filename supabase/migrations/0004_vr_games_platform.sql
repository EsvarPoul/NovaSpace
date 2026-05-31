alter table public.vr_games
  add column if not exists platform text not null default 'vr';

alter table public.vr_games
  drop constraint if exists vr_games_genre_key_check;

update public.vr_games
set
  platform = case when platform in ('vr', 'ps') then platform else 'vr' end,
  genre_key = case
    when genre_key = 'coop' then 'quest'
    when genre_key = 'story' then 'simulator'
    else genre_key
  end;

alter table public.vr_games
  drop constraint if exists vr_games_platform_check;

alter table public.vr_games
  add constraint vr_games_platform_check
  check (platform in ('vr', 'ps'));

alter table public.vr_games
  add constraint vr_games_genre_key_check
  check (genre_key in ('arcade', 'action', 'quest', 'simulator', 'sport', 'fishing', 'horror'));

create index if not exists vr_games_platform_active_sort_idx
on public.vr_games(platform, active, sort_order, title);
