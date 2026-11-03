# Ứng dụng Android (APK)

APK được **GitHub tự đóng gói** (GitHub Actions), giống cách làm của dự án Ôn Luyện Nha Khoa.
Bạn không cần cài Android Studio hay gì trên máy. Game trong APK có sẵn toàn bộ file, chơi được khi mất mạng.

**Link tải (luôn là bản mới nhất):**
https://github.com/tunaasieunhat/Tiemhoagiacmo/releases/latest/download/TiemHoaGiacMo.apk

> Repo này **công khai**, nên ai có link cũng tải được APK. Link chỉ chạy được sau khi làm xong bước 1 bên dưới.

---

## 1. Tạo khóa ký (làm 1 lần duy nhất)

Khóa ký giúp các bản APK sau **cài đè lên bản cũ**, giữ nguyên dữ liệu. Có khóa thì GitHub mới tự đăng APK
lên trang **Releases**.

1. Vào repo trên GitHub → tab **Actions** → cột trái chọn **Tạo khóa ký APK** → bấm **Run workflow** → **Run workflow**.
2. Đợi ~1 phút, bấm vào lượt chạy (dấu ✅) → kéo xuống mục **Artifacts** → tải **khoa-ky-apk** → giải nén.
3. Mở file `ANDROID_KEYSTORE_B64.txt` → chọn tất cả → sao chép.
4. Vào **Settings** (của repo) → **Secrets and variables** → **Actions** → tab **Secrets** → **New repository secret**:
   - **Name**: `ANDROID_KEYSTORE_B64`
   - **Secret**: dán nội dung vừa sao chép → **Add secret**.
5. Cất 1 bản sao file `release.p12` ở nơi an toàn (USB, Google Drive riêng tư), rồi xóa thư mục vừa tải khỏi máy.
   (File trên GitHub tự xóa sau 1 ngày.)

⚠️ **Đừng làm mất khóa.** Quy trình tự chặn không cho tạo khóa thứ hai khi đã có secret.

## 2. Phát hành APK

Sau khi có khóa, **mỗi lần code game được đẩy lên GitHub**, khoảng 8 phút sau APK mới tự xuất hiện ở trang
**Releases** (cột phải trang repo), tên file luôn là `TiemHoaGiacMo.apk` ⇒ link tải ở trên luôn đúng.

Muốn build ngay mà không đợi: tab **Actions** → **Đóng gói APK Android** → **Run workflow** → **Run workflow**.

Nếu lượt chạy bị ❌: bấm vào lượt chạy, dòng chữ đỏ ở mục *Annotations* cho biết lý do
(thường gặp: dán secret thiếu ký tự ⇒ xóa secret rồi dán lại toàn bộ file).

## 3. App tự báo có bản mới

Khi phát hành bản mới (tăng `"version"` trong `package.json` + ghi chú trong `data/changelog.js`):
- Trang web cập nhật, app trên điện thoại so số phiên bản với trang web và hiện nút **Tải bản mới**.
- Bấm nút ⇒ tải `TiemHoaGiacMo.apk` ⇒ mở file ⇒ **Cập nhật** (cài đè, giữ nguyên tiến độ).

Ghi chú trong `data/changelog.js` cũng được dùng làm mô tả trên trang Releases.

## 4. Cài lên điện thoại

1. Mở link tải trên điện thoại (Chrome) → tải file `TiemHoaGiacMo.apk`.
2. Mở file → nếu được hỏi, cho phép **"Cài ứng dụng không rõ nguồn gốc"** → **Cài đặt**.

> Bản thử trước khi có khóa (tải ở mục Artifacts) được ký tạm ⇒ khi chuyển sang bản chính thức phải **gỡ app cũ 1 lần**.

## 5. Đăng nhập trong app (khi đã cài Supabase)

Supabase → **Authentication → URL Configuration → Redirect URLs**: thêm `vn.tiemhoagiacmo.game://auth`.
Đăng nhập Google trong app sẽ mở trình duyệt điện thoại rồi tự quay về game.

Nếu Supabase được gắn bằng biến môi trường (không điền thẳng vào `data/online.js`), vào **Settings → Secrets and
variables → Actions → tab Variables** thêm `SUPABASE_URL` và `SUPABASE_ANON_KEY` (khóa công khai, KHÔNG dùng khóa secret).

## 6. Lên Google Play (sau này)

Cần tài khoản nhà phát triển Google Play (phí 25 USD một lần) và file dạng **AAB**. Khi bạn sẵn sàng, nhắn để
thêm bước tạo AAB vào quy trình build.
