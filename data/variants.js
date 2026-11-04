// =============================================================
//  BIẾN THỂ MÀU, Ý NGHĨA & CÔNG THỨC LAI TẠO — chỉnh ở đây
// =============================================================
//  Mỗi loài có nhiều màu. Màu "default: true" là màu mua được ở Khu Chợ.
//  name      : tên màu (ghép sau tên loài, vd "Hoa hồng" + "đỏ")
//  petal/petalDark : màu cánh hoa (mã HEX)
//  tones     : tông màu (warm ấm, cool mát, pastel, natural mộc mạc)
//  meanings  : ý nghĩa (xem MEANINGS bên dưới) — người chơi khám phá dần
//  rarity    : common (thường) · uncommon (ít gặp) · rare (hiếm) · legend (huyền thoại — Cây Vận May)
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
  // ---------------- GĐ14 ----------------
  cosmos: {
    pink: { name: 'hồng', petal: '#f78fb3', petalDark: '#e5679a', tones: ['warm', 'pastel'], meanings: ['joy', 'friendship'], rarity: 'common', default: true },
    white: { name: 'trắng', petal: '#ffffff', petalDark: '#f1e8ef', tones: ['pastel', 'natural'], meanings: ['purity'], rarity: 'common', breed: [['pink', 'pink', 0.25]] },
    orange: { name: 'cam', petal: '#ffa64d', petalDark: '#f2862b', tones: ['warm', 'natural'], meanings: ['congrats', 'joy'], rarity: 'uncommon', breed: [['pink', 'white', 0.2]] },
    chocolate: { name: 'sô-cô-la', petal: '#8a3b3b', petalDark: '#6b2a2a', tones: ['warm', 'natural'], meanings: ['longing'], rarity: 'rare', breed: [['orange', 'orange', 0.08]] },
  },
  carnation: {
    pink: { name: 'hồng', petal: '#f7a1b8', petalDark: '#e47995', tones: ['warm', 'pastel'], meanings: ['gratitude', 'love'], rarity: 'common', default: true },
    red: { name: 'đỏ', petal: '#e33d55', petalDark: '#b9233c', tones: ['warm'], meanings: ['love', 'respect'], rarity: 'common', breed: [['pink', 'pink', 0.22]] },
    white: { name: 'trắng', petal: '#ffffff', petalDark: '#ece4e8', tones: ['cool', 'pastel', 'natural'], meanings: ['purity', 'apology'], rarity: 'uncommon', breed: [['pink', 'red', 0.18]] },
    yellow: { name: 'vàng', petal: '#ffd75e', petalDark: '#f1b830', tones: ['warm'], meanings: ['farewell'], rarity: 'uncommon', breed: [['white', 'pink', 0.15]] },
    purple: { name: 'tím mộng mơ', petal: '#b48be0', petalDark: '#9168c4', tones: ['cool', 'pastel'], meanings: ['longing', 'respect'], rarity: 'rare', breed: [['white', 'red', 0.07]] },
  },
  marigold: {
    orange: { name: 'cam', petal: '#ff9f2e', petalDark: '#f27f12', tones: ['warm', 'natural'], meanings: ['health', 'congrats'], rarity: 'common', default: true },
    yellow: { name: 'vàng', petal: '#ffd34e', petalDark: '#f4b42a', tones: ['warm', 'natural'], meanings: ['joy', 'health'], rarity: 'common', breed: [['orange', 'orange', 0.25]] },
    red: { name: 'đỏ nhung', petal: '#d9472b', petalDark: '#b33018', tones: ['warm'], meanings: ['loyalty', 'health'], rarity: 'rare', breed: [['orange', 'yellow', 0.08]] },
  },
  lily: {
    white: { name: 'trắng', petal: '#ffffff', petalDark: '#f3e7f0', tones: ['cool', 'pastel', 'natural'], meanings: ['purity', 'respect'], rarity: 'common', default: true },
    pink: { name: 'hồng', petal: '#ffb6d0', petalDark: '#f08cb3', tones: ['warm', 'pastel'], meanings: ['love', 'joy'], rarity: 'uncommon', breed: [['white', 'white', 0.2]] },
    orange: { name: 'cam', petal: '#ffa15c', petalDark: '#f07f34', tones: ['warm'], meanings: ['congrats', 'hope'], rarity: 'uncommon', breed: [['white', 'pink', 0.15]] },
    yellow: { name: 'vàng chanh', petal: '#fff07a', petalDark: '#f5d742', tones: ['warm', 'pastel'], meanings: ['joy', 'friendship'], rarity: 'rare', breed: [['orange', 'pink', 0.07]] },
  },
  peony: {
    pink: { name: 'hồng phấn', petal: '#f9a8c9', petalDark: '#ec7fab', tones: ['warm', 'pastel'], meanings: ['congrats', 'joy'], rarity: 'common', default: true },
    white: { name: 'trắng', petal: '#fff9f5', petalDark: '#f2e4dc', tones: ['pastel', 'natural'], meanings: ['purity', 'respect'], rarity: 'uncommon', breed: [['pink', 'pink', 0.18]] },
    red: { name: 'đỏ thắm', petal: '#d93a5c', petalDark: '#b0213f', tones: ['warm'], meanings: ['love', 'congrats'], rarity: 'uncommon', breed: [['pink', 'pink', 0.15]] },
    coral: { name: 'san hô', petal: '#ff8a73', petalDark: '#f2664d', tones: ['warm'], meanings: ['joy', 'hope'], rarity: 'rare', breed: [['red', 'white', 0.07]] },
  },
  orchid: {
    purple: { name: 'tím', petal: '#c98be0', petalDark: '#a865c7', tones: ['cool', 'pastel'], meanings: ['love', 'respect'], rarity: 'common', default: true },
    white: { name: 'trắng', petal: '#ffffff', petalDark: '#f0e6f5', tones: ['cool', 'pastel', 'natural'], meanings: ['purity', 'congrats'], rarity: 'uncommon', breed: [['purple', 'purple', 0.18]] },
    pink: { name: 'hồng', petal: '#ff9fcf', petalDark: '#f079b5', tones: ['warm', 'pastel'], meanings: ['love', 'joy'], rarity: 'uncommon', breed: [['purple', 'white', 0.15]] },
    yellow: { name: 'vàng hoàng kim', petal: '#ffd84d', petalDark: '#f2b630', tones: ['warm'], meanings: ['hope', 'congrats'], rarity: 'rare', breed: [['pink', 'white', 0.06]] },
  },
  // ---- 🍀 Cây Vận May: mỗi loài 1 màu, không lai tạo ----
  crystal: {
    clear: { name: 'trong suốt', petal: '#cdf3ff', petalDark: '#8fd8f2', tones: ['cool', 'pastel'], meanings: ['purity', 'loyalty'], rarity: 'legend', default: true },
  },
  firefly: {
    glow: { name: 'phát sáng', petal: '#fff29a', petalDark: '#e8d04f', tones: ['warm', 'natural'], meanings: ['hope', 'friendship'], rarity: 'legend', default: true },
  },
  prism: {
    rainbow: { name: 'bảy sắc', petal: '#ff9fb8', petalDark: '#8fb8ff', tones: ['warm', 'cool'], meanings: ['joy', 'congrats'], rarity: 'legend', default: true },
  },
  wisp: {
    blue: { name: 'lam huyền ảo', petal: '#8fa8ff', petalDark: '#6b5bd6', tones: ['cool'], meanings: ['longing', 'respect'], rarity: 'legend', default: true },
  },
  snowbell: {
    white: { name: 'tuyết trắng', petal: '#ffffff', petalDark: '#dcecff', tones: ['cool', 'pastel'], meanings: ['purity', 'health'], rarity: 'legend', default: true },
  },
};

export const RARITY = {
  common: { name: 'Thường', color: '#9b7b6c', priceMult: 1 },
  uncommon: { name: 'Ít gặp', color: '#3f9b6b', priceMult: 1.3 },
  rare: { name: 'Hiếm', color: '#c86682', priceMult: 1.8 },
  legend: { name: 'Huyền thoại', color: '#e0a21a', priceMult: 2.2 },
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
