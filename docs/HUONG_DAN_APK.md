# Ứng dụng Android (APK)

APK được **GitHub tự đóng gói** (GitHub Actions) — bạn không cần cài Android Studio hay gì trên máy.
Game trong APK chứa sẵn toàn bộ file, chơi được khi mất mạng.

---

## 1. Lấy APK bản thử (không cần làm gì thêm)

Mỗi lần code game thay đổi và được đẩy lên GitHub, APK tự được tạo:

1. Vào repo trên GitHub → tab **Actions** → chọn **Đóng gói APK Android** ở cột trái.
2. Bấm vào lượt chạy mới nhất có dấu ✅ (mất khoảng 5–8 phút).
3. Kéo xuống mục **Artifacts** → bấm **TiemHoaGiacMo-apk** → được file `.zip` → giải nén ra file `.apk`.
4. Gửi file `.apk` sang điện thoại (Zalo, Google Drive, cáp USB...) → mở file → cho phép
   **"Cài ứng dụng không rõ nguồn gốc"** khi được hỏi → Cài đặt.

Muốn chạy ngay mà không đợi: tab **Actions** → **Đóng gói APK Android** → **Run workflow** → chọn nhánh → **Run workflow**.

> ⚠️ Bản thử được ký bằng khóa tạm, mỗi lần build khác nhau ⇒ cài bản mới phải **gỡ app cũ trước**
> (tiến độ lưu trên máy sẽ mất, nhưng nếu đã đăng nhập thì tiến độ trên mạng vẫn còn).
> Làm bước 2 để hết phiền này.

## 2. Tạo khóa ký chính thức (làm 1 lần)

Khóa ký giúp các bản APK sau **cài đè lên bản cũ**, giữ nguyên dữ liệu.

1. Tab **Actions** → chọn **Tạo khóa ký APK** → **Run workflow** → **Run workflow**.
2. Đợi ~1 phút → bấm vào lượt chạy → **Artifacts** → tải **khoa-ky-apk** → giải nén.
3. Mở file `HUONG_DAN.txt` trong đó và làm theo: vào **Settings → Secrets and variables → Actions →
   tab Secrets → New repository secret**, tạo đủ **4 secret**:
   `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
4. Cất 1 bản sao file `release.jks` + mật khẩu ở nơi an toàn, rồi **xóa** thư mục vừa tải khỏi máy.
   (File trên GitHub tự xóa sau 1 ngày.)
5. Từ lần build sau, APK được ký chính thức. Gỡ bản thử cũ 1 lần, cài bản mới — các lần sau cài đè thoải mái.

⚠️ **Đừng làm mất khóa** và **đừng chạy lại** "Tạo khóa ký APK" (sẽ ra khóa khác ⇒ người chơi lại phải gỡ app).

## 3. Phát hành bản cho mọi người tải

1. Tăng `"version"` trong `package.json` và ghi chú trong `data/changelog.js`.
2. Trên GitHub: **Releases** (cột phải trang repo) → **Draft a new release** → **Choose a tag** → gõ `v0.9.0`
   (đúng số phiên bản) → **Create new tag** → **Publish release**.
3. Khoảng 8 phút sau, file `TiemHoaGiacMo-0.9.0.apk` tự xuất hiện trong release đó.
   Link tải cố định: `https://github.com/<tên-bạn>/Tiemhoagiacmo/releases/latest`
   (repo riêng tư thì chỉ người có quyền vào repo mới tải được — muốn chia sẻ rộng thì đưa file lên Google Drive).

## 4. Để app Android biết có bản mới & đăng nhập được

Vào **Settings → Secrets and variables → Actions → tab Variables → New repository variable**:

| Name | Value |
|---|---|
| `SITE_URL` | địa chỉ web của game (xem HUONG_DAN_DUA_LEN_MANG.md) |
| `APK_URL` | link trang tải APK (vd `https://github.com/<tên>/Tiemhoagiacmo/releases/latest`) |
| `SUPABASE_URL` | Project URL của Supabase |
| `SUPABASE_ANON_KEY` | khóa anon public / publishable (KHÔNG dùng khóa secret) |

App sẽ hỏi trang web xem có phiên bản mới không; nếu có, hiện nút **Tải bản mới** mở trang tải APK.

Đăng nhập trong app (Supabase → **Authentication → URL Configuration → Redirect URLs**): thêm
`vn.tiemhoagiacmo.game://auth`. Đăng nhập Google trong app sẽ mở trình duyệt điện thoại rồi tự quay về game.

## 5. Lên Google Play (sau này)

Cần tài khoản nhà phát triển Google Play (phí 25 USD một lần) và file dạng **AAB**. Khi bạn sẵn sàng, nhắn để
thêm bước tạo AAB vào quy trình build.
