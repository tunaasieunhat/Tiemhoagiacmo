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

- ✅ GĐ1–14 xong (xem `README.md`). Kế hoạch đã thống nhất với người dùng (03/11/2026), mỗi GĐ xong thì DỪNG chờ đồng ý:
  còn GĐ15 Vận May (gói Thường/Vàng bằng tiền & vé TRONG GAME, công khai tỉ lệ, bảo hiểm, mảnh; cây hiếm có hiệu ứng động).
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
- **Trang trí tự do** (GĐ10): `save.decor = { owned, placed: [{u,id,x,z,r(độ)}], nextUid }`; logic thuần ở `src/systems/decor.js`
  (`checkPlace` theo vùng cấm `world.decorMap` = vòng tròn/hình chữ nhật/đường đi lấy từ `src/render/world.js`, lưới 0,5).
  Chế độ 🎨: `game.decorEdit` (món đang dời) + `decorView.showGhost`; kéo món nhờ `onDragStart/onDrag` của CameraControls.
  Ảnh chụp cho bạn bè: `snapshot.deco = [[id,x,z,r]]`, đọc bằng `placedFromSnapshot` (làm sạch, đọc được cả kiểu cũ
  `snapshot.decor`). Đồ sự kiện có `event` (vd 'pumpkin' chỉ bán Mùa Thu, `DECOR_EVENTS`). Mô hình ở `src/models/decor.js`;
  hiệu ứng động qua `userData` (spin, bob, float, orbit, dangle, flicker, bubbles) chạy trong `decorView.update`.
- **Làng Hoa** (GĐ11): số liệu `data/village.js` (nhà, dân làng mới Cô Mai & Ông Ba, lịch `SCHEDULES` theo giờ game,
  chỗ `SPOTS`, đường `NODES/EDGES`, câu chào `LINES`). 4 khách quen cũng sống ở làng (ẩn khi đang đứng ở tiệm;
  Bà Tư xong truyện thì lên thành phố, Tết về). Logic thuần `src/systems/village.js` (desiredState, routeTo Dijkstra,
  houseStatus); dựng bản đồ `src/render/village.js` (gọi trong buildWorld; cây cũ giữ nguyên thứ tự ngẫu nhiên, chỉ bỏ cây
  nằm trên đất/đường làng); mô hình `src/models/village.js`; dân làng `src/render/villagers.js` (cửa sổ từng nhà là
  vật liệu riêng, sáng theo `glow.window` khi có người thức). Đảo = nhiều vòng tròn: `decorMap.islands`,
  `controls.regions`. Không đổi cấu trúc save (vị trí dân làng tính từ giờ game).
- **Kết thân** (GĐ12): nội dung ở `data/stories.js` (`FRIEND` số liệu, `BONDS[id]`: birthday, gifts love/like/dislike/hate theo
  'loài' | 'loài:màu' | 'tone:x' | 'meaning:x', giftLines, rewards theo mốc tim, talks, events nhiều cảnh với lựa chọn
  `{t, fp, r, set, next}`, điều kiện `if: 'a|b&!c'`, chữ có điều kiện `{dấu?A|B}`). Save `save.village = { rel: {id: {fp,
  talkDay, giftDay, done, known, claimed, evStep}}, flags }` (SAVE_VERSION 9). Logic thuần `src/systems/relations.js`;
  sự kiện kể dở lưu `evStep` để kể tiếp (không chọn lại cảnh đầu để cày điểm). Game: `startTalk/talkChoose/giftTo/afterBond`
  (XP thưởng qua `gainXp`); HUD: `openVillager/renderTalk/openGift/showBondRewards`; Sổ tay tab `village`.
  GĐ13 (mua đất) dùng `relations.heartsOf(save, id)`.
- **Nhờ việc & mini game** (0.12.1): `data/minigames.js` (FAVOR_RULES thưởng theo 0–3⭐, FAVORS từng người, MINIGAMES độ khó,
  RHYMES câu lục bát). Logic `src/systems/favors.js` (todaysFavor cố định theo ngày bằng hash, lần đầu gặp chắc chắn có;
  finishFavor ghi `rel.favorDay`, `rel.favors[id].best`). UI `src/ui/minigames.js`: `runMiniGame(kind, opts)` → {stars, quit},
  7 game DOM/CSS (needle, hammer, fishing, pour, math, rhyme, memory), bỏ cuộc = 0⭐. Dân làng có việc nhờ hiện 🙏 trên đầu.
  Thử mini game: trang thử import `runMiniGame` + "người chơi tự động" đọc DOM (vd vị trí kim `translateX`).
- **Mua đất của dân làng** (GĐ13): `data/land.js` (LAND_RULES, MOODS, PARCELS: owner, x/z tâm lô, price, minHearts, level,
  lời thoại). Lô có vị trí riêng: lô Chợ `plot.slot` (0–3 → PLOT_SLOTS), lô dân làng `plot.parcel` → dùng
  `plotPosition(plot, idx)` (world.js) / `game.plotPos(pi)`, KHÔNG dùng `PLOT_SLOTS[pi]`. `market.ownedSlots/nextPlot` tính theo slot.
  Logic `src/systems/land.js` (quote cố định theo ngày bằng hash, bargain 1 lần/ngày lưu `save.land.deals`, buyParcel).
  Bản đồ: biển + dây quanh mảnh đất `world.parcels[id]` (pick 'parcel'), vùng cấm đặt đồ; cây cũ trên mảnh đất bị bỏ khi dựng.
  Mua xong trả đồ trang trí trong mảnh đất về kho. Ảnh chụp bạn bè: plots có `sl`/`pc` (tối đa 8 lô).
- **Hoa/bệnh/thời tiết GĐ14**: thêm loài = `data/flowers.js` (+`greenhouseOnly`, `tall`) + `data/variants.js` + mô hình
  `src/models/flowers.js` (bảng `h`, hàm build riêng) + `PLANT_TOP` (farmView) + `flowerSVG` (`src/ui/bouquetPreview.js`).
  `farming.plant(..., { plot })` chặn hoa chỉ trồng nhà kính. Bệnh/thời tiết hoàn toàn theo trường số liệu trong `data/seasons.js`
  (`hour`, `onlyWeather`, `coverSafe`, `growMult`, `healthLoss`, `qPenalty`, `fertCures`, `waters`, `waterMult`, `tallOnly`,
  `blowsCover`, `spawnMult`, `bonusStarChance`, `giftHour`) — logic ở `src/systems/weather.js` / `farming.js`, không ghi cứng tên.
  Hiệu ứng `src/render/weatherFx.js`: Points dùng `sizeAttenuation: false` (camera trực giao ⇒ kích thước tính bằng px);
  cầu vồng & sao băng vẽ theo khung camera (`depthTest: false`) vì nhìn xuống không thấy trời.
- **Dò chạm** (0.9.7): `game.pickAt` bỏ qua vật ẩn (three.js không tự bỏ), chạm sát mặt đất / khe thì lấy ô dưới ngón tay
  (`farmView.tileNear`).
- **Âm thanh / intro** (bản 0.9.2): nhạc nền `public/audio/*.mp3` (đã nén 112 kbps), số liệu ở `data/audio.js`.
  Intro DREAMER GAMES (0.9.4) vẽ bằng CSS + canvas, KHÔNG dùng video (đã xóa `intro.mp4`). Code: `src/audio/audio.js` (MusicPlayer, Sfx tạo tiếng bằng Web Audio), `src/ui/tapFx.js` (cánh hoa khi
  chạm), `src/ui/intro.js` (trời đêm + chữ → bình minh + cánh hoa → tên game → tan vào nông trại; chạm để bỏ qua;
  muốn chụp từng cảnh thì đặt `AUDIO.intro.seconds` lớn trong trang thử). Lựa chọn âm thanh lưu trên máy
  (`localStorage` khóa `thgm:audio`), không nằm trong save. Service worker bỏ qua yêu cầu `Range` (nhạc/video không lưu offline trên web).
- **Chỉ màn hình ngang** (0.9.3): app Android khóa `sensorLandscape` (`scripts/android-setup.mjs`), PWA `orientation: landscape`,
  web trên máy cảm ứng dựng dọc hiện lớp phủ `#rotate` (CSS `(orientation: portrait) and (pointer: coarse)`); intro chờ xoay ngang.
  Kiểm tra giao diện ở khổ 844×390 và 740×360 (không còn cần khổ dọc 390×800 cho điện thoại).
- **App Android toàn màn hình** (0.9.5): `scripts/android-setup.mjs` viết lại `MainActivity.java` (ẩn status + navigation bar,
  `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`, ẩn lại khi resume/focus) + `capacitor.config.json` `SystemBars.hidden: true`.
  CSS dùng `--safe-top/bottom/left/right` = max(env(safe-area-inset-*), --safe-area-inset-* do Capacitor gửi) để né tai thỏ.
- **App Android bắt buộc cập nhật** (0.9.3): `src/online/updater.js` hỏi `ONLINE.apkReleaseApi` (GitHub Releases), APK có số
  phiên bản cao hơn ⇒ sự kiện `app-update-required` ⇒ `hud.showForceUpdate()` che toàn màn hình. Vì vậy **mỗi lần muốn app
  nhận bản mới phải tăng `version`**; đẩy code mà không tăng version thì app không bị bắt cập nhật.
- Code chỉ dành cho app Android nằm ở `src/online/native.js` (kiểm tra `isNative()`); trên web các hàm không làm gì.
- Đồ họa theo mức `GRAPHICS` trong `data/config.js` (`settings.quality`: auto/high/medium/low); bundle build thành
  1 file JS (`inlineDynamicImports`) để ghép được bản xem thử.
- **Save có phiên bản** (hiện `SAVE_VERSION = 10`). Đổi cấu trúc save ⇒ tăng `SAVE_VERSION` và thêm
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
