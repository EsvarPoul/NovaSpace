alter table public.vr_games
  add column if not exists genre_keys text[] not null default '{}',
  add column if not exists player_keys text[] not null default '{}';

update public.vr_games
set
  genre_keys = case
    when coalesce(array_length(genre_keys, 1), 0) = 0 then array[genre_key]
    else genre_keys
  end,
  player_keys = case
    when coalesce(array_length(player_keys, 1), 0) = 0 then array[player_key]
    else player_keys
  end;

alter table public.vr_games
  drop constraint if exists vr_games_genre_keys_check,
  drop constraint if exists vr_games_player_keys_check;

alter table public.vr_games
  add constraint vr_games_genre_keys_check
  check (
    coalesce(array_length(genre_keys, 1), 0) > 0
    and genre_keys <@ array['arcade', 'action', 'quest', 'simulator', 'sport', 'fishing', 'horror']::text[]
  ),
  add constraint vr_games_player_keys_check
  check (
    coalesce(array_length(player_keys, 1), 0) > 0
    and player_keys <@ array['solo', 'coop', 'online']::text[]
  );

create index if not exists vr_games_genre_keys_idx
on public.vr_games using gin(genre_keys);

create index if not exists vr_games_player_keys_idx
on public.vr_games using gin(player_keys);
