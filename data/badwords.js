// Danh sách từ cấm phía trình duyệt (chỉ để báo lỗi nhanh).
// Danh sách CHÍNH THỨC nằm trong bảng `banned_words` trên Supabase — máy chủ mới là nơi quyết định.
export const BANNED_TOKENS = ['đm', 'dm', 'đmm', 'dmm', 'dcm', 'đcm', 'vcl', 'vkl', 'vl', 'clm', 'cmm', 'dkm', 'đkm', 'cc', 'đĩ', 'cave'];
export const BANNED_SUBSTRINGS = ['địt', 'lồn', 'cặc', 'buồi', 'đéo', 'đụ', 'óc chó', 'chó đẻ', 'mẹ mày', 'fuck', 'shit', 'bitch', 'dick', 'pussy', 'admin', 'quản trị', 'moderator', 'hệ thống'];
