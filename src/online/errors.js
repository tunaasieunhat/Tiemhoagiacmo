// Đổi lỗi tiếng Anh từ Supabase sang tiếng Việt dễ hiểu.
export function viError(err) {
  if (!err) return '';
  const msg = String(err.message || err.error_description || err).toLowerCase();
  const code = String(err.code || err.error_code || '');
  const has = (s) => msg.includes(s);
  // lỗi tiếng Việt do hàm máy chủ trả về (tiền tố SOCIAL:)
  const raw = String(err.message || '');
  const i = raw.indexOf('SOCIAL: ');
  if (i >= 0) return raw.slice(i + 8);
  if (has('invalid login credentials') || code === 'invalid_credentials') return 'Sai email hoặc mật khẩu.';
  if (has('email not confirmed') || code === 'email_not_confirmed') return 'Email chưa được xác nhận. Hãy mở hộp thư và bấm vào liên kết xác nhận.';
  if (has('already registered') || code === 'user_already_exists' || code === 'email_exists') return 'Email này đã có tài khoản. Hãy chuyển sang Đăng nhập.';
  if (code === 'weak_password' || has('password should')) return 'Mật khẩu quá yếu: cần ít nhất 8 ký tự, nên có cả chữ và số.';
  if (code === 'same_password' || has('should be different')) return 'Mật khẩu mới phải khác mật khẩu cũ.';
  if (code === 'over_email_send_rate_limit' || has('email rate limit')) return 'Đã gửi quá nhiều email. Hãy đợi khoảng 1 giờ rồi thử lại.';
  if (code === 'over_request_rate_limit' || has('rate limit') || has('too many')) return 'Bạn thao tác quá nhanh. Hãy đợi một chút rồi thử lại.';
  if (has('rate_limit')) return 'Bạn đổi tên quá nhanh, hãy thử lại sau ít phút.';
  if (code === 'email_address_invalid' || has('invalid email') || has('unable to validate email')) return 'Địa chỉ email không hợp lệ.';
  if (has('provider is not enabled') || code === 'provider_disabled') return 'Đăng nhập Google chưa được bật trong Supabase.';
  if (has('signups not allowed') || code === 'signup_disabled') return 'Hiện chưa cho phép đăng ký tài khoản mới.';
  if (has('otp_expired') || has('expired')) return 'Liên kết đã hết hạn. Hãy gửi lại yêu cầu mới.';
  if (has('profiles_name_ok') || has('check constraint') && has('name')) return 'Tên không hợp lệ: 2–20 ký tự, không ký tự lạ, không từ ngữ không phù hợp.';
  if (has('profiles_avatar_ok')) return 'Avatar không hợp lệ.';
  if (has('failed to fetch') || has('network') || has('load failed') || has('fetch')) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
  if (has('jwt') || has('not_authenticated')) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.';
  return 'Có lỗi xảy ra: ' + (err.message || err);
}
