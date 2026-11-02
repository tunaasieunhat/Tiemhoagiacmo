# 🌷 Tiệm Hoa Giấc Mơ

Game 3D chibi trồng hoa & bán hoa, chạy trên trình duyệt (điện thoại + máy tính).
Công nghệ: Three.js + Vite, sau này dùng Supabase cho tài khoản online.

**Tiến độ:** ✅ Giai đoạn 1 — bản đồ, camera, 1 lô đất, 3 loài hoa, trồng → thu hoạch, ngày đêm, lưu trên máy.

## Chạy thử trên máy tính

1. Cài **Node.js** (bản LTS) tại https://nodejs.org → bấm tải, cài như phần mềm bình thường.
2. Tải code về: trên GitHub bấm nút xanh **Code → Download ZIP**, rồi giải nén.
3. Mở cửa sổ lệnh trong thư mục vừa giải nén:
   - Windows: mở thư mục, bấm vào thanh địa chỉ, gõ `cmd` rồi Enter.
   - Mac: chuột phải thư mục → *New Terminal at Folder*.
4. Gõ lần lượt (chỉ cần lần đầu gõ dòng 1):
   ```
   npm install
   npm run dev
   ```
5. Mở trình duyệt vào địa chỉ hiện ra, thường là **http://localhost:5173**

**Chơi trên điện thoại (cùng Wi‑Fi với máy tính):** mở địa chỉ dòng `Network: http://192.168.x.x:5173` hiện ra ở bước 4.

## Cách chơi

| Thao tác | Máy tính | Điện thoại |
|---|---|---|
| Di chuyển bản đồ | Kéo chuột / phím W A S D | Kéo 1 ngón |
| Phóng to / thu nhỏ | Cuộn chuột / nút ＋ － | Chụm 2 ngón |
| Chọn ô đất | Bấm chuột | Chạm |

Thanh công cụ dưới: ✋ Xem · 🪏 Xới · 🌱 Gieo · 💧 Tưới · 🧪 Bón · 🧺 Thu.
1 ngày trong game = 24 phút ngoài đời. ⚙️ Cài đặt có nút **tua nhanh** để thử.

## Chỉnh số liệu cân bằng

- `data/flowers.js` — từng loài hoa (thời gian lớn, số lần tưới/ngày, phân bón, giá...)
- `data/config.js` — tốc độ ngày đêm, mức héo, đồ khởi đầu, camera...

Sửa số → lưu file → trình duyệt tự cập nhật.

## Tài liệu

- [Kiến trúc & bảng dữ liệu Supabase](docs/KIEN_TRUC.md)
