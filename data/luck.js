// =============================================================
//  🍀 VẬN MAY (GĐ15) — mở gói quà bằng VÉ hoặc TIỀN TRONG GAME (không bán bằng tiền thật)
//  Tỉ lệ ở đây được hiện công khai cho người chơi trong bảng Vận May.
// =============================================================

export const LUCK_RULES = {
  unlockLevel: 2,                // cấp mở bảng Vận May
  welcome: { luck: 3, gold: 1 }, // quà chào mừng (người chơi mới và người chơi cũ khi lên bản 0.15)
  historySize: 20,               // nhớ bao nhiêu lần mở gần nhất
};

// Các loại vé / mảnh
export const TICKETS = {
  luck: { name: 'Vé may mắn', icon: '🎟️', desc: 'Mở 1 Gói Thường' },
  gold: { name: 'Vé vàng', icon: '🎫', desc: 'Mở 1 Gói Vàng' },
  shard: { name: 'Mảnh may mắn', icon: '🧩', desc: 'Mỗi lần mở gói được ít mảnh, đồ trùng cũng đổi thành mảnh. Gom mảnh để đổi món bạn muốn' },
};

// Cách kiếm vé (đều nằm TRONG game)
// (0.16) vé vàng hiếm hơn: chỉ khi xong ĐỦ 3 nhiệm vụ tuần và mỗi 5 cấp
export const TICKET_SOURCES = {
  daily: { luck: 1 },          // mỗi ngày (theo ngày thật, giờ Việt Nam) lần đầu vào game
  dailyQuestsAll: { luck: 1 }, // nhận thưởng đủ 3 nhiệm vụ ngày
  weeklyQuestsAll: { gold: 1 },// nhận thưởng đủ 3 nhiệm vụ tuần
  levelUp: { luck: 1 },        // mỗi lần lên cấp
  levelUpGoldEvery: 5,         // cấp 5, 10, 15... tặng thêm 1 vé vàng
  favor3: { luck: 1 },         // giúp dân làng đạt 3⭐ trong mini game
};

// Gói quà.
//   level : cấp mở gói · cost: trả bằng vé · coins: hoặc trả bằng tiền 💰 · shards: mảnh tặng kèm mỗi lần mở
//   odds  : tỉ lệ ra từng bậc (cộng lại = 1)
//   pity  : BẢO HIỂM — mở "every" lần liền mà chưa ra bậc "tier" (hoặc cao hơn) thì lần đó chắc chắn ra
export const PACKS = {
  normal: {
    name: 'Gói Thường', icon: '🎁', level: 2, cost: { luck: 1 }, coins: 600, shards: 1,
    odds: { common: 0.66, uncommon: 0.30, rare: 0.04 },
    pity: { every: 25, tier: 'rare' },
    desc: 'Hạt giống, vật tư, hạt màu lạ, mở khóa sớm hạt & đồ trang trí chưa tới cấp, nâng cấp dụng cụ',
  },
  gold: {
    name: 'Gói Vàng', icon: '🌟', level: 4, cost: { gold: 1 }, coins: 5000, shards: 2,
    odds: { uncommon: 0.67, rare: 0.30, legend: 0.03 },
    pity: { every: 50, tier: 'legend' },
    desc: 'Như Gói Thường nhưng toàn đồ tốt, và có 🌈 Cây Vận May hiếm có hiệu ứng động',
  },
};

// Bậc quà (từ thấp tới cao)
export const TIERS = {
  common: { name: 'Thường', color: '#9b7b6c' },
  uncommon: { name: 'Ít gặp', color: '#3f9b6b' },
  rare: { name: 'Hiếm', color: '#c86682' },
  legend: { name: 'Huyền thoại', color: '#e0a21a' },
};
export const TIER_ORDER = ['common', 'uncommon', 'rare', 'legend'];

// Quà trong từng bậc. w = tỉ trọng (cùng bậc), n = [ít nhất, nhiều nhất]
//   seed      : hạt màu cơ bản của loài đã mở
//   item      : vật tư (phân bón, thuốc, bạt che)
//   coins     : tiền
//   colorSeed : hạt màu lạ (rarity: uncommon | rare)
//   earlySeed : MỞ KHÓA SỚM — hạt của loài chưa tới cấp
//   decor     : đồ trang trí chưa có (early: true = ưu tiên món chưa tới cấp)
//   upgrade   : nâng 1 bậc dụng cụ (bình tưới, giày, găng tay...) — kể cả bậc chưa tới cấp
//   luckDecor : đồ trang trí chỉ có ở Vận May (mỗi món 1 cái, trùng thì đổi mảnh)
//   luckFlower: hạt Cây Vận May (chỉ có ở Gói Vàng)
export const REWARDS = {
  common: [
    { kind: 'seed', n: [3, 5], w: 4 },
    { kind: 'item', id: 'fertilizer', n: [4, 6], w: 2 },
    { kind: 'item', id: 'medicine', n: [2, 3], w: 1.5 },
    { kind: 'item', id: 'cover', n: [2, 3], w: 1.5 },
    { kind: 'coins', n: [60, 120], w: 1 },
  ],
  uncommon: [
    { kind: 'colorSeed', rarity: 'uncommon', n: [2, 3], w: 3 },
    { kind: 'earlySeed', n: [2, 3], w: 2 },
    { kind: 'decor', maxPrice: 400, w: 2 },
    { kind: 'coins', n: [200, 350], w: 1 },
  ],
  rare: [
    { kind: 'colorSeed', rarity: 'rare', n: [1, 2], w: 3 },
    { kind: 'decor', minPrice: 350, early: true, w: 2 },
    { kind: 'upgrade', w: 1.5 },
    { kind: 'luckDecor', w: 1.5 },
  ],
  legend: [
    { kind: 'luckFlower', n: [1, 1], w: 1 },
  ],
};

// Đồ trùng / không còn gì để tặng ⇒ đổi thành mảnh
export const DUP_SHARDS = { common: 1, uncommon: 3, rare: 8, legend: 20 };

// Đổi mảnh lấy món mình muốn
export const SHARD_SHOP = {
  luckFlower: { name: 'Hạt Cây Vận May (chọn loài)', cost: 150, n: 1 },
  luckDecor: { name: 'Đồ trang trí Vận May (chọn món)', cost: 100 },
  gold: { name: 'Vé vàng', cost: 80, n: 1 },
  luck: { name: 'Vé may mắn', cost: 15, n: 1 },
};
