// Tạo RELEASE_NOTES.md cho trang Releases trên GitHub, lấy từ ghi chú bản mới nhất trong data/changelog.js.
// Chạy trong GitHub Actions: node scripts/release-notes.mjs > RELEASE_NOTES.md
import { readFileSync } from 'node:fs';
import { CHANGELOG } from '../data/changelog.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const entry = CHANGELOG.find((c) => c.version === pkg.version) || CHANGELOG[0] || { notes: [] };
const lines = [
  `Tiệm Hoa Giấc Mơ – phiên bản ${pkg.version}.`,
  '',
  ...entry.notes.map((n) => `- ${n}`),
  '',
  'Cài: tải file **TiemHoaGiacMo.apk** bên dưới, mở file trên điện thoại và bấm Cài đặt / Cập nhật',
  '(lần đầu cần cho phép "Cài ứng dụng không rõ nguồn gốc").',
];
console.log(lines.join('\n'));
