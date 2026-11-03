-- =====================================================================
--  TIỆM HOA GIẤC MƠ — Giai đoạn 2: hồ sơ người chơi + lưu game lên cloud
--  Cách chạy: Supabase Dashboard → SQL Editor → New query → dán toàn bộ file → Run
--  Chạy lại nhiều lần cũng an toàn.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TỪ CẤM (dùng lọc tên, sau này lọc cả lời nhắn)
--    Thêm từ mới: Table Editor → banned_words → Insert row
--    match = 'token'     : chặn khi là 1 từ riêng (vd "dm" chặn "dm abc" nhưng không chặn "admin")
--    match = 'substring' : chặn khi xuất hiện ở bất kỳ đâu (kể cả viết liền)
-- ---------------------------------------------------------------------
create table if not exists public.banned_words (
  word  text primary key,
  match text not null default 'token' check (match in ('token', 'substring'))
);
alter table public.banned_words enable row level security;
-- Không có policy nào => trình duyệt KHÔNG đọc/sửa được danh sách này.

insert into public.banned_words (word, match) values
  ('đm','token'),('dm','token'),('đmm','token'),('dmm','token'),('dcm','token'),('đcm','token'),
  ('vcl','token'),('vkl','token'),('vl','token'),('clm','token'),('cmm','token'),('dkm','token'),
  ('đkm','token'),('cc','token'),('đĩ','token'),('cave','token'),
  ('địt','substring'),('lồn','substring'),('cặc','substring'),('buồi','substring'),('đéo','substring'),
  ('đụ','substring'),('óc chó','substring'),('chó đẻ','substring'),('mẹ mày','substring'),
  ('fuck','substring'),('shit','substring'),('bitch','substring'),('dick','substring'),('pussy','substring'),
  ('admin','substring'),('quản trị','substring'),('moderator','substring'),('hệ thống','substring')
on conflict (word) do nothing;

-- Chữ thường cho tiếng Việt (không phụ thuộc cài đặt ngôn ngữ của máy chủ)
create or replace function public.vn_lower(t text)
returns text
language sql immutable
as $$
  select translate(lower(t), 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞĀĂĄĆĈĊČĎĐĒĔĖĘĚĜĞĠĢĤĦĨĪĬĮĲĴĶĹĻĽĿŁŃŅŇŊŌŎŐŒŔŖŘŚŜŞŠŢŤŦŨŪŬŮŰŲŴŶŸŹŻŽƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸ', 'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþāăąćĉċčďđēĕėęěĝğġģĥħĩīĭįĳĵķĺļľŀłńņňŋōŏőœŕŗřśŝşšţťŧũūŭůűųŵŷÿźżžơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ');
$$;

-- Kiểm tra 1 đoạn chữ có "sạch" không
create or replace function public.is_clean_text(t text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  with norm as (select public.vn_lower(coalesce(t, '')) as s),
       tokens as (select unnest(regexp_split_to_array((select s from norm), '[^A-Za-z0-9À-ÖØ-öø-žƠơƯưẠ-ỹ]+')) as tok)
  select not exists (
    select 1 from public.banned_words b
    where (b.match = 'token' and b.word in (select tok from tokens))
       or (b.match = 'substring' and (
             position(b.word in (select s from norm)) > 0
          or position(replace(b.word, ' ', '') in regexp_replace((select s from norm), '[^A-Za-z0-9À-ÖØ-öø-žƠơƯưẠ-ỹ]+', '', 'g')) > 0))
  );
$$;

-- Tên hiển thị hợp lệ: 2–20 ký tự, chữ cái (kể cả tiếng Việt)/số/khoảng trắng/._- , không chứa từ cấm
-- (trình duyệt phải chuẩn hóa NFC trước khi gửi)
create or replace function public.is_valid_display_name(n text)
returns boolean
language sql stable
set search_path = public
as $$
  select n is not null
     and char_length(n) between 2 and 20
     and n = btrim(n)
     and n !~ '\s{2,}'
     and n ~ '^[A-Za-z0-9À-ÖØ-öø-žƠơƯưẠ-ỹ ._-]+$'
     and public.is_clean_text(n);
$$;

-- Avatar hợp lệ: chỉ các khóa skin/hair/outfit/hat, giá trị là mã màu #RRGGBB
create or replace function public.is_valid_avatar(a jsonb)
returns boolean
language sql immutable
as $$
  select jsonb_typeof(a) = 'object'
     and not exists (
       select 1 from jsonb_each(a) e
       where e.key not in ('skin', 'hair', 'outfit', 'hat')
          or jsonb_typeof(e.value) <> 'string'
          or (e.value #>> '{}') !~ '^#[0-9a-fA-F]{6}$'
     );
$$;

-- ---------------------------------------------------------------------
-- 2. HỒ SƠ NGƯỜI CHƠI (phần công khai)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text not null,
  friend_code        text not null unique,
  avatar             jsonb not null default '{"skin":"#ffe0c7","hair":"#6b4433","outfit":"#8fc9e8","hat":"#f6d67a"}',
  level              int  not null default 1,     -- chỉ server cập nhật (GĐ8)
  reputation         int  not null default 0,     -- chỉ server cập nhật (GĐ8)
  profile_setup_done boolean not null default false,
  name_changed_at    timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint profiles_name_ok   check (public.is_valid_display_name(display_name)),
  constraint profiles_avatar_ok check (public.is_valid_avatar(avatar))
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: người đăng nhập được xem" on public.profiles;
create policy "profiles: người đăng nhập được xem" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles: chỉ chủ được sửa" on public.profiles;
create policy "profiles: chỉ chủ được sửa" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Không có policy insert/delete: hồ sơ được tạo tự động khi đăng ký (trigger bên dưới).

-- Chỉ cho trình duyệt sửa đúng 3 cột; level/reputation/friend_code không sửa được.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar, profile_setup_done) on public.profiles to authenticated;

-- Giới hạn tần suất đổi tên (1 lần / 30 giây) + tự cập nhật updated_at
create or replace function public.profiles_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.display_name is distinct from old.display_name then
    if old.name_changed_at is not null and old.name_changed_at > now() - interval '30 seconds' then
      raise exception 'RATE_LIMIT: Bạn đổi tên quá nhanh, hãy thử lại sau ít phút' using errcode = 'P0001';
    end if;
    new.name_changed_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists profiles_before_update on public.profiles;
create trigger profiles_before_update before update on public.profiles
  for each row execute function public.profiles_before_update();

-- Mã kết bạn 8 ký tự dễ đọc (bỏ 0/O/1/I)
create or replace function public.new_friend_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where friend_code = code);
  end loop;
  return code;
end;
$$;

-- Tự tạo hồ sơ khi có tài khoản mới (email hoặc Google)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  wanted text := btrim(regexp_replace(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    ''), '\s+', ' ', 'g'));
begin
  wanted := left(wanted, 20);
  if not public.is_valid_display_name(wanted) then
    wanted := 'Người làm vườn';
  end if;
  insert into public.profiles (id, display_name, friend_code)
  values (new.id, wanted, public.new_friend_code())
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Tạo hồ sơ cho các tài khoản đã có trước khi chạy file này
insert into public.profiles (id, display_name, friend_code)
select u.id, 'Người làm vườn', public.new_friend_code()
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ---------------------------------------------------------------------
-- 3. SAVE GAME (riêng tư)
-- ---------------------------------------------------------------------
create table if not exists public.saves (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  data        jsonb  not null,
  version     int    not null,
  rev         bigint not null default 1,   -- tăng mỗi lần ghi => phát hiện xung đột giữa 2 máy
  device      text,
  updated_at  timestamptz not null default now(),
  constraint saves_size_ok check (octet_length(data::text) < 512000)
);

alter table public.saves enable row level security;

drop policy if exists "saves: chỉ chủ được xem" on public.saves;
create policy "saves: chỉ chủ được xem" on public.saves
  for select to authenticated using (user_id = auth.uid());
-- Không có policy insert/update/delete: chỉ ghi qua hàm push_save bên dưới.

revoke all on public.saves from anon, authenticated;
grant select on public.saves to authenticated;

-- Ghi save có kiểm tra:
--   - p_base_rev phải trùng rev hiện tại trên server (nếu không => 'conflict', trả về bản trên cloud)
--   - tối thiểu 3 giây giữa 2 lần ghi ('rate_limited')
--   - kích thước & cấu trúc cơ bản
create or replace function public.push_save(p_data jsonb, p_version int, p_base_rev bigint, p_device text default null)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cur public.saves%rowtype;
  new_rev bigint;
begin
  if uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;
  if jsonb_typeof(p_data) <> 'object' or p_version is null or p_version < 1 or p_version > 1000 then
    raise exception 'BAD_SAVE: dữ liệu save không hợp lệ' using errcode = '22023';
  end if;
  if octet_length(p_data::text) >= 512000 then
    raise exception 'BAD_SAVE: save quá lớn' using errcode = '22023';
  end if;
  if jsonb_typeof(p_data -> 'farm') <> 'object' or jsonb_typeof(p_data -> 'player') <> 'object' then
    raise exception 'BAD_SAVE: thiếu dữ liệu nông trại' using errcode = '22023';
  end if;

  select * into cur from public.saves where user_id = uid for update;

  if found then
    -- bản game cũ không được ghi đè save của bản game mới hơn (GĐ9)
    if cur.version > p_version then
      return jsonb_build_object('status', 'outdated', 'version', cur.version, 'rev', cur.rev);
    end if;
    if cur.rev <> coalesce(p_base_rev, -1) then
      return jsonb_build_object('status', 'conflict', 'rev', cur.rev, 'data', cur.data,
                                'version', cur.version, 'updated_at', cur.updated_at, 'device', cur.device);
    end if;
    if cur.updated_at > now() - interval '3 seconds' then
      return jsonb_build_object('status', 'rate_limited', 'rev', cur.rev);
    end if;
    new_rev := cur.rev + 1;
    update public.saves
       set data = p_data, version = p_version, rev = new_rev, device = left(p_device, 40), updated_at = now()
     where user_id = uid;
  else
    new_rev := 1;
    insert into public.saves (user_id, data, version, rev, device)
    values (uid, p_data, p_version, new_rev, left(p_device, 40));
  end if;

  return jsonb_build_object('status', 'ok', 'rev', new_rev, 'updated_at', now());
end;
$$;

revoke all on function public.push_save(jsonb, int, bigint, text) from public, anon;
grant execute on function public.push_save(jsonb, int, bigint, text) to authenticated;

-- Các hàm kiểm tra chữ: cho trình duyệt hỏi trước khi lưu tên (không lộ danh sách từ cấm)
revoke all on function public.is_clean_text(text) from public, anon;
grant execute on function public.is_clean_text(text) to authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.new_friend_code() from public, anon, authenticated;
