-- =====================================================================
--  TIỆM HOA GIẤC MƠ — Giai đoạn 8: bảng xếp hạng & cuộc thi hoa
--  Chạy SAU file giai đoạn 2 và giai đoạn 7. Chạy lại nhiều lần cũng an toàn.
--
--  CHỐNG GIAN LẬN:
--   * Điểm cấp độ / uy tín: máy chủ tự đọc SAVE ĐÃ ĐỒNG BỘ (bảng saves), KHÔNG nhận số từ trình duyệt,
--     rồi kiểm tra tốc độ tăng có hợp lý không. Tăng quá nhanh => bị cắt bớt và ghi nhận "capped".
--       MAX_XP_PER_HOUR  = 8000   (XP tối đa tăng mỗi giờ thật)
--       MAX_REP_PER_HOUR = 600    (uy tín tối đa tăng mỗi giờ thật)
--   * Điểm cuộc thi: chỉ Edge Function "contest-submit" (dùng khóa service_role trên máy chủ) được ghi,
--     sau khi tự chấm lại bó hoa và đối chiếu kho hoa trong save.
--   * "Tuần" và "mùa thi" tính theo giờ Việt Nam, dạng 2026-W45.
-- =====================================================================

create or replace function public.vn_week(ts timestamptz default now())
returns text language sql stable as $$
  select to_char(ts at time zone 'Asia/Ho_Chi_Minh', 'IYYY-"W"IW');
$$;

-- XP cần để đạt mỗi cấp (khớp data/levels.js)
create or replace function public.level_from_xp(xp bigint)
returns int language plpgsql immutable as $$
declare
  t bigint[] := array[0, 40, 110, 220, 380, 600, 900, 1300, 1800, 2450, 3250, 4200];
  lv int := 1;
begin
  while lv < array_length(t, 1) and xp >= t[lv + 1] loop lv := lv + 1; end loop;
  if lv = array_length(t, 1) then
    lv := lv + floor((xp - t[array_length(t, 1)]) / 1100)::int;
  end if;
  return lv;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. ĐIỂM NGƯỜI CHƠI ĐÃ ĐƯỢC MÁY CHỦ CHẤP NHẬN
-- ---------------------------------------------------------------------
create table if not exists public.player_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp bigint not null default 0,
  level int not null default 1,
  reputation int not null default 0,
  week text not null default public.vn_week(),
  xp_week_base bigint not null default 0,
  rep_week_base int not null default 0,
  capped_count int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.player_stats enable row level security;
-- không có policy: chỉ đọc qua hàm get_leaderboard
revoke all on public.player_stats from anon, authenticated;

create or replace function public.submit_scores()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public.require_login();
  max_xp_h constant numeric := 8000;
  max_rep_h constant numeric := 600;
  d jsonb;
  v_xp bigint;
  v_rep bigint;
  prev public.player_stats%rowtype;
  is_new boolean;
  created timestamptz;
  hours numeric;
  cap_xp bigint;
  cap_rep bigint;
  capped boolean := false;
  wk text := public.vn_week();
  lv int;
begin
  select data into d from public.saves where user_id = uid;
  if d is null then perform public.social_error('Hãy đồng bộ tiến độ lên mạng trước'); end if;
  if not public.rate_check('scores', 1, interval '60 seconds') then return jsonb_build_object('status', 'rate_limited'); end if;
  v_xp := greatest(0, coalesce((d #>> '{player,xp}')::bigint, 0));
  v_rep := greatest(0, coalesce((d #>> '{player,reputation}')::bigint, 0));

  select * into prev from public.player_stats where user_id = uid for update;
  is_new := not found;
  if is_new then
    select u.created_at into created from auth.users u where u.id = uid;
    hours := greatest(0.1, extract(epoch from now() - coalesce(created, now())) / 3600);
    -- cho phép thêm phần tiến độ đã chơi thử (chế độ khách) trước khi tạo tài khoản
    cap_xp := 2500 + (hours * max_xp_h)::bigint;
    cap_rep := 200 + (hours * max_rep_h)::bigint;
  else
    hours := greatest(1.0 / 60, extract(epoch from now() - prev.updated_at) / 3600);
    cap_xp := prev.xp + 60 + (hours * max_xp_h)::bigint;
    cap_rep := prev.reputation + 10 + (hours * max_rep_h)::bigint;
  end if;
  if v_xp > cap_xp then v_xp := cap_xp; capped := true; end if;
  if v_rep > cap_rep then v_rep := cap_rep; capped := true; end if;
  lv := public.level_from_xp(v_xp);

  if is_new then
    insert into public.player_stats (user_id, xp, level, reputation, week, xp_week_base, rep_week_base, capped_count)
    values (uid, v_xp, lv, v_rep, wk, 0, 0, case when capped then 1 else 0 end);
  else
    update public.player_stats s set
      xp = v_xp, level = lv, reputation = v_rep,
      xp_week_base = case when prev.week = wk then prev.xp_week_base else prev.xp end,
      rep_week_base = case when prev.week = wk then prev.rep_week_base else prev.reputation end,
      week = wk,
      capped_count = prev.capped_count + case when capped then 1 else 0 end,
      updated_at = now()
    where s.user_id = uid;
  end if;
  update public.profiles set level = lv, reputation = v_rep where id = uid;
  return jsonb_build_object('status', 'ok', 'xp', v_xp, 'level', lv, 'reputation', v_rep, 'capped', capped);
end;
$$;

-- ---------------------------------------------------------------------
-- 2. CUỘC THI HOA
-- ---------------------------------------------------------------------
create table if not exists public.contest_entries (
  id bigint generated always as identity primary key,
  round text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  score int not null check (score between 0 and 110),
  entry jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists contest_entries_idx on public.contest_entries (round, user_id);

create table if not exists public.contest_best (
  round text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  best int not null check (best between 0 and 110),
  updated_at timestamptz not null default now(),
  primary key (round, user_id)
);

create table if not exists public.contest_claims (
  round text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  rank int not null,
  players int not null,
  coins int not null,
  title text,
  claimed_at timestamptz not null default now(),
  primary key (round, user_id)
);

alter table public.contest_entries enable row level security;
alter table public.contest_best enable row level security;
alter table public.contest_claims enable row level security;
drop policy if exists "contest_entries: chủ được xem" on public.contest_entries;
create policy "contest_entries: chủ được xem" on public.contest_entries for select to authenticated using (user_id = auth.uid());
drop policy if exists "contest_claims: chủ được xem" on public.contest_claims;
create policy "contest_claims: chủ được xem" on public.contest_claims for select to authenticated using (user_id = auth.uid());
revoke all on public.contest_entries, public.contest_best, public.contest_claims from anon, authenticated;
grant select on public.contest_entries, public.contest_claims to authenticated;
-- Ghi: chỉ Edge Function (service_role, bỏ qua RLS)

create or replace function public.contest_rank(p_round text, uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'best', b.best,
    'rank', (select count(*) + 1 from public.contest_best x where x.round = p_round and x.best > b.best),
    'players', (select count(*) from public.contest_best x where x.round = p_round),
    'entries', (select count(*) from public.contest_entries e where e.round = p_round and e.user_id = uid)
  )
  from public.contest_best b where b.round = p_round and b.user_id = uid;
$$;

-- Trạng thái cuộc thi của tôi: mùa hiện tại + mùa trước (đã nhận thưởng chưa)
create or replace function public.contest_status(p_current text, p_previous text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := public.require_login();
begin
  if p_current <> public.vn_week() then perform public.social_error('Mùa thi không hợp lệ'); end if;
  return jsonb_build_object(
    'current', public.contest_rank(p_current, uid),
    'previous', public.contest_rank(p_previous, uid),
    'claimed', exists (select 1 from public.contest_claims c where c.round = p_previous and c.user_id = uid),
    'players', (select count(*) from public.contest_best x where x.round = p_current)
  );
end;
$$;

-- Nhận thưởng mùa thi ĐÃ KẾT THÚC (mỗi người 1 lần). Hạng do máy chủ tính.
create or replace function public.claim_contest_reward(p_round text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public.require_login();
  r jsonb;
  rk int; n int; coins int; title text;
begin
  if p_round >= public.vn_week() then perform public.social_error('Mùa thi này chưa kết thúc'); end if;
  r := public.contest_rank(p_round, uid);
  if r is null then perform public.social_error('Bạn không tham gia mùa thi này'); end if;
  if exists (select 1 from public.contest_claims where round = p_round and user_id = uid) then perform public.social_error('Bạn đã nhận thưởng mùa thi này rồi'); end if;
  rk := (r ->> 'rank')::int; n := (r ->> 'players')::int;
  -- khớp data/contest.js
  if rk = 1 then coins := 3000; title := '🥇 Quán quân';
  elsif rk <= 3 then coins := 1800; title := '🥈 Á quân';
  elsif rk <= 10 then coins := 1000; title := '🏅 Top 10';
  elsif rk <= ceil(n * 0.3) then coins := 500; title := '🌟 Top 30%';
  else coins := 150; title := '🌼 Tham gia'; end if;
  insert into public.contest_claims (round, user_id, rank, players, coins, title) values (p_round, uid, rk, n, coins, title);
  return jsonb_build_object('rank', rk, 'players', n, 'coins', coins, 'title', title);
end;
$$;

-- ---------------------------------------------------------------------
-- 3. BẢNG XẾP HẠNG
--   p_board : 'level' | 'reputation' | 'contest'
--   p_period: 'all' | 'week'   (contest: 'current' | 'previous' kèm p_round)
--   p_scope : 'all' | 'friends'
-- ---------------------------------------------------------------------
create or replace function public.get_leaderboard(p_board text, p_period text, p_scope text, p_round text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := public.require_login(); wk text := public.vn_week(); res jsonb;
begin
  if p_board not in ('level', 'reputation', 'contest') or p_scope not in ('all', 'friends') then perform public.social_error('Bảng xếp hạng không hợp lệ'); end if;
  with pool as (
    select u from (select uid as u union select case when f.requester = uid then f.addressee else f.requester end
                     from public.friendships f where f.status = 'accepted' and (f.requester = uid or f.addressee = uid)) x
  ),
  vals as (
    select s.user_id,
           case
             when p_board = 'level' and p_period = 'week' then case when s.week = wk then s.xp - s.xp_week_base else 0 end
             when p_board = 'level' then s.xp
             when p_period = 'week' then case when s.week = wk then s.reputation - s.rep_week_base else 0 end
             else s.reputation end::bigint as value,
           s.level
      from public.player_stats s
     where p_board <> 'contest' and (p_scope = 'all' or s.user_id in (select u from pool))
       -- ẩn người bị máy chủ cắt điểm nhiều lần (nghi gian lận) khỏi bảng, trừ chính họ
       and (s.capped_count < 5 or s.user_id = uid)
    union all
    select b.user_id, b.best::bigint, null::int
      from public.contest_best b
     where p_board = 'contest' and b.round = coalesce(p_round, wk) and (p_scope = 'all' or b.user_id in (select u from pool))
  ),
  ranked as (
    select v.*, rank() over (order by v.value desc) as rk from vals v
  )
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(jsonb_build_object('rank', r.rk, 'id', r.user_id, 'name', p.display_name, 'avatar', p.avatar, 'value', r.value, 'level', r.level, 'me', r.user_id = uid) order by r.rk, p.display_name)
                        from (select * from ranked order by rk limit 50) r join public.profiles p on p.id = r.user_id), '[]'::jsonb),
    'me', (select jsonb_build_object('rank', r.rk, 'value', r.value) from ranked r where r.user_id = uid),
    'total', (select count(*) from ranked)
  ) into res;
  return res;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array['submit_scores()', 'contest_status(text, text)', 'claim_contest_reward(text)', 'get_leaderboard(text, text, text, text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public.contest_rank(text, uuid) from public, anon, authenticated;
-- Edge Function dùng khóa service_role: cần quyền đọc save và ghi bảng cuộc thi
grant execute on function public.contest_rank(text, uuid) to service_role;
grant select on public.saves to service_role;
grant select, insert, update on public.contest_entries, public.contest_best to service_role;
