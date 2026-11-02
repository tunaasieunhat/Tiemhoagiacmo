# Kiến trúc — Tiệm Hoa Giấc Mơ

## 1. Cấu trúc thư mục

```
Tiemhoagiacmo/
├─ index.html              Trang chính
├─ data/                   ⭐ SỐ LIỆU CÂN BẰNG — chỉnh ở đây, không cần biết code
│  ├─ flowers.js           Các loài hoa: thời gian lớn, nước, phân, giá, mùa, màu...
│  └─ config.js            Thời gian ngày/đêm, chăm sóc, đồ khởi đầu, camera...
├─ src/
│  ├─ main.js              Khởi động game
│  ├─ game.js              Bộ điều khiển: nối dữ liệu ↔ logic ↔ đồ họa ↔ giao diện
│  ├─ version.js           Số phiên bản game
│  ├─ core/                Tiện ích chung (sự kiện)
│  ├─ systems/             LOGIC THUẦN (không đồ họa) → dùng lại được trên server
│  │  ├─ farming.js        Xới, gieo, tưới, bón, thu hoạch, héo, chất lượng
│  │  └─ time.js           Đồng hồ game
│  ├─ save/                LƯU GAME
│  │  ├─ schema.js         Cấu trúc save + số phiên bản + chuyển đổi save cũ
│  │  ├─ localStore.js     Lưu trên máy (IndexedDB)
│  │  └─ saveManager.js    Tự lưu định kỳ / khi thoát; chỗ gắn đồng bộ cloud (GĐ2)
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
└─ docs/                   Tài liệu
```

**Nguyên tắc:** logic game (`systems/`) tách khỏi đồ họa → server (Edge Function) có thể chạy lại
cùng công thức để kiểm tra gian lận.

## 2. Dữ liệu save (đã sẵn sàng đồng bộ cloud)

```js
{
  version: 1,                     // số phiên bản cấu trúc → tự chuyển đổi khi game cập nhật
  meta: { saveId, ownerId, rev, syncedRev, createdAt, updatedAt },
  player: { name, avatar, level, xp, coins, reputation },
  time: { gameMinutes, lastRealTs },
  tools, inventory: { seeds, items, flowers },
  farm: { plots: [{ id, cols, rows, tiles: [...] }] },
  stats, tutorial, settings
}
```
- `rev` tăng mỗi lần lưu; `syncedRev` = bản đã lên cloud. `rev > syncedRev` ⇒ còn thay đổi chưa đồng bộ (khi mất mạng).
- Đổi cấu trúc: tăng `SAVE_VERSION` + thêm hàm vào `MIGRATIONS` trong `src/save/schema.js`. Save cũ được sao lưu trước khi chuyển.

## 3. Bảng dữ liệu Supabase (đề xuất — làm ở GĐ2, GĐ7, GĐ8)

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
