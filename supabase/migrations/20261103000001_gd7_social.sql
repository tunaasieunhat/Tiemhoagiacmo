-- =====================================================================
--  TIỆM HOA GIẤC MƠ — Giai đoạn 7: bạn bè, thăm nông trại, tưới giúp, quà tặng, lời nhắn
--  Cách chạy: Supabase Dashboard → SQL Editor → New query → dán toàn bộ file → Run
--  (Chạy SAU file giai đoạn 2. Chạy lại nhiều lần cũng an toàn.)
--
--  Mọi thao tác ghi đều đi qua các hàm máy chủ bên dưới (SECURITY DEFINER):
--  trình duyệt KHÔNG ghi thẳng vào bảng được (RLS chặn). Hàm tự kiểm tra:
--  có phải bạn bè không, giới hạn số lần mỗi ngày, giá trị hợp lý, từ ngữ phù hợp.
--
--  GIỚI HẠN (sửa số trong các hàm nếu muốn):
--    bạn bè tối đa .................. 100
--    lời mời kết bạn gửi đi ......... 20 / ngày
--    tưới giúp ...................... 1 lần / ngày / mỗi bạn, tối đa 15 lần / ngày
--    quà tặng ....................... 1 món / ngày / mỗi bạn, tối đa 5 món / ngày
--      số lượng mỗi món: hoa ≤ 10, hạt ≤ 10, vật phẩm ≤ 5, tiền ≤ 500
--    lời nhắn ....................... 1–140 ký tự, cách nhau ≥ 20 giây, tối đa 20 / ngày
--    "ngày" tính theo giờ Việt Nam
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Tiện ích
-- ---------------------------------------------------------------------
create or replace function public.vn_today()
returns date language sql stable as $$
  select (now() at time zone 'Asia/Ho_Chi_Minh')::date;
$$;

-- Ghi nhận & kiểm tra tần suất hành động (chống spam)
create table if not exists public.rate_events (
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_idx on public.rate_events (user_id, action, created_at desc);
alter table public.rate_events enable row level security; -- không có policy: trình duyệt không đọc/ghi được

create or replace function public.rate_check(p_action text, p_max int, p_window interval)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.rate_events
   where user_id = auth.uid() and action = p_action and created_at > now() - p_window;
  if n >= p_max then return false; end if;
  insert into public.rate_events (user_id, action) values (auth.uid(), p_action);
  -- dọn rác cũ cho nhẹ
  delete from public.rate_events where user_id = auth.uid() and created_at < now() - interval '3 days';
  return true;
end;
$$;

-- Báo lỗi tiếng Việt cho trình duyệt (tiền tố SOCIAL: để game nhận ra)
create or replace function public.social_error(msg text)
returns void language plpgsql as $$
begin
  raise exception 'SOCIAL: %', msg using errcode = 'P0001';
end;
$$;

create or replace function public.require_login()
returns uuid language plpgsql stable as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED' using errcode = '28000'; end if;
  return auth.uid();
end;
$$;

-- ---------------------------------------------------------------------
-- 1. BẠN BÈ
-- ---------------------------------------------------------------------
create table if not exists public.friendships (
  id bigint generated always as identity primary key,
  requester uuid not null references auth.users (id) on delete cascade,
  addressee uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendships_not_self check (requester <> addressee)
);
create unique index if not exists friendships_pair on public.friendships (least(requester, addressee), greatest(requester, addressee));
alter table public.friendships enable row level security;
drop policy if exists "friendships: người liên quan được xem" on public.friendships;
create policy "friendships: người liên quan được xem" on public.friendships
  for select to authenticated using (requester = auth.uid() or addressee = auth.uid());
revoke all on public.friendships from anon, authenticated;
grant select on public.friendships to authenticated;

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.friendships
     where status = 'accepted'
       and ((requester = a and addressee = b) or (requester = b and addressee = a))
  );
$$;

create or replace function public.friend_count(u uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.friendships where status = 'accepted' and (requester = u or addressee = u);
$$;

-- Tìm người chơi theo tên hoặc mã kết bạn
create or replace function public.search_players(q text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := public.require_login(); qq text := btrim(coalesce(q, ''));
begin
  if char_length(qq) < 2 then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'name', p.display_name, 'avatar', p.avatar, 'code', p.friend_code,
      'status', (select case when f.status = 'accepted' then 'friend'
                             when f.requester = uid then 'sent' else 'received' end
                   from public.friendships f
                  where (f.requester = uid and f.addressee = p.id) or (f.requester = p.id and f.addressee = uid))
    ))
    from (
      select * from public.profiles
       where id <> uid and (upper(friend_code) = upper(qq) or display_name ilike '%' || replace(replace(qq, '%', ''), '_', '') || '%')
       order by (upper(friend_code) = upper(qq)) desc, display_name
       limit 20
    ) p
  ), '[]'::jsonb);
end;
$$;

create or replace function public.send_friend_request(target uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_login(); existing public.friendships%rowtype;
begin
  if target is null or target = uid then perform public.social_error('Không thể tự kết bạn với chính mình'); end if;
  if not exists (select 1 from public.profiles where id = target) then perform public.social_error('Không tìm thấy người chơi'); end if;
  select * into existing from public.friendships
   where least(requester, addressee) = least(uid, target) and greatest(requester, addressee) = greatest(uid, target);
  if found then
    if existing.status = 'accepted' then perform public.social_error('Hai bạn đã là bạn bè rồi'); end if;
    if existing.requester = uid then perform public.social_error('Bạn đã gửi lời mời rồi, chờ người ấy đồng ý nhé'); end if;
    -- người kia đã mời mình trước => đồng ý luôn
    update public.friendships set status = 'accepted', responded_at = now() where id = existing.id;
    return jsonb_build_object('status', 'accepted');
  end if;
  if public.friend_count(uid) >= 100 then perform public.social_error('Bạn đã có 100 người bạn (tối đa)'); end if;
  if not public.rate_check('friend_request', 20, interval '1 day') then perform public.social_error('Hôm nay bạn đã gửi quá nhiều lời mời, mai thử lại nhé'); end if;
  insert into public.friendships (requester, addressee) values (uid, target);
  return jsonb_build_object('status', 'sent');
end;
$$;

create or replace function public.respond_friend_request(request_id bigint, accept boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_login(); r public.friendships%rowtype;
begin
  select * into r from public.friendships where id = request_id and addressee = uid and status = 'pending';
  if not found then perform public.social_error('Lời mời không còn nữa'); end if;
  if accept then
    if public.friend_count(uid) >= 100 then perform public.social_error('Bạn đã có 100 người bạn (tối đa)'); end if;
    update public.friendships set status = 'accepted', responded_at = now() where id = request_id;
  else
    delete from public.friendships where id = request_id;
  end if;
  return jsonb_build_object('status', case when accept then 'accepted' else 'declined' end);
end;
$$;

create or replace function public.remove_friend(friend uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_login();
begin
  delete from public.friendships
   where least(requester, addressee) = least(uid, friend) and greatest(requester, addressee) = greatest(uid, friend);
  return jsonb_build_object('status', 'removed');
end;
$$;

-- ---------------------------------------------------------------------
-- 2. ẢNH CHỤP NÔNG TRẠI CÔNG KHAI (để bạn bè ghé xem)
-- ---------------------------------------------------------------------
create table if not exists public.farm_showcase (
  user_id uuid primary key references auth.users (id) on delete cascade,
  snapshot jsonb not null,
  updated_at timestamptz not null default now(),
  constraint showcase_size check (octet_length(snapshot::text) < 64000)
);
alter table public.farm_showcase enable row level security;
drop policy if exists "showcase: chủ và bạn bè được xem" on public.farm_showcase;
create policy "showcase: chủ và bạn bè được xem" on public.farm_showcase
  for select to authenticated using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));
revoke all on public.farm_showcase from anon, authenticated;
grant select on public.farm_showcase to authenticated;

create or replace function public.publish_showcase(p_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_login();
begin
  if jsonb_typeof(p_snapshot) <> 'object' or jsonb_typeof(p_snapshot -> 'plots') <> 'array' then perform public.social_error('Dữ liệu nông trại không hợp lệ'); end if;
  if jsonb_array_length(p_snapshot -> 'plots') > 8 then perform public.social_error('Dữ liệu nông trại không hợp lệ'); end if;
  if coalesce(p_snapshot ->> 'level', '1') !~ '^[0-9]{1,4}$' or char_length(coalesce(p_snapshot ->> 'tier', '')) > 40 then
    perform public.social_error('Dữ liệu nông trại không hợp lệ');
  end if;
  if not public.rate_check('showcase', 1, interval '20 seconds') then return jsonb_build_object('status', 'rate_limited'); end if;
  insert into public.farm_showcase (user_id, snapshot, updated_at) values (uid, p_snapshot, now())
  on conflict (user_id) do update set snapshot = excluded.snapshot, updated_at = now();
  return jsonb_build_object('status', 'ok');
end;
$$;

-- ---------------------------------------------------------------------
-- 3. TƯỚI GIÚP
-- ---------------------------------------------------------------------
create table if not exists public.farm_help (
  id bigint generated always as identity primary key,
  helper uuid not null references auth.users (id) on delete cascade,
  owner uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'water' check (kind in ('water')),
  day date not null default public.vn_today(),
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  constraint farm_help_once unique (helper, owner, kind, day)
);
alter table public.farm_help enable row level security;
drop policy if exists "farm_help: người liên quan được xem" on public.farm_help;
create policy "farm_help: người liên quan được xem" on public.farm_help
  for select to authenticated using (helper = auth.uid() or owner = auth.uid());
revoke all on public.farm_help from anon, authenticated;
grant select on public.farm_help to authenticated;

create or replace function public.help_water(friend uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_login(); today date := public.vn_today(); n int;
begin
  if not public.are_friends(uid, friend) then perform public.social_error('Chỉ tưới giúp được bạn bè'); end if;
  if exists (select 1 from public.farm_help where helper = uid and owner = friend and kind = 'water' and day = today) then
    perform public.social_error('Hôm nay bạn đã tưới giúp người này rồi, mai quay lại nhé');
  end if;
  select count(*) into n from public.farm_help where helper = uid and day = today;
  if n >= 15 then perform public.social_error('Hôm nay bạn đã tưới giúp 15 lần (tối đa)'); end if;
  insert into public.farm_help (helper, owner, kind, day) values (uid, friend, 'water', today);
  return jsonb_build_object('status', 'ok', 'helps_today', n + 1);
end;
$$;

-- Chủ nông trại nhận các lượt được tưới giúp (mỗi lượt chỉ nhận 1 lần)
create or replace function public.claim_helps()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_login(); res jsonb;
begin
  with c as (
    update public.farm_help set consumed_at = now()
     where owner = uid and consumed_at is null
     returning helper, kind, created_at
  )
  select coalesce(jsonb_agg(jsonb_build_object('helper', p.display_name, 'helper_id', c.helper, 'kind', c.kind, 'at', c.created_at)), '[]'::jsonb)
    into res from c left join public.profiles p on p.id = c.helper;
  return res;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. QUÀ TẶNG
-- ---------------------------------------------------------------------
create table if not exists public.gifts (
  id bigint generated always as identity primary key,
  sender uuid not null references auth.users (id) on delete cascade,
  receiver uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('flower', 'seed', 'item', 'coins')),
  item_key text,
  qty int not null check (qty between 1 and 500),
  message text check (message is null or char_length(message) <= 100),
  day date not null default public.vn_today(),
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
create index if not exists gifts_receiver_idx on public.gifts (receiver, claimed_at);
alter table public.gifts enable row level security;
drop policy if exists "gifts: người gửi & nhận được xem" on public.gifts;
create policy "gifts: người gửi & nhận được xem" on public.gifts
  for select to authenticated using (sender = auth.uid() or receiver = auth.uid());
revoke all on public.gifts from anon, authenticated;
grant select on public.gifts to authenticated;

create or replace function public.send_gift(friend uuid, p_kind text, p_key text, p_qty int, p_message text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public.require_login();
  today date := public.vn_today();
  save_data jsonb;
  have int;
  msg text := nullif(btrim(regexp_replace(coalesce(p_message, ''), '\s+', ' ', 'g')), '');
begin
  if not public.are_friends(uid, friend) then perform public.social_error('Chỉ tặng quà được cho bạn bè'); end if;
  -- kiểm tra loại & số lượng hợp lệ
  if p_kind = 'flower' then
    if p_key !~ '^[a-z]+:[a-z]+\|[1-3]$' or p_qty not between 1 and 10 then perform public.social_error('Mỗi lần tặng tối đa 10 cành hoa'); end if;
  elsif p_kind = 'seed' then
    if p_key !~ '^[a-z]+:[a-z]+$' or p_qty not between 1 and 10 then perform public.social_error('Mỗi lần tặng tối đa 10 hạt'); end if;
  elsif p_kind = 'item' then
    if p_key not in ('fertilizer', 'cover', 'medicine') or p_qty not between 1 and 5 then perform public.social_error('Mỗi lần tặng tối đa 5 vật phẩm'); end if;
  elsif p_kind = 'coins' then
    p_key := null;
    if p_qty not between 1 and 500 then perform public.social_error('Mỗi lần tặng tối đa 500 xu'); end if;
  else
    perform public.social_error('Loại quà không hợp lệ');
  end if;
  if msg is not null and (char_length(msg) > 100 or not public.is_clean_text(msg)) then
    perform public.social_error('Lời chúc quá dài hoặc có từ ngữ không phù hợp');
  end if;
  if exists (select 1 from public.gifts where sender = uid and receiver = friend and day = today) then
    perform public.social_error('Hôm nay bạn đã tặng quà người này rồi');
  end if;
  if (select count(*) from public.gifts where sender = uid and day = today) >= 5 then
    perform public.social_error('Hôm nay bạn đã tặng 5 món quà (tối đa)');
  end if;
  -- đối chiếu với tiến độ đã lưu lên mạng: không tặng được thứ mình không có
  select data into save_data from public.saves where user_id = uid;
  if save_data is null then perform public.social_error('Hãy đồng bộ tiến độ lên mạng trước khi tặng quà'); end if;
  have := case p_kind
    when 'flower' then coalesce((save_data #>> array['inventory', 'flowers', p_key])::int, 0)
    when 'seed' then coalesce((save_data #>> array['inventory', 'seeds', p_key])::int, 0)
    when 'item' then coalesce((save_data #>> array['inventory', 'items', p_key])::int, 0)
    else coalesce((save_data #>> '{player,coins}')::int, 0) end;
  if have < p_qty then perform public.social_error('Bạn không có đủ món quà này (theo tiến độ đã đồng bộ)'); end if;
  insert into public.gifts (sender, receiver, kind, item_key, qty, message, day) values (uid, friend, p_kind, p_key, p_qty, msg, today);
  return jsonb_build_object('status', 'ok');
end;
$$;

-- Người nhận mở hộp quà: trả về các quà chưa nhận và đánh dấu đã nhận (mỗi quà chỉ nhận 1 lần)
create or replace function public.claim_gifts()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_login(); res jsonb;
begin
  with c as (
    update public.gifts set claimed_at = now()
     where receiver = uid and claimed_at is null
     returning id, sender, kind, item_key, qty, message, created_at
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'from', p.display_name, 'kind', c.kind, 'key', c.item_key, 'qty', c.qty, 'message', c.message, 'at', c.created_at)), '[]'::jsonb)
    into res from c left join public.profiles p on p.id = c.sender;
  return res;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. SỔ LƯU BÚT (lời nhắn trên nông trại)
-- ---------------------------------------------------------------------
create table if not exists public.guestbook (
  id bigint generated always as identity primary key,
  owner uuid not null references auth.users (id) on delete cascade,
  author uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 140),
  created_at timestamptz not null default now()
);
create index if not exists guestbook_owner_idx on public.guestbook (owner, created_at desc);
alter table public.guestbook enable row level security;
drop policy if exists "guestbook: chủ, người viết, bạn bè được xem" on public.guestbook;
create policy "guestbook: chủ, người viết, bạn bè được xem" on public.guestbook
  for select to authenticated using (owner = auth.uid() or author = auth.uid() or public.are_friends(auth.uid(), owner));
revoke all on public.guestbook from anon, authenticated;
grant select on public.guestbook to authenticated;

create or replace function public.post_message(farm_owner uuid, p_text text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_login(); t text := btrim(regexp_replace(coalesce(p_text, ''), '\s+', ' ', 'g'));
begin
  if farm_owner <> uid and not public.are_friends(uid, farm_owner) then perform public.social_error('Chỉ viết lời nhắn cho bạn bè'); end if;
  if char_length(t) < 1 or char_length(t) > 140 then perform public.social_error('Lời nhắn cần từ 1 đến 140 ký tự'); end if;
  if not public.is_clean_text(t) then perform public.social_error('Lời nhắn có từ ngữ không phù hợp'); end if;
  if not public.rate_check('message_burst', 1, interval '20 seconds') then perform public.social_error('Bạn viết nhanh quá, đợi chút nhé'); end if;
  if not public.rate_check('message_day', 20, interval '1 day') then perform public.social_error('Hôm nay bạn đã viết 20 lời nhắn (tối đa)'); end if;
  insert into public.guestbook (owner, author, text) values (farm_owner, uid, t);
  return jsonb_build_object('status', 'ok');
end;
$$;

-- Chủ nông trại hoặc người viết được xóa lời nhắn
create or replace function public.delete_message(message_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := public.require_login();
begin
  delete from public.guestbook where id = message_id and (owner = uid or author = uid);
  return jsonb_build_object('status', 'deleted');
end;
$$;

create or replace function public.guestbook_of(farm_owner uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by (x ->> 'id')::bigint desc), '[]'::jsonb) from (
    select jsonb_build_object('id', g.id, 'author', p.display_name, 'author_id', g.author, 'avatar', p.avatar, 'text', g.text, 'at', g.created_at) as x
      from public.guestbook g left join public.profiles p on p.id = g.author
     where g.owner = farm_owner
     order by g.id desc limit 30
  ) s;
$$;

-- ---------------------------------------------------------------------
-- 6. TỔNG QUAN & THĂM NÔNG TRẠI
-- ---------------------------------------------------------------------
create or replace function public.social_overview()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := public.require_login(); today date := public.vn_today();
begin
  return jsonb_build_object(
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.display_name, 'avatar', p.avatar, 'code', p.friend_code,
        'level', case when s.snapshot ->> 'level' ~ '^[0-9]{1,4}$' then (s.snapshot ->> 'level')::int else p.level end,
        'tier', s.snapshot ->> 'tier',
        'seen_at', s.updated_at,
        'helped_today', exists (select 1 from public.farm_help h where h.helper = uid and h.owner = p.id and h.day = today),
        'gifted_today', exists (select 1 from public.gifts g where g.sender = uid and g.receiver = p.id and g.day = today)
      ) order by s.updated_at desc nulls last)
      from public.friendships f
      join public.profiles p on p.id = case when f.requester = uid then f.addressee else f.requester end
      left join public.farm_showcase s on s.user_id = p.id
      where f.status = 'accepted' and (f.requester = uid or f.addressee = uid)
    ), '[]'::jsonb),
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'user_id', p.id, 'name', p.display_name, 'avatar', p.avatar, 'code', p.friend_code))
      from public.friendships f join public.profiles p on p.id = f.requester
      where f.addressee = uid and f.status = 'pending'
    ), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'user_id', p.id, 'name', p.display_name, 'avatar', p.avatar, 'code', p.friend_code))
      from public.friendships f join public.profiles p on p.id = f.addressee
      where f.requester = uid and f.status = 'pending'
    ), '[]'::jsonb),
    'gifts_waiting', (select count(*) from public.gifts where receiver = uid and claimed_at is null),
    'helps_waiting', (select count(*) from public.farm_help where owner = uid and consumed_at is null),
    'latest_message', (select max(id) from public.guestbook where owner = uid and author <> uid),
    'helps_today', (select count(*) from public.farm_help where helper = uid and day = today),
    'gifts_today', (select count(*) from public.gifts where sender = uid and day = today)
  );
end;
$$;

create or replace function public.visit_farm(friend uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := public.require_login(); today date := public.vn_today();
begin
  if friend <> uid and not public.are_friends(uid, friend) then perform public.social_error('Chỉ thăm được nông trại của bạn bè'); end if;
  return (
    select jsonb_build_object(
      'profile', jsonb_build_object('id', p.id, 'name', p.display_name, 'avatar', p.avatar, 'code', p.friend_code),
      'snapshot', s.snapshot, 'updated_at', s.updated_at,
      'messages', public.guestbook_of(friend),
      'helped_today', exists (select 1 from public.farm_help h where h.helper = uid and h.owner = friend and h.day = today),
      'gifted_today', exists (select 1 from public.gifts g where g.sender = uid and g.receiver = friend and g.day = today)
    )
    from public.profiles p left join public.farm_showcase s on s.user_id = p.id
    where p.id = friend
  );
end;
$$;

create or replace function public.my_guestbook()
returns jsonb language sql stable security definer set search_path = public as $$
  select public.guestbook_of(auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 7. QUYỀN GỌI HÀM: chỉ người đã đăng nhập
-- ---------------------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array[
    'search_players(text)', 'send_friend_request(uuid)', 'respond_friend_request(bigint, boolean)', 'remove_friend(uuid)',
    'publish_showcase(jsonb)', 'help_water(uuid)', 'claim_helps()', 'send_gift(uuid, text, text, int, text)', 'claim_gifts()',
    'post_message(uuid, text)', 'delete_message(bigint)', 'social_overview()', 'visit_farm(uuid)', 'my_guestbook()'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
revoke all on function public.rate_check(text, int, interval) from public, anon, authenticated;
revoke all on function public.guestbook_of(uuid) from public, anon, authenticated;
revoke all on function public.friend_count(uuid) from public, anon, authenticated;
-- are_friends được dùng trong RLS nên người đăng nhập cần quyền gọi
revoke all on function public.are_friends(uuid, uuid) from public, anon;
grant execute on function public.are_friends(uuid, uuid) to authenticated;
