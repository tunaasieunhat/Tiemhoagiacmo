// =============================================================
//  CỬA HÀNG HOA — chỉnh số ở đây để cân bằng game
//  Thời gian tính bằng PHÚT GAME (1 phút game = 1 giây ngoài đời)
// =============================================================

export const SHOP = {
  openHour: 7,              // giờ mở cửa
  closeHour: 21,            // giờ đóng cửa (khách đang chờ vẫn được phục vụ)
  maxQueue: 3,              // số khách chờ tối đa (nâng cấp Quầy hàng ở Khu Chợ để tăng)
  firstCustomerDelay: 15,   // khách đầu tiên đến sau bao lâu kể từ lần thu hoạch đầu
  spawnEvery: [60, 100],    // khoảng cách giữa 2 khách (ngẫu nhiên trong khoảng) khi uy tín thấp nhất
  spawnFasterPerTier: 0.15, // mỗi bậc uy tín: khách đến nhanh hơn 15%
  patience: [150, 240],     // khách chờ được bao lâu
  patienceBonusPerTier: 0.1,// mỗi bậc uy tín: khách kiên nhẫn hơn 10%

  qualityMult: { 1: 1, 2: 1.35, 3: 1.8 }, // giá theo số sao
  bouquetMult: 1.3,         // bó hoa bán đắt hơn hoa lẻ 30%
  wholesaleMult: 0.55,      // bán sỉ (không cần khách) chỉ được 55% giá

  tip: {
    baseChance: 0.12,       // xác suất cho tiền bo ở bậc uy tín thấp nhất
    chancePerTier: 0.08,    // mỗi bậc uy tín cộng thêm
    happyBonus: 0.2,        // khách rất hài lòng cộng thêm
    pct: [0.1, 0.35],       // tiền bo = 10%–35% giá
  },

  // uy tín nhận được theo mức hài lòng
  rep: { perfect: 5, good: 3, ok: 1, bad: 0, timeout: -2, decline: -1 },
  satisfaction: { perfect: 85, good: 65, ok: 40 }, // điểm (0–100) để đạt từng mức
};

// Bậc uy tín
export const REP_TIERS = [
  { min: 0, name: 'Tiệm mới mở', icon: '🌱' },
  { min: 30, name: 'Hàng xóm biết tiếng', icon: '🌼' },
  { min: 100, name: 'Tiệm uy tín', icon: '🌷' },
  { min: 250, name: 'Tiệm nổi tiếng', icon: '💐' },
  { min: 600, name: 'Huyền thoại phố hoa', icon: '👑' },
];

// Tỉ lệ các kiểu yêu cầu theo bậc uy tín: [1 cành, nhiều cành, bó hoa]
export const REQUEST_MIX = [
  [0.45, 0.35, 0.20],
  [0.30, 0.35, 0.35],
  [0.20, 0.30, 0.50],
  [0.15, 0.25, 0.60],
  [0.10, 0.20, 0.70],
];

// Số cành theo bậc uy tín
export const REQUEST_SIZE = {
  multi: [[2, 3], [2, 4], [3, 5], [3, 6], [4, 8]],
  bouquet: [[3, 4], [3, 5], [4, 6], [5, 8], [6, 10]],
};

// Xác suất khách đòi chất lượng tối thiểu 2★ / 3★ theo bậc
export const QUALITY_DEMAND = [
  [0.05, 0], [0.15, 0.03], [0.25, 0.08], [0.3, 0.15], [0.3, 0.25],
];

// Tông màu khách mong muốn khi đặt bó hoa
export const TONES = {
  warm: { name: 'tông ấm' },
  cool: { name: 'tông mát' },
  pastel: { name: 'tông pastel nhẹ nhàng' },
  natural: { name: 'mộc mạc, tự nhiên' },
};

// Dịp tặng (GĐ6 sẽ thêm ý nghĩa hoa)
export const OCCASIONS = [
  { text: 'tặng mẹ', tone: 'warm' },
  { text: 'mừng sinh nhật bạn thân', tone: 'pastel' },
  { text: 'cho buổi hẹn hò đầu tiên', tone: 'warm' },
  { text: 'chúc mừng tốt nghiệp', tone: 'warm' },
  { text: 'để bàn làm việc', tone: 'natural' },
  { text: 'tặng cô giáo', tone: 'pastel' },
  { text: 'thăm người ốm', tone: 'cool' },
  { text: 'xin lỗi người yêu', tone: 'pastel' },
  { text: 'trang trí quán cà phê', tone: 'natural' },
  { text: 'tặng đồng nghiệp chuyển công tác', tone: 'cool' },
];
