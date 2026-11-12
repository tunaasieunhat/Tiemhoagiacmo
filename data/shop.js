// =============================================================
//  CỬA HÀNG HOA — chỉnh số ở đây để cân bằng game
//  Thời gian tính bằng PHÚT GAME (1 phút game = 1 giây ngoài đời)
// =============================================================

export const SHOP = {
  openHour: 7,              // giờ mở cửa
  closeHour: 21,            // giờ đóng cửa (khách đang chờ vẫn được phục vụ)
  maxQueue: 3,              // số khách chờ tối đa (nâng cấp Quầy hàng ở Khu Chợ để tăng)
  firstCustomerDelay: 15,   // khách đầu tiên đến sau bao lâu kể từ lần thu hoạch đầu
  spawnEvery: [80, 130],    // khoảng cách giữa 2 khách (ngẫu nhiên trong khoảng) khi uy tín thấp nhất (0.16: thưa hơn)
  spawnFasterPerTier: 0.15, // mỗi bậc uy tín: khách đến nhanh hơn 15%
  patience: [150, 240],     // khách chờ được bao lâu
  patienceBonusPerTier: 0.1,// mỗi bậc uy tín: khách kiên nhẫn hơn 10%

  qualityMult: { 1: 1, 2: 1.3, 3: 1.6 }, // giá theo số sao (0.16: 3★ từ ×1,8 xuống ×1,6)
  bouquetMult: 1.3,         // bó hoa bán đắt hơn hoa lẻ 30%
  wholesaleMult: 0.4,       // bán sỉ (không cần khách) chỉ được 40% giá (0.16: giảm để khách ở tiệm quan trọng hơn)

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

// 🪴 TREO HOA (0.20): chọn những loài tiệm đang bán. Khách vào tiệm CHỈ hỏi mua các loài đang treo;
// khách muốn loài khác sẽ để lại "đơn đặt trước" (xem ở 📋 Nhiệm vụ › Đơn hàng) thay vì đứng chờ.
// Chưa treo loài nào = bán tất cả như cũ.
export const DISPLAY = {
  baseSlots: 3,            // số móc treo lúc đầu
  perShopLevel: 1,         // mỗi bậc quy mô tiệm thêm 1 móc
  preorderChance: 0.28,    // 28% lượt khách muốn mua loài tiệm KHÔNG treo ⇒ để lại đơn đặt trước
  preorderMax: 5,          // tối đa bao nhiêu đơn đặt trước cùng lúc (0.26.1: 3 → 5 vì khách hẹn mai cũng thành đơn đặt trước)
  preorderSize: [2, 5],    // số cành mỗi đơn đặt trước
  preorderDueHours: [20, 36], // hạn giao (giờ game)
  preorderPayMult: 1.35,   // tiền = giá bán lẻ × 1,35 (khách chịu chờ nên trả thêm)
  preorderXpPerFlower: 1,  // XP mỗi cành
  preorderFailRep: -2,     // trễ hạn: mất 2 uy tín
  preorderRep: 2,          // giao đúng hẹn: +2 uy tín
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

// Dịp tặng: tông màu + ý nghĩa mong muốn (xem MEANINGS trong data/variants.js)
export const OCCASIONS = [
  { text: 'tặng mẹ', tone: 'warm', meaning: 'gratitude' },
  { text: 'mừng sinh nhật bạn thân', tone: 'pastel', meaning: 'friendship' },
  { text: 'cho buổi hẹn hò đầu tiên', tone: 'warm', meaning: 'love' },
  { text: 'chúc mừng tốt nghiệp', tone: 'warm', meaning: 'congrats' },
  { text: 'để bàn làm việc', tone: 'natural', meaning: 'joy' },
  { text: 'tặng cô giáo', tone: 'pastel', meaning: 'respect' },
  { text: 'thăm người ốm', tone: 'cool', meaning: 'health' },
  { text: 'xin lỗi người yêu', tone: 'pastel', meaning: 'apology' },
  { text: 'trang trí quán cà phê', tone: 'natural', meaning: 'joy' },
  { text: 'tặng đồng nghiệp chuyển công tác', tone: 'cool', meaning: 'friendship' },
  { text: 'động viên bạn thi đại học', tone: 'warm', meaning: 'hope' },
  { text: 'tặng ông bà', tone: 'natural', meaning: 'respect' },
];

// Tỉ lệ khách đặt bó hoa có yêu cầu ý nghĩa (khách mới mở tiệm ít khi đòi hỏi)
export const MEANING_DEMAND = [0.5, 0.65, 0.8, 0.9, 1];
// Tỉ lệ khách đặt đúng màu cụ thể (chỉ với màu bạn đã từng trồng)
export const COLOR_DEMAND = 0.3;

// 🛍️ BÁN HOA DỄ THỞ HƠN (0.26.1) — góp ý "khách toàn hỏi hoa mình không có"
export const SMART = {
  // A. Khách ưu tiên hoa bạn đang có
  stockBias: 0.7,          // 70% khách hỏi loài đang có trong kho
  growingBias: 0.5,        // loài trong kho không hợp ⇒ 50% hỏi loài đang trồng sắp nở
  capToStock: 0.75,        // hỏi loài có sẵn: 75% không đòi nhiều sao / nhiều cành / màu khác hơn thứ bạn đang có
  // B. Tự treo hoa: chưa tự chọn loài nào thì tiệm tự treo các loài nhiều hàng nhất (rồi tới loài đang trồng)
  autoDisplay: true,
  // C. Hoa thay thế: không có đúng loài / đủ sao ⇒ đưa hoa cùng loài khác màu/ít sao hơn, hoặc loài khác cùng tông màu / ý nghĩa
  sub: { priceMult: 0.7, maxMood: 'ok', rep: 0 },   // khách vẫn mua: trả 70% giá, không cho tiền bo, uy tín không đổi
  clerkSubSkill: 5,        // nhân viên bán hàng tay nghề 5+ biết đưa hoa thay thế
  // D. Báo trước & hẹn mai
  upcoming: 3,             // số khách sắp tới được báo trước (xem trong bảng Tiệm hoa)
  comeBack: true,          // kho không có gì đưa được ⇒ khách hẹn mai quay lại (đơn đặt trước) thay vì giận bỏ đi, không mất uy tín
};
