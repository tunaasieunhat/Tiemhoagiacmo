// =============================================================
//  CẤU HÌNH ONLINE (Supabase)
// =============================================================
//  Dán 2 giá trị lấy từ Supabase Dashboard → Project Settings → API:
//   - supabaseUrl     : "Project URL"   (dạng https://xxxx.supabase.co)
//   - supabaseAnonKey : khóa "anon public" hoặc "Publishable key" (sb_publishable_...)
//
//  ⚠️ TUYỆT ĐỐI KHÔNG dán khóa "service_role" hay "Secret key" (sb_secret_...) vào đây!
//     Khóa anon/publishable được phép công khai vì dữ liệu đã được bảo vệ bằng RLS.
//
//  Để trống => game chạy chế độ ngoại tuyến (chơi khách, lưu trên máy).
//  (Có thể thay bằng biến môi trường VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_SITE_URL / VITE_APK_URL)
// =============================================================
export const ONLINE = {
  supabaseUrl: '',
  supabaseAnonKey: '',

  // Địa chỉ trang web của game sau khi đưa lên mạng (GĐ9), vd 'https://tiem-hoa-giac-mo.netlify.app'
  // Dùng cho: ứng dụng Android kiểm tra bản mới, liên kết trong email xác nhận / quên mật khẩu.
  siteUrl: 'https://tiem-hoa-giac-mo.netlify.app',
  // Trang tải APK mới (GitHub Releases), vd 'https://github.com/<tên>/<repo>/releases/latest'
  apkDownloadUrl: 'https://github.com/tunaasieunhat/Tiemhoagiacmo/releases/latest',
  checkUpdateMinutes: 5,  // bao lâu hỏi máy chủ xem có bản mới một lần

  cloudSyncSeconds: 45,   // tự đẩy save lên mạng tối đa mỗi bao nhiêu giây
  retrySeconds: 20,       // lỗi mạng thì thử lại sau bao lâu
  enableGoogle: true,     // hiện nút "Đăng nhập bằng Google" (cần bật Google trong Supabase)
};
