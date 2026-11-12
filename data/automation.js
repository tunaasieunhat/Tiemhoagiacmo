// =============================================================
//  TỰ ĐỘNG HÓA: máy móc (mua cho từng lô) & nhân viên (thuê, trả lương mỗi ngày game)
// =============================================================
export const MACHINES = {
  sprinkler: {
    name: 'Vòi tưới tự động', icon: '🚿', price: 1800, level: 4,
    desc: 'Tự tưới các ô trong lô khi đất sắp khô (không tốn gì thêm)',
    threshold: 0.3, // tưới khi độ ẩm dưới 30%
  },
  feeder: {
    name: 'Máy bón phân', icon: '⚙️', price: 2400, level: 5,
    desc: 'Tự bón phân cho cây khi cây cần (dùng phân bón trong kho)',
  },
};

// =============================================================
//  👥 NHÂN VIÊN (nâng cấp ở GĐ25): mỗi vị trí thuê 1 người. Chọn trong 3 ứng viên của tuần (tay nghề khác nhau).
//  Tay nghề 1–10: làm càng nhiều càng lên tay nghề ⇒ làm nhanh hơn, giỏi hơn, và LƯƠNG TĂNG THEO NĂNG LỰC.
//  Hai cách trả lương:
//    fixed: lương cứng mỗi ngày = base + perSkill × tay nghề
//    perf:  lương theo hiệu suất = 40% lương cứng + hoa hồng mỗi việc làm được (commission × (1 + 5% × tay nghề))
//  Tâm trạng 0–100: trả lương đúng hạn / thưởng thì vui ⇒ làm nhanh hơn; nợ lương thì nghỉ.
// =============================================================
export const STAFF = {
  gardener: {
    name: 'Làm vườn', icon: '👨‍🌾', level: 6, base: 90, perSkill: 22, commission: 3,
    desc: 'Thu hoạch đúng lúc, tưới ô khô, bắt sâu, bón phân khi cây cần, dọn – xới – gieo lại theo kế hoạch gieo của bạn. Làm cả khi bạn vắng mặt.',
    every: [70, 18],        // phút game giữa 2 lượt làm: tay nghề 1 → 10
    look: { skin: '#e8b48f', hair: '#7a6a5a', outfit: '#a6dd94', hat: '#d9b48a' },
  },
  clerk: {
    name: 'Bán hàng', icon: '👩‍💼', level: 7, base: 110, perSkill: 26, commission: 6,
    desc: 'Tự phục vụ khách cành lẻ / nhiều cành; tay nghề 3+ tự gói bó hoa theo yêu cầu; tay nghề 6+ phục vụ 2 khách mỗi lượt.',
    every: [32, 6],
    look: { skin: '#ffe0c7', hair: '#3b2a22', outfit: '#f6a6b9', hat: null, bun: true },
  },
  courier: {
    name: 'Giao hàng chi nhánh', icon: '🚚', level: 9, base: 100, perSkill: 24, commission: 10,
    desc: 'Tự gửi hàng từ kho ra các chi nhánh sắp hết hàng (thuyền chở). Tay nghề càng cao gửi càng nhiều, thuyền tới càng nhanh.',
    every: [150, 60],
    look: { skin: '#f3c9a5', hair: '#2f2a2a', outfit: '#8fc9e8', hat: '#f4c34e' },
  },
};

// Ứng viên mỗi tuần (đổi mới theo tuần game). skill: tay nghề khởi điểm [thấp nhất, cao nhất]
export const STAFF_RULES = {
  candidates: 3,
  skill: [1, 6],
  rareSkill: 0.12,          // 12% có một ứng viên tay nghề 7–8
  hireFeeDays: 2,           // phí tuyển = bấy nhiêu ngày lương cứng
  xpPerSkill: 18,           // việc cần để lên 1 bậc tay nghề = xpPerSkill × tay nghề hiện tại
  maxSkill: 10,
  bonusMood: 25,            // thưởng 1 ngày lương ⇒ tâm trạng +25
  unpaidQuit: 2,            // nợ lương bấy nhiêu ngày thì nghỉ hẳn
};

// Tính cách ngẫu nhiên của ứng viên
export const TRAITS = {
  hard: { name: 'Chăm chỉ', desc: 'Làm nhanh hơn 15%', speed: 0.85 },
  neat: { name: 'Khéo tay', desc: 'Lên tay nghề nhanh hơn', xp: 1.4 },
  thrift: { name: 'Dễ tính', desc: 'Lương thấp hơn 12%', wage: 0.88 },
  cheer: { name: 'Vui vẻ', desc: 'Tâm trạng ít khi xuống', mood: 0.5 },
  pro: { name: 'Lành nghề', desc: 'Đòi lương cao hơn 15% nhưng làm nhanh hơn 25%', wage: 1.15, speed: 0.75 },
};

export const STAFF_NAMES = ['Bác Tâm', 'Chị Thu', 'Anh Lộc', 'Cô Hạnh', 'Chú Bảy', 'Chị Mận', 'Anh Khoa', 'Bé Na', 'Cô Ly', 'Anh Tú', 'Chị Gấm', 'Ông Sáu', 'Chị Huệ', 'Anh Bin', 'Cô Thảo'];
export const STAFF_LOOKS = [
  { skin: '#e8b48f', hair: '#7a6a5a', outfit: '#a6dd94', hat: '#d9b48a' },
  { skin: '#ffe0c7', hair: '#3b2a22', outfit: '#f6a6b9', hat: null, bun: true },
  { skin: '#f3c9a5', hair: '#2f2a2a', outfit: '#8fc9e8', hat: '#f4c34e' },
  { skin: '#f6d3b8', hair: '#5a3a28', outfit: '#c9a2ff', hat: null },
  { skin: '#d9a77f', hair: '#1f1a18', outfit: '#ffd36e', hat: '#ffffff' },
  { skin: '#f8d4b8', hair: '#8a4a3a', outfit: '#9fd6c8', hat: null, bun: true },
];
