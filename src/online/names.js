// Kiểm tra tên/lời nhắn phía trình duyệt (máy chủ kiểm tra lại lần nữa).
import { BANNED_TOKENS, BANNED_SUBSTRINGS } from '../../data/badwords.js';

const ALLOWED = /^[A-Za-z0-9À-ÖØ-öø-žƠơƯưẠ-ỹ ._-]+$/;

export function normalizeName(raw) {
  return String(raw || '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function isCleanText(text) {
  const s = String(text || '').normalize('NFC').toLowerCase();
  const tokens = s.split(/[^a-z0-9À-ÖØ-öø-žƠơƯưẠ-ỹ]+/);
  if (tokens.some((t) => BANNED_TOKENS.includes(t))) return false;
  const compact = s.replace(/[^a-z0-9À-ÖØ-öø-žƠơƯưẠ-ỹ]+/g, '');
  return !BANNED_SUBSTRINGS.some((w) => s.includes(w) || compact.includes(w.replace(/ /g, '')));
}

/** Trả về '' nếu hợp lệ, ngược lại là câu báo lỗi */
export function checkDisplayName(raw) {
  const n = normalizeName(raw);
  if (n.length < 2 || n.length > 20) return 'Tên cần từ 2 đến 20 ký tự.';
  if (!ALLOWED.test(n)) return 'Tên chỉ gồm chữ cái, số, khoảng trắng và . _ -';
  if (!isCleanText(n)) return 'Tên chứa từ ngữ không phù hợp, hãy chọn tên khác.';
  return '';
}
