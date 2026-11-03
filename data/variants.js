// =============================================================
//  BIẾN THỂ MÀU, Ý NGHĨA & CÔNG THỨC LAI TẠO — chỉnh ở đây
// =============================================================
//  Mỗi loài có nhiều màu. Màu "default: true" là màu mua được ở Khu Chợ.
//  name      : tên màu (ghép sau tên loài, vd "Hoa hồng" + "đỏ")
//  petal/petalDark : màu cánh hoa (mã HEX)
//  tones     : tông màu (warm ấm, cool mát, pastel, natural mộc mạc)
//  meanings  : ý nghĩa (xem MEANINGS bên dưới) — người chơi khám phá dần
//  rarity    : common (thường) · uncommon (ít gặp) · rare (hiếm)
//  breed     : công thức lai: [màu cha, màu mẹ, xác suất ra màu này]
// =============================================================

export const MEANINGS = {
  love: { name: 'Tình yêu', icon: '💗' },
  gratitude: { name: 'Biết ơn', icon: '🙏' },
  friendship: { name: 'Tình bạn', icon: '🤝' },
  respect: { name: 'Kính trọng', icon: '🎓' },
  joy: { name: 'Niềm vui', icon: '😊' },
  hope: { name: 'Hy vọng', icon: '🌅' },
  purity: { name: 'Trong sáng', icon: '🤍' },
  longing: { name: 'Nhớ nhung', icon: '💭' },
  apology: { name: 'Xin lỗi', icon: '🙇' },
  congrats: { name: 'Chúc mừng', icon: '🎉' },
  health: { name: 'Sức khỏe, bình an', icon: '🍀' },
  loyalty: { name: 'Thủy chung', icon: '💍' },
  jealousy: { name: 'Ghen tuông', icon: '😒', negative: true },
  farewell: { name: 'Chia ly', icon: '🥀', negative: true },
};

export const VARIANTS = {
  rose: {
    pink: { name: 'phấn', petal: '#f47a93', petalDark: '#d9506f', tones: ['warm', 'pastel'], meanings: ['gratitude', 'joy'], rarity: 'common', default: true },
    red: { name: 'đỏ', petal: '#e8384f', petalDark: '#b81f37', tones: ['warm'], meanings: ['love'], rarity: 'common', breed: [['pink', 'pink', 0.2]] },
    white: { name: 'trắng', petal: '#fbf6f0', petalDark: '#e9dccd', tones: ['cool', 'pastel', 'natural'], meanings: ['purity', 'respect'], rarity: 'common', breed: [['pink', 'pink', 0.2]] },
    yellow: { name: 'vàng', petal: '#ffd84d', petalDark: '#f2b31f', tones: ['warm'], meanings: ['friendship', 'jealousy'], rarity: 'uncommon', breed: [['red', 'white', 0.3], ['pink', 'white', 0.12]] },
    blue: { name: 'xanh lam', petal: '#6fa8f0', petalDark: '#3f7fd1', tones: ['cool'], meanings: ['hope', 'longing'], rarity: 'rare', breed: [['white', 'yellow', 0.07]] },
  },
  tulip: {
    purple: { name: 'tím', petal: '#c79cf2', petalDark: '#a674dc', tones: ['cool', 'pastel'], meanings: ['loyalty', 'respect'], rarity: 'common', default: true },
    red: { name: 'đỏ', petal: '#ef5b5b', petalDark: '#c93a3a', tones: ['warm'], meanings: ['love'], rarity: 'common', breed: [['purple', 'purple', 0.2]] },
    white: { name: 'trắng', petal: '#fdfaf4', petalDark: '#ece2d4', tones: ['cool', 'pastel', 'natural'], meanings: ['apology', 'purity'], rarity: 'common', breed: [['purple', 'purple', 0.2]] },
    yellow: { name: 'vàng', petal: '#ffd65c', petalDark: '#f0b22b', tones: ['warm'], meanings: ['joy', 'friendship'], rarity: 'uncommon', breed: [['red', 'white', 0.3]] },
    black: { name: 'đen huyền bí', petal: '#4a2f5c', petalDark: '#2b1838', tones: ['cool'], meanings: ['longing', 'farewell'], rarity: 'rare', breed: [['purple', 'red', 0.06]] },
  },
  sunflower: {
    yellow: { name: 'vàng', petal: '#ffd34e', petalDark: '#f4b42a', tones: ['warm', 'natural'], meanings: ['hope', 'joy'], rarity: 'common', default: true },
    orange: { name: 'cam', petal: '#ffa64d', petalDark: '#f2862b', tones: ['warm'], meanings: ['congrats', 'joy'], rarity: 'uncommon', breed: [['yellow', 'yellow', 0.25]] },
    red: { name: 'đỏ rượu', petal: '#c4473a', petalDark: '#9c2f26', tones: ['warm'], meanings: ['loyalty', 'love'], rarity: 'rare', breed: [['orange', 'orange', 0.08]] },
  },
  daisy: {
    white: { name: 'trắng', petal: '#ffffff', petalDark: '#f1ece2', tones: ['pastel', 'natural'], meanings: ['purity', 'friendship'], rarity: 'common', default: true },
    pink: { name: 'hồng', petal: '#ffc4d6', petalDark: '#f5a3bd', tones: ['pastel', 'warm'], meanings: ['joy', 'gratitude'], rarity: 'common', breed: [['white', 'white', 0.25]] },
    blue: { name: 'xanh thiên thanh', petal: '#a9d3ff', petalDark: '#7fb6f0', tones: ['cool', 'pastel'], meanings: ['hope', 'health'], rarity: 'rare', breed: [['pink', 'white', 0.07]] },
  },
  lavender: {
    purple: { name: 'tím', petal: '#b49be8', petalDark: '#8f74d1', tones: ['cool', 'pastel'], meanings: ['loyalty', 'longing'], rarity: 'common', default: true },
    white: { name: 'trắng', petal: '#f4f0fb', petalDark: '#ddd3ee', tones: ['cool', 'natural'], meanings: ['health', 'purity'], rarity: 'uncommon', breed: [['purple', 'purple', 0.25]] },
    pink: { name: 'hồng', petal: '#f0a6d0', petalDark: '#d77fb1', tones: ['pastel', 'warm'], meanings: ['love', 'longing'], rarity: 'rare', breed: [['purple', 'white', 0.08]] },
  },
  hydrangea: {
    blue: { name: 'xanh', petal: '#9cc7f2', petalDark: '#b9a3ef', tones: ['cool', 'pastel'], meanings: ['gratitude', 'apology'], rarity: 'common', default: true },
    pink: { name: 'hồng', petal: '#f6a9c8', petalDark: '#ee8db5', tones: ['warm', 'pastel'], meanings: ['love', 'joy'], rarity: 'common', breed: [['blue', 'blue', 0.25]] },
    purple: { name: 'tím', petal: '#b796e6', petalDark: '#9a74d6', tones: ['cool'], meanings: ['respect', 'gratitude'], rarity: 'uncommon', breed: [['blue', 'pink', 0.35]] },
    white: { name: 'trắng', petal: '#f7f7f2', petalDark: '#e4e8e0', tones: ['natural', 'pastel'], meanings: ['purity', 'congrats'], rarity: 'uncommon', breed: [['purple', 'pink', 0.25]] },
    mint: { name: 'xanh ngọc', petal: '#8fe0c8', petalDark: '#62c7a9', tones: ['cool', 'natural'], meanings: ['health', 'hope'], rarity: 'rare', breed: [['white', 'blue', 0.07]] },
  },
};

export const RARITY = {
  common: { name: 'Thường', color: '#9b7b6c', priceMult: 1 },
  uncommon: { name: 'Ít gặp', color: '#3f9b6b', priceMult: 1.3 },
  rare: { name: 'Hiếm', color: '#c86682', priceMult: 1.8 },
};

// ---- Nhà lai tạo ----
export const BREEDING = {
  hours: 4,                          // thời gian lai (giờ game)
  seeds: 2,                          // số hạt nhận được
  bonusSeedAvgQuality: 2.5,          // trung bình sao 2 cành bố mẹ ≥ mức này: thêm 1 hạt
  rareBoostByQuality: { 1: 1, 2: 1.3, 3: 1.7 }, // hoa đẹp dễ ra màu hiếm hơn (theo số sao trung bình, làm tròn)
  unlockLevel: 3,                    // cấp mở Nhà lai tạo
};

// ---- Sổ tay: thưởng khi hoàn thành % bộ sưu tập ----
export const BOOK_MILESTONES = [
  { pct: 25, coins: 300, text: 'Nhà sưu tầm tập sự' },
  { pct: 50, coins: 800, text: 'Nhà thực vật học' },
  { pct: 75, coins: 1500, text: 'Bậc thầy lai tạo' },
  { pct: 100, coins: 4000, text: 'Huyền thoại sổ tay hoa' },
];
