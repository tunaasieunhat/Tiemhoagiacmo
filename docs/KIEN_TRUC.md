# Kiến trúc — Tiệm Hoa Giấc Mơ

## 1. Cấu trúc thư mục

```
Tiemhoagiacmo/
├─ index.html              Trang chính
├─ data/                   ⭐ SỐ LIỆU CÂN BẰNG — chỉnh ở đây, không cần biết code
│  ├─ flowers.js           Các loài hoa: thời gian lớn, nước, phân, giá, mùa, màu...
│  ├─ config.js            Thời gian ngày/đêm, chăm sóc, đồ khởi đầu, camera...
│  ├─ shop.js, wrapping.js, customers.js   Cửa hàng, giấy gói/ruy băng, khách
│  ├─ market.js, levels.js Khu chợ (nâng cấp, mở đất), cấp độ & XP
│  ├─ seasons.js           Mùa, thời tiết, thiên tai, dịch bệnh, lễ hội, đồ phòng hộ
│  ├─ variants.js          Màu hoa, ý nghĩa, công thức lai, thưởng sổ tay
│  ├─ regulars.js          Khách quen & câu chuyện
│  ├─ quests.js, automation.js, decor.js, contest.js   Nhiệm vụ, tự động hóa, trang trí, cuộc thi
│  ├─ online.js            Địa chỉ + khóa công khai Supabase
│  └─ badwords.js          Từ cấm (bản phụ, bản chính ở máy chủ)
├─ src/
│  ├─ main.js              Khởi động game
│  ├─ game.js              Bộ điều khiển: nối dữ liệu ↔ logic ↔ đồ họa ↔ giao diện
│  ├─ version.js           Số phiên bản game
│  ├─ core/                Tiện ích chung (sự kiện)
│  ├─ systems/             LOGIC THUẦN (không đồ họa) → dùng lại được trên server
│  │  ├─ farming.js        Xới, gieo, tưới, bón, thu hoạch, héo, chất lượng
│  │  ├─ shop.js           Khách, yêu cầu, chấm điểm bó hoa, giá, tiền bo, uy tín
│  │  ├─ market.js         Mua hạt, vật tư, nâng cấp, mở rộng đất
│  │  ├─ progression.js    XP, lên cấp, mở khóa, tác dụng nâng cấp
│  │  ├─ calendar.js       Mùa, ngày trong mùa, lễ hội, hoa đúng mùa
│  │  ├─ weather.js        Thời tiết + dự báo, bão/sương giá/nắng nóng, dịch bệnh
│  │  ├─ variants.js       Mã hoa có màu ("rose:red|3"), tên, tông, ý nghĩa
│  │  ├─ bouquet.js        Chấm điểm bó hoa sáng tạo (phối màu, ý nghĩa, cân đối, chất lượng)
│  │  ├─ breeding.js       Lai tạo
│  │  ├─ notebook.js       Sổ tay thực vật
│  │  ├─ regulars.js       Khách quen
│  │  ├─ quests.js         Nhiệm vụ ngày/tuần
│  │  ├─ automation.js     Vòi tưới, máy bón phân, nhân viên
│  │  ├─ contest.js        Mùa thi (tuần thật, giờ VN), chấm bài dự thi — dùng chung với máy chủ
│  │  └─ contestServer.js  Xử lý nộp bài trong Edge Function
│  │  └─ time.js           Đồng hồ game
│  ├─ save/                LƯU GAME
│  │  ├─ schema.js         Cấu trúc save + số phiên bản + chuyển đổi save cũ
│  │  ├─ localStore.js     Lưu trên máy (IndexedDB)
│  │  └─ saveManager.js    Tự lưu định kỳ / khi thoát; chỗ gắn đồng bộ cloud (GĐ2)
│  ├─ online/              KẾT NỐI SUPABASE (GĐ2)
│  │  ├─ supabase.js       Tạo kết nối (chặn nhầm khóa bí mật), giới hạn thời gian chờ
│  │  ├─ auth.js           Đăng nhập, đăng ký, quên mật khẩu, Google, hồ sơ
│  │  ├─ cloudSync.js      Đồng bộ save: mất mạng, xung đột 2 máy
│  │  ├─ social.js         Gọi hàm máy chủ bạn bè / quà / lời nhắn
│  │  ├─ socialManager.js  Hỏi máy chủ định kỳ, nhận tưới giúp, đăng ảnh nông trại
│  │  └─ showcase.js       Ảnh chụp nông trại công khai (không chứa tiền, kho đồ)
│  │  ├─ names.js          Kiểm tra tên phía trình duyệt
│  │  └─ errors.js         Lỗi tiếng Việt
│  ├─ render/              ĐỒ HỌA 3D (Three.js)
│  │  ├─ stage.js          Renderer, camera isometric, ánh sáng
│  │  ├─ cameraControls.js Kéo, zoom (chuột / 2 ngón), chạm
│  │  ├─ dayNight.js       Ánh sáng theo giờ
│  │  ├─ world.js          Bản đồ 3 khu vực
│  │  ├─ farmView.js       Ô đất + cây hoa
│  │  ├─ player.js         Nhân vật chibi đi lại, làm việc
│  │  └─ particles.js, icons.js  Hiệu ứng, biểu tượng
│  ├─ models/              Mô hình chibi dựng bằng khối hình (không dùng file ngoài)
│  └─ ui/                  Giao diện HTML tiếng Việt (HUD, bảng, hộp thoại)
├─ supabase/               (GĐ2+) migrations SQL + Edge Functions
├─ docs/                   Tài liệu (kiến trúc, Supabase, đưa lên mạng, APK)
├─ public/                 manifest.webmanifest + icons (cài lên màn hình chính)
├─ assets/                 Ảnh gốc biểu tượng & màn hình chờ cho APK (@capacitor/assets)
├─ capacitor.config.json   Cấu hình ứng dụng Android
├─ netlify.toml            Cấu hình đưa lên Netlify
└─ .github/workflows/      android.yml (build APK), android-keystore.yml (tạo khóa ký 1 lần)
```

**Nguyên tắc:** logic game (`systems/`) tách khỏi đồ họa → server (Edge Function) có thể chạy lại
cùng công thức để kiểm tra gian lận.

## 2. Dữ liệu save (đã sẵn sàng đồng bộ cloud)

```js
{
  version: 7,                     // số phiên bản cấu trúc → tự chuyển đổi khi game cập nhật
  meta: { saveId, ownerId, rev, syncedRev, createdAt, updatedAt },
  player: { name, avatar, level, xp, coins, reputation },
  time: { gameMinutes, lastRealTs },
  tools, inventory: { seeds, items, flowers },
  farm: { plots: [{ id, cols, rows, tiles: [...] }] },
  shop: { open, customers: [{ id, npc, spot, request, arrivedAt, patience }], nextSpawnAt },  // v3
  upgrades: { can, shoes, gloves, counter, sign },  // v4: bậc nâng cấp
  weather: { today: {day, type, disease}, tomorrow: {...} },  // v5; mỗi lô có greenhouse, coverUntil; mỗi ô có sick, guardUntil, offSeason
  stats, tutorial, settings
}
```
- `rev` tăng mỗi lần lưu; `syncedRev` = bản đã lên cloud. `rev > syncedRev` ⇒ còn thay đổi chưa đồng bộ (khi mất mạng).
- Đồng bộ (GĐ2): máy chủ đánh số `rev` cho mỗi lần ghi (`push_save`). Trình duyệt gửi kèm `cloudRev` đã biết;
  nếu khác => máy khác đã ghi => hỏi người chơi giữ bản nào (bản kia được sao lưu trên máy).
- Đổi cấu trúc: tăng `SAVE_VERSION` + thêm hàm vào `MIGRATIONS` trong `src/save/schema.js`. Save cũ được sao lưu trước khi chuyển.

## 3. Bảng dữ liệu Supabase

Đã làm:
- GĐ2 (`…_gd2_profiles_saves.sql`): `profiles`, `saves`, `banned_words`, hàm `push_save`.
- GĐ7 (`…_gd7_social.sql`): `friendships`, `farm_showcase` (ảnh chụp nông trại công khai cho bạn bè), `farm_help`, `gifts`, `guestbook`, `rate_events` và các hàm máy chủ `search_players`, `send_friend_request`, `respond_friend_request`, `remove_friend`, `publish_showcase`, `help_water`, `claim_helps`, `send_gift`, `claim_gifts`, `post_message`, `delete_message`, `social_overview`, `visit_farm`, `my_guestbook`.

GĐ7 dùng **hàm máy chủ Postgres (RPC, SECURITY DEFINER)** thay cho Edge Function: chạy trên máy chủ nên trình duyệt không gian lận được, kiểm tra + ghi trong cùng 1 giao dịch, và cài đặt chỉ cần dán SQL. - GĐ8 (`…_gd8_leaderboard_contest.sql`): `player_stats` (điểm máy chủ chấp nhận), `contest_entries`, `contest_best`, `contest_claims`; hàm `submit_scores` (đọc save đã đồng bộ, giới hạn tốc độ tăng XP/uy tín), `get_leaderboard`, `contest_status`, `claim_contest_reward`.
- **Edge Function** `contest-submit` (nguồn: `supabase/functions-src/contest-submit.js` + `src/systems/contestServer.js`, đóng gói bằng `npm run build:functions` ra 1 file `supabase/functions/contest-submit/index.ts`): chấm lại bó hoa dự thi bằng chính `src/systems/bouquet.js`, đối chiếu kho hoa trong save, giới hạn 3 bài/tuần, ghi điểm bằng khóa service_role (chỉ ở máy chủ).

| Bảng | Nội dung | Ai được đọc / ghi (RLS) |
|---|---|---|
| `profiles` | id (= auth user), `display_name`, `friend_code` (mã kết bạn), `avatar` jsonb, `level`, `reputation` | Mọi người đã đăng nhập: đọc. Chủ: sửa tên/avatar. `level`/`reputation` chỉ server ghi |
| `saves` | `user_id`, `version`, `data` jsonb, `rev`, `updated_at`, `device_id` | Chỉ chủ đọc/ghi |
| `farm_showcase` | Ảnh chụp công khai nông trại/tiệm/trang trí (để bạn bè xem) | Bạn bè đọc; chủ ghi |
| `friendships` | `user_id`, `friend_id`, `status` (pending/accepted) | Hai người liên quan |
| `farm_interactions` | Tưới giúp: `actor_id`, `target_id`, `day`, UNIQUE(actor, target, day) | Chỉ Edge Function ghi |
| `gifts` | `from_id`, `to_id`, `item`, `qty`, `claimed` | Người nhận đọc/nhận; Edge Function ghi |
| `guestbook` | Lời nhắn: `from_id`, `to_id`, `text` (đã lọc từ xấu) | Chủ trang + người viết đọc; Edge Function ghi |
| `leaderboard_entries` | `user_id`, `board` (level/reputation/contest), `period` (all / 2026-W45 / mùa), `score` | Mọi người đọc; **chỉ Edge Function ghi** |
| `contests`, `contest_entries` | Cuộc thi hoa theo mùa | Mọi người đọc; Edge Function chấm & ghi |
| `rate_limits` | Đếm số lần gọi theo người/hành động/khung giờ | Chỉ server |
| `app_versions` | Phiên bản mới nhất + ghi chú (thông báo cập nhật) | Mọi người đọc |

**Bảo mật:**
- Bật RLS cho mọi bảng. Trình duyệt chỉ có `anon key` (công khai được). `service_role` chỉ nằm trong Edge Function.
- Điểm xếp hạng, quà, tưới giúp, lời nhắn đi qua Edge Function: kiểm tra giới hạn/ngày, giá trị hợp lý,
  so với lịch sử save, lọc từ ngữ, giới hạn tần suất.
