# CLAUDE.md — Tiệm Hoa Giấc Mơ

Game 3D chibi **online** về nông trại trồng hoa & tiệm bán hoa, chạy trên trình duyệt (điện thoại + máy tính),
sau này đóng gói Android. Three.js + JavaScript (Vite), backend Supabase.

## Người dùng & cách làm việc (quan trọng)

- Chủ dự án **không biết lập trình**. Luôn trả lời **bằng tiếng Việt**, ngắn gọn, hướng dẫn từng bước khi họ cần thao tác.
- Làm **theo giai đoạn (GĐ)**. Xong mỗi giai đoạn: **DỪNG**, tóm tắt, hướng dẫn chạy thử, **đợi đồng ý** mới làm tiếp.
- Giao diện, thông báo lỗi, chú thích code và commit message đều **tiếng Việt**.
- Số liệu cân bằng luôn để trong `data/*.js` (có chú thích tiếng Việt) để người dùng tự chỉnh.
- Không tự ý tạo Pull Request. Phát triển trên nhánh được giao (hiện tại: `ccr-845954e0-2hh7a1`).

## Tiến độ

- ✅ GĐ1–9 xong (xem `README.md`) — hết kế hoạch ban đầu. Việc tiếp theo do người dùng quyết định.
- Đưa lên mạng: Netlify (`netlify.toml`, `docs/HUONG_DAN_DUA_LEN_MANG.md`) — trang thật: https://tiem-hoa-giac-mo.netlify.app
  (Netlify đang deploy nhánh `ccr-845954e0-2hh7a1`; `main` chỉ có commit đầu tiên). APK: Capacitor + GitHub Actions
  (`.github/workflows/android.yml`, `android-keystore.yml`, `docs/HUONG_DAN_APK.md`); thư mục `android/` KHÔNG commit,
  được tạo trong CI bằng `npx cap add android` + `scripts/android-setup.mjs`. Làm giống repo Ôn Luyện Nha Khoa: 1 secret
  `ANDROID_KEYSTORE_B64` (PKCS12, mật khẩu cố định `tiemhoagiacmo`, alias `tiemhoa`); build đã ký thì tự đăng Releases
  (tag `apk-<version>-<run>`, ghi chú từ `data/changelog.js`), link tải cố định
  `releases/latest/download/TiemHoaGiacMo.apk`. Repo GitHub là **công khai**.
- Supabase đã cài (03/11/2026): project `nhwqubttbkpcuckrduij` (vùng Frankfurt), khóa publishable trong `data/online.js`,
  đã chạy 3 file SQL. `enableGoogle: false` cho tới khi người dùng bật Google. Máy chủ Supabase thật KHÔNG truy cập được
  từ môi trường của Claude (proxy chặn) ⇒ người dùng tự thử. Hướng dẫn cài: `docs/HUONG_DAN_SUPABASE.md`.

## Lệnh

```bash
npm install
npm run dev               # máy chủ phát triển (--host để thử trên điện thoại cùng Wi-Fi)
npm run build             # build ra dist/
npm run build:functions   # đóng gói Edge Function thành 1 file supabase/functions/<tên>/index.ts
npx vite preview --port 4173   # chạy bản build (có service worker, version.json) để thử offline / thông báo cập nhật
```

Chưa có bộ test tự động trong repo (xem mục Kiểm thử).

## Cấu trúc

```
data/            Số liệu cân bằng (flowers, variants, shop, wrapping, customers, regulars, market, levels,
                 seasons, quests, automation, decor, contest, config, online, badwords)
src/main.js      Khởi động: đăng nhập → chọn save (máy/cloud) → tạo Game + Hud
src/game.js      Bộ điều khiển trung tâm: nối save ↔ systems ↔ render ↔ UI (qua Emitter)
src/systems/     LOGIC THUẦN, không import three/DOM → dùng lại được trên máy chủ
src/save/        schema.js (SAVE_VERSION + MIGRATIONS), saveManager.js, localStore.js (IndexedDB)
src/online/      supabase.js, auth.js, cloudSync.js, social*.js, ranking.js, showcase.js, errors.js
src/render/      Three.js: stage (camera trực giao isometric), world, farmView, customers, player, decorView...
src/models/      Mô hình chibi dựng từ khối hình (không dùng asset ngoài)
src/ui/          HUD + các bảng (shop, market, lab, notebook, friends, quests, rank, auth)
supabase/migrations/   SQL (chạy theo thứ tự tên file trong Supabase SQL Editor)
supabase/functions-src/ Nguồn Edge Function → build ra supabase/functions/ (KHÔNG sửa tay file build)
docs/            KIEN_TRUC.md (kiến trúc + bảng dữ liệu), HUONG_DAN_SUPABASE.md
```

## Quy ước cần giữ

- **Phát hành bản mới**: tăng `version` trong `package.json` + thêm ghi chú vào `data/changelog.js`. Build sinh
  `dist/version.json` (game hỏi định kỳ để báo "Có bản cập nhật") và `dist/sw.js` từ `src/sw-template.js`
  (chơi offline). Trong code dùng `GAME_VERSION`/`BUILD_ID` từ `src/version.js`, không ghi cứng số phiên bản.
- Máy chạy bản game cũ không được ghi đè save của bản mới: `push_save` trả `outdated`, CloudSync dừng đồng bộ
  và hiện banner yêu cầu cập nhật.
- **Âm thanh / intro** (bản 0.9.2): nhạc nền `public/audio/*.mp3` (đã nén 112 kbps), video `public/intro.mp4`, số liệu ở
  `data/audio.js`. Code: `src/audio/audio.js` (MusicPlayer, Sfx tạo tiếng bằng Web Audio), `src/ui/tapFx.js` (cánh hoa khi
  chạm), `src/ui/intro.js` (bị chặn tự phát tiếng ⇒ hiện "Chạm để bắt đầu"). Lựa chọn âm thanh lưu trên máy
  (`localStorage` khóa `thgm:audio`), không nằm trong save. Service worker bỏ qua yêu cầu `Range` (nhạc/video không lưu offline trên web).
- **Chỉ màn hình ngang** (0.9.3): app Android khóa `sensorLandscape` (`scripts/android-setup.mjs`), PWA `orientation: landscape`,
  web trên máy cảm ứng dựng dọc hiện lớp phủ `#rotate` (CSS `(orientation: portrait) and (pointer: coarse)`); intro chờ xoay ngang.
  Kiểm tra giao diện ở khổ 844×390 và 740×360 (không còn cần khổ dọc 390×800 cho điện thoại).
- **App Android bắt buộc cập nhật** (0.9.3): `src/online/updater.js` hỏi `ONLINE.apkReleaseApi` (GitHub Releases), APK có số
  phiên bản cao hơn ⇒ sự kiện `app-update-required` ⇒ `hud.showForceUpdate()` che toàn màn hình. Vì vậy **mỗi lần muốn app
  nhận bản mới phải tăng `version`**; đẩy code mà không tăng version thì app không bị bắt cập nhật.
- Code chỉ dành cho app Android nằm ở `src/online/native.js` (kiểm tra `isNative()`); trên web các hàm không làm gì.
- Đồ họa theo mức `GRAPHICS` trong `data/config.js` (`settings.quality`: auto/high/medium/low); bundle build thành
  1 file JS (`inlineDynamicImports`) để ghép được bản xem thử.
- **Save có phiên bản** (hiện `SAVE_VERSION = 7`). Đổi cấu trúc save ⇒ tăng `SAVE_VERSION` và thêm
  `MIGRATIONS[phiên_bản_cũ]` trong `src/save/schema.js`; **không bao giờ làm mất tiến độ**. `fillDefaults` tự bổ sung
  trường thiếu (vì vậy số lượng hạt về 0 thì giữ khóa với giá trị 0, không xóa khóa).
- **Mã vật phẩm**: hạt `"loài:màu"` (vd `rose:red`), hoa trong kho `"loài:màu|sao"` (vd `rose:red|3`).
  Luôn dùng helper trong `src/systems/variants.js` (`vkey`, `parseVkey`, `flowerKey`, `parseFlowerKey`).
- **Thời gian**: 1 giây thật = 1 phút game; 1 ngày game = 24 phút; 1 mùa = 7 ngày game. Lịch/mùa/lễ hội tính theo
  ngày game (`src/systems/calendar.js`). Riêng giới hạn online & mùa thi tính theo **giờ Việt Nam, ngày/tuần thật**.
- `game.advance()` chia nhỏ thời gian thành bước ≤ 30 phút để không bỏ sót mốc giờ (bão 14:00, dịch 10:00, qua ngày).
  Mô phỏng khi vắng mặt dùng `offline: true` (thiệt hại giảm, không sinh khách).
- Khi **đang thăm nhà bạn** (`game.visit`), farmView đang vẽ nông trại của bạn ⇒ cập nhật nông trại mình phải qua
  `game.refreshFarm()` (tự bỏ qua khi đang thăm), không gọi thẳng `farmView.sync(save)`.
- Vật thể chạm được trong 3D gắn `userData.pick = { kind, ... }`; danh sách gốc ở `game.pickRoots` (`updateLockedSlots`).
- UI dựng bằng chuỗi HTML: **luôn `esc()`** dữ liệu chữ; dữ liệu từ người chơi khác (ảnh chụp nông trại) phải làm sạch
  (`num()` cho số). Không dùng `confirm()/alert()` (bị chặn trong trang nhúng) — dùng nút bấm 2 lần.
- Trình duyệt **chỉ dùng khóa anon/publishable**; `src/online/supabase.js` từ chối khóa `service_role`/`sb_secret_`.
- Mọi ghi dữ liệu online đi qua **hàm SQL `SECURITY DEFINER`** có kiểm tra bạn bè/giới hạn/ngày (RLS chặn ghi thẳng);
  lỗi trả về dạng `SOCIAL: <câu tiếng Việt>` để `viError()` hiển thị. Điểm cuộc thi chỉ ghi qua Edge Function
  `contest-submit` (chấm lại bằng `src/systems/bouquet.js`, khóa service_role chỉ ở máy chủ).
- File SQL phải **chạy lại được nhiều lần** (`create or replace`, `if not exists`, `drop policy if exists`).
- Sửa luật chấm cuộc thi (`bouquet.js`, `contest.js`, `variants.js`, `wrapping.js`) ⇒ chạy `npm run build:functions`
  và báo người dùng dán lại Edge Function.

## Giới hạn đã biết

- Kinh tế (tiền, kho đồ) do **máy người chơi lưu**; máy chủ chỉ đối chiếu với save đã đồng bộ + giới hạn tốc độ tăng
  XP/uy tín, giới hạn quà/ngày, điểm thi ≤ 110. Người sửa được save vẫn gian lận được trong các giới hạn đó.
  Đã nói rõ với người dùng; chuyển kinh tế lên máy chủ là việc lớn, chỉ làm khi họ yêu cầu.
- Trang xem thử (Artifact) chạy trong khung bảo mật **không gọi được máy chủ ngoài** ⇒ chỉ chơi chế độ khách.

## Kiểm thử

Chưa có test tự động trong repo. Các giai đoạn trước được kiểm bằng:
- Playwright + Chromium có sẵn (`require('playwright')`, launch với
  `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`), chụp màn hình khổ ngang 844×390 (điện thoại) và 1280×760.
  Trong trang có `window.__game` để điều khiển trạng thái khi test.
- "Máy chủ Supabase giả" bằng `page.route('https://fake.supabase.co/**', ...)`, chạy dev với
  `VITE_SUPABASE_URL=https://fake.supabase.co VITE_SUPABASE_ANON_KEY=<JWT role anon giả>`.
- SQL: Postgres 16 cục bộ (`/usr/lib/postgresql/16/bin`) với schema `auth` giả (bảng `auth.users`, hàm `auth.uid()`
  đọc `request.jwt.claim.sub`, các role `anon`, `authenticated`, `service_role`).
- Edge Function: test `handleContestSubmit` trong `src/systems/contestServer.js` bằng Node với `db` giả.
- Logic thuần (`src/systems/*`, migration save) chạy được trực tiếp bằng `node --input-type=module`.

Sau mỗi thay đổi lớn: build, kiểm các luồng cũ không hỏng (trồng → bán → chợ → thời tiết → lai tạo → online).

## Bản chơi thử cho người dùng

Người dùng xem game qua một Artifact riêng tư (https://claude.ai/artifact/VeiUX3dnuamNi5qF6LctGu). Cách cập nhật:
`npm run build`, ghép `dist/assets/*.js` + `*.css` thành 1 file HTML (JS inline, thay `</script` bằng `<\/script`,
font Google Fonts), rồi publish lại **cùng đường dẫn file** để giữ nguyên link.
