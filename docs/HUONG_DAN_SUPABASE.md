# Hướng dẫn cài đặt Supabase (Giai đoạn 2)

Supabase là dịch vụ miễn phí lo phần **tài khoản** và **cơ sở dữ liệu** cho game.
Làm một lần, khoảng 15 phút. Phần Google (bước 5) có thể làm sau.

---

## Bước 1 — Tạo tài khoản & project

1. Vào **https://supabase.com** → bấm **Start your project** → đăng nhập bằng GitHub (tiện nhất).
2. Bấm **New project**:
   - **Name**: `tiem-hoa-giac-mo`
   - **Database Password**: bấm *Generate a password* rồi **lưu lại** ở chỗ an toàn (không dán vào game).
   - **Region**: chọn **Southeast Asia (Singapore)** cho nhanh ở Việt Nam.
   - Gói **Free**.
3. Bấm **Create new project**, đợi khoảng 1–2 phút.

> Lưu ý gói Free: project **bị tạm dừng nếu 7 ngày không ai dùng**. Khi đó vào Dashboard bấm *Restore* là chạy lại, không mất dữ liệu.

## Bước 2 — Tạo bảng dữ liệu (chạy file SQL)

1. Trong project, menu trái chọn **SQL Editor** → **New query**.
2. Mở file `supabase/migrations/20261102000001_gd2_profiles_saves.sql` trong code (trên GitHub bấm vào file → nút **Copy raw file**).
3. Dán toàn bộ vào ô soạn thảo → bấm **Run** (góc dưới phải).
4. Thấy dòng *Success. No rows returned* là xong. (Chạy lại lần nữa cũng không sao.)

Kiểm tra: menu **Table Editor** sẽ có các bảng `profiles`, `saves`, `banned_words`. Mỗi bảng có nhãn bảo mật RLS đã bật.

**Tiếp theo (Giai đoạn 7 — bạn bè):** làm y hệt với file
`supabase/migrations/20261103000001_gd7_social.sql` (New query → dán → Run).
Sẽ có thêm các bảng `friendships`, `farm_showcase`, `farm_help`, `gifts`, `guestbook`, `rate_events`.
Luôn chạy các file theo thứ tự ngày trong tên file.

**Giai đoạn 8 (xếp hạng & cuộc thi):** chạy tiếp file `supabase/migrations/20261104000001_gd8_leaderboard_contest.sql`.
(Nếu bạn đã chạy file GĐ7 trước đây, hãy chạy lại file GĐ7 một lần nữa để nhận bản vá bảo mật.)

## Bước 2b — Cài Edge Function cho cuộc thi hoa (Giai đoạn 8)

Cuộc thi hoa được chấm điểm trên máy chủ bằng một **Edge Function** tên `contest-submit`.

1. Menu trái **Edge Functions** → **Deploy a new function** → chọn **Via Editor**.
2. Đặt tên function đúng là: `contest-submit`
3. Xóa hết code mẫu trong ô soạn thảo.
4. Mở file `supabase/functions/contest-submit/index.ts` (trên GitHub bấm **Copy raw file**) → dán toàn bộ vào.
5. Bấm **Deploy function**. Đợi vài giây thấy trạng thái *Active* là xong.
6. Mở function `contest-submit` → tab **Details** → mục *Function configuration* → **tắt**
   **Verify JWT with legacy secret** → **Save changes**. (Project mới dùng khóa ký kiểu mới; code của function
   đã tự kiểm tra người chơi nên tắt vẫn an toàn.)

Không cần dán khóa bí mật nào: Supabase tự cấp khóa `service_role` cho function chạy **trên máy chủ**
(khóa này không bao giờ xuống trình duyệt). Mỗi khi game cập nhật luật chấm điểm,
mình sẽ báo bạn dán lại file này.

## Bước 2c — (Nên làm) Để GitHub tự đưa Edge Function lên, khỏi dán tay

Làm 1 lần, từ đó mỗi khi game đổi luật chấm điểm, GitHub tự cập nhật `contest-submit`.
Làm được trên điện thoại.

1. Mở https://supabase.com/dashboard/account/tokens → **Generate new token** → đặt tên `github` →
   **Generate token** → bấm nút sao chép mã (bắt đầu bằng `sbp_`). Mã chỉ hiện 1 lần.
2. Mở repo trên GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
3. Name: `SUPABASE_ACCESS_TOKEN` · Secret: dán mã vừa sao chép → **Add secret**.
4. Tab **Actions** → chọn **Đưa Edge Function lên Supabase** → **Run workflow** để chạy thử lần đầu.
   Thấy dấu ✅ xanh là xong.

⚠️ Mã `sbp_...` là chìa khóa quản lý project: **chỉ dán vào GitHub Secrets**, không gửi cho ai (kể cả Claude).

## Bước 3 — Lấy 2 giá trị cần thiết cho game

Menu trái **Project Settings** (bánh răng) → **API** (hoặc **Data API** / **API Keys**):

| Cần lấy | Ở đâu | Ví dụ |
|---|---|---|
| **Project URL** | mục *Project URL* | `https://abcdxyz.supabase.co` |
| **Khóa công khai** | *anon public* (tab Legacy API keys) **hoặc** *Publishable key* | `eyJhbGciOi...` hoặc `sb_publishable_...` |

⚠️ **KHÔNG BAO GIỜ** dùng khóa **service_role** hoặc **Secret key** (`sb_secret_...`) cho game.
Game có sẵn kiểm tra: nếu dán nhầm khóa bí mật, game sẽ từ chối và báo lỗi.

**Cách đưa vào game:** gửi 2 giá trị này cho mình (khóa công khai được phép chia sẻ), hoặc tự mở
file `data/online.js` và dán vào:

```js
supabaseUrl: 'https://abcdxyz.supabase.co',
supabaseAnonKey: 'eyJhbGciOi...',
```

## Bước 4 — Cài đặt đăng nhập bằng email

Menu **Authentication**:

1. **Sign In / Providers → Email**: đảm bảo **Enable Email provider** đang bật.
   - **Confirm email** (bắt xác nhận email) — giao diện mới nằm ở trang **Sign In / Providers**, mục
     **User Signups** (không nằm trong khung Email). Gói Free chỉ gửi ~2 email/giờ nên lúc đầu nên **tắt**;
     khi có nhiều người chơi thì gắn dịch vụ email riêng rồi bật lại.
   - **Minimum password length**: đặt **8**.
2. **URL Configuration**:
   - **Site URL**: `http://localhost:5173` (sau này đổi thành địa chỉ web thật ở GĐ9).
   - **Redirect URLs** → *Add URL*, thêm lần lượt:
     - `http://localhost:5173`
     - `http://localhost:5173/**`
     - Địa chỉ dạng `http://192.168.x.x:5173` mà máy tính hiện ra khi chạy `npm run dev` (để thử trên điện thoại).

     - Khi đã đưa game lên mạng (GĐ9): `https://<tên-trang-của-bạn>.netlify.app/**`
     - Cho ứng dụng Android: `vn.tiemhoagiacmo.game://auth`

   Các địa chỉ này là nơi người chơi được đưa về sau khi bấm link trong email (xác nhận, quên mật khẩu)
   hoặc sau khi đăng nhập Google.

> **Giới hạn email gói Free:** Supabase chỉ gửi được **vài email mỗi giờ** bằng máy chủ email có sẵn.
> Đủ để thử nghiệm. Khi có nhiều người chơi, cần gắn dịch vụ gửi email riêng (mình sẽ hướng dẫn ở GĐ9).

## Bước 5 — Đăng nhập Google (có thể làm sau)

1. Vào **https://console.cloud.google.com** → đăng nhập Gmail → tạo project mới tên `tiem-hoa-giac-mo`.
2. Menu **APIs & Services → OAuth consent screen** (hoặc *Google Auth Platform → Branding*):
   chọn **External**, điền tên app *Tiệm Hoa Giấc Mơ*, email hỗ trợ, rồi lưu.
   Mục **Audience**: bấm **Publish app** khi muốn mọi người dùng được (lúc thử chỉ cần thêm Gmail của bạn vào *Test users*).
3. **Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: dán địa chỉ callback lấy từ Supabase:
     Supabase → **Authentication → Sign In / Providers → Google** → dòng *Callback URL (for OAuth)*,
     dạng `https://abcdxyz.supabase.co/auth/v1/callback`.
   - Bấm **Create** → chép **Client ID** và **Client Secret**.
4. Quay lại Supabase → **Authentication → Sign In / Providers → Google** → bật **Enable**,
   dán Client ID + Client Secret → **Save**.

Client Secret của Google chỉ dán vào Supabase, **không** dán vào code game.

## Bước 6 — Chạy thử

```
npm install
npm run dev
```
Mở `http://localhost:5173` → màn hình đăng nhập hiện ra → đăng ký → tạo nhân vật → chơi.

Kiểm tra trên Supabase: **Authentication → Users** thấy tài khoản mới;
**Table Editor → saves** thấy save của bạn (khoảng 1 phút cập nhật 1 lần).

## Chỉnh danh sách từ cấm

**Table Editor → banned_words → Insert row**:
- `word`: từ cần chặn (chữ thường, có dấu).
- `match`: `token` (chặn khi là một từ riêng) hoặc `substring` (chặn khi xuất hiện ở bất kỳ đâu).

Đồng thời có thể thêm vào `data/badwords.js` để game báo lỗi ngay khi gõ (không bắt buộc).
