# Đưa game lên mạng miễn phí (Netlify)

Sau khi làm xong, game có một địa chỉ web kiểu `https://tiem-hoa-giac-mo.netlify.app`. Ai có link là chơi được
trên điện thoại / máy tính, cài được lên màn hình chính như ứng dụng. Mỗi lần code mới được đẩy lên GitHub,
Netlify **tự cập nhật**, và người đang chơi sẽ thấy thông báo **"Có bản cập nhật mới"**.

Gói miễn phí của Netlify: 100 GB băng thông/tháng, dùng được với repo GitHub riêng tư.

---

## Bước 1 — Tạo tài khoản Netlify

1. Vào **https://app.netlify.com/signup** → chọn **Sign up with GitHub** → cho phép truy cập.

## Bước 2 — Kết nối repo

1. Bấm **Add new project** (hoặc *Add new site*) → **Import an existing project** → **GitHub**.
2. Nếu không thấy repo `Tiemhoagiacmo`: bấm *Configure the Netlify app on GitHub* → chọn repo này → Save.
3. Chọn repo **Tiemhoagiacmo**.
4. **Branch to deploy**: chọn nhánh chứa bản game bạn muốn đưa lên (vd `main`).
5. Các ô *Build command* / *Publish directory* đã được điền sẵn nhờ file `netlify.toml`
   (`npm run build` và `dist`). Không cần sửa.

## Bước 3 — Gắn Supabase (nếu đã cài, xem HUONG_DAN_SUPABASE.md)

Vẫn ở màn hình đó, mục **Environment variables** → *Add variable*, thêm:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | Project URL của Supabase |
| `VITE_SUPABASE_ANON_KEY` | khóa **anon public** / **Publishable** (KHÔNG dùng khóa service_role / secret) |

(Hoặc điền thẳng vào `data/online.js` — cả hai cách đều được, khóa này công khai được.)

## Bước 4 — Deploy

Bấm **Deploy**. Đợi 1–2 phút → trạng thái **Published** → bấm vào link để chơi.

Đổi tên link cho đẹp: **Project configuration → Change project name** → vd `tiem-hoa-giac-mo`.

## Bước 5 — Việc nhỏ sau khi có địa chỉ web

1. Mở `data/online.js`, điền `siteUrl: 'https://tiem-hoa-giac-mo.netlify.app'` (địa chỉ của bạn).
   Ứng dụng Android dùng địa chỉ này để biết có bản mới.
2. Nếu dùng Supabase: **Authentication → URL Configuration**:
   - **Site URL**: đổi thành địa chỉ web mới.
   - **Redirect URLs**: thêm `https://tiem-hoa-giac-mo.netlify.app/**`
3. Nếu dùng đăng nhập Google: Google Cloud Console → OAuth client → **Authorized JavaScript origins**:
   thêm địa chỉ web mới.

## Cài game lên điện thoại như ứng dụng

- **Android (Chrome)**: mở link → menu ⋮ → **Cài đặt ứng dụng** / **Thêm vào màn hình chính**.
- **iPhone (Safari)**: mở link → nút Chia sẻ → **Thêm vào MH chính**.

Sau lần mở đầu tiên, game **chơi được cả khi mất mạng** (tiến độ tự đồng bộ khi có mạng lại).

## Phát hành bản mới

1. Mở `package.json` → tăng `"version"` (vd `0.9.0` → `0.9.1`).
2. Mở `data/changelog.js` → thêm ghi chú bản mới lên đầu danh sách (người chơi sẽ đọc thấy).
3. Đẩy code lên nhánh đang deploy → Netlify tự build → người chơi thấy thông báo "Có bản cập nhật", bấm **Tải lại ngay**.

---

### Cách khác (không bắt buộc): Cloudflare Pages

Cũng miễn phí, băng thông không giới hạn: dash.cloudflare.com → **Workers & Pages → Create → Pages →
Connect to Git** → chọn repo → Build command `npm run build`, Build output `dist`, biến môi trường
`NODE_VERSION = 22` và 2 biến `VITE_SUPABASE_*` như trên → **Save and Deploy**.
