// =============================================================
//  🐾 THÚ CƯNG & TRỨNG (GĐ26 · Lễ Hội Đảo Mây)
//  Trứng nhặt được khi câu cá, hái nguyên liệu, mở gói Vận May, đổi ở Khu Vui Chơi, Sổ thưởng mùa, điểm danh.
//  Ấp trứng ở nhà ⇒ nở ra thú ngẫu nhiên theo loại trứng. Thú đi theo bạn, được cho ăn / vuốt ve thì lớn dần và giúp việc.
// =============================================================

// Loài thú: rarity (common | uncommon | rare | legend) · colors để dựng mô hình (src/models/pets.js)
export const PET_SPECIES = {
  cat: { name: 'Mèo mướp', icon: '🐱', rarity: 'common', colors: { body: '#e8a86a', dark: '#c9824a', belly: '#fff3e0' } },
  dog: { name: 'Cún vàng', icon: '🐶', rarity: 'common', colors: { body: '#f2c27a', dark: '#c9925a', belly: '#fff3e0' } },
  bunny: { name: 'Thỏ trắng', icon: '🐰', rarity: 'common', colors: { body: '#fbf6f0', dark: '#f2c6d0', belly: '#ffffff' } },
  duck: { name: 'Vịt con', icon: '🐥', rarity: 'common', colors: { body: '#ffe066', dark: '#f2b31f', belly: '#fff6c4' } },
  fox: { name: 'Cáo nhỏ', icon: '🦊', rarity: 'uncommon', colors: { body: '#f08a3a', dark: '#c9602a', belly: '#ffffff' } },
  owl: { name: 'Cú mèo', icon: '🦉', rarity: 'uncommon', colors: { body: '#a8845f', dark: '#7a5a3a', belly: '#f2e2c4' } },
  calico: { name: 'Mèo tam thể', icon: '😺', rarity: 'rare', colors: { body: '#ffffff', dark: '#e8964a', belly: '#3b2a22' } },
  snowfox: { name: 'Cáo tuyết', icon: '❄️', rarity: 'rare', colors: { body: '#f4f8fb', dark: '#bfd8f0', belly: '#ffffff' } },
  turtle: { name: 'Rùa hoa', icon: '🐢', rarity: 'rare', colors: { body: '#8fd18b', dark: '#5a9f5a', belly: '#f2e2a8' } },
  dragon: { name: 'Rồng Hoa nhỏ', icon: '🐉', rarity: 'legend', colors: { body: '#c9a2ff', dark: '#8f6fd8', belly: '#fff0f8' } },
};

export const PET_RARITY = {
  common: { name: 'Thường', color: '#9b7b6c' },
  uncommon: { name: 'Ít gặp', color: '#3f9b6b' },
  rare: { name: 'Hiếm', color: '#c86682' },
  legend: { name: 'Huyền thoại', color: '#e0a21a' },
};

// Loại trứng: odds (tỉ lệ nở theo độ hiếm) · hours (giờ game để ấp nở)
export const EGGS = {
  common: { name: 'Trứng thường', icon: '🥚', color: '#fff6e6', spots: '#e8c9a0', odds: { common: 0.7, uncommon: 0.25, rare: 0.05 }, hours: 24 },
  rare: { name: 'Trứng hoa', icon: '🪺', color: '#ffe6ef', spots: '#f6a6b9', odds: { uncommon: 0.5, rare: 0.45, legend: 0.05 }, hours: 48 },
  star: { name: 'Trứng sao', icon: '🌟', color: '#efe6ff', spots: '#ffd36e', odds: { rare: 0.5, legend: 0.5 }, hours: 72 },
};

export const PET_RULES = {
  unlockLevel: 3,           // cấp mở thú cưng (tặng 1 trứng thường đầu tiên)
  maxPets: 8,
  incubators: 1,            // số ổ ấp lúc đầu
  incubatorMax: 3,
  incubatorPrice: [6000, 15000], // giá ổ ấp thứ 2, thứ 3
  maxLevel: 10,
  xpPerLevel: 60,           // XP cần = xpPerLevel × cấp hiện tại
  feedXp: 20, feedLove: 15, // cho ăn: 1 lần / ngày game (1 bông hoa bất kỳ hoặc 1 món ăn vặt)
  petXp: 10, petLove: 10,   // vuốt ve: 1 lần / ngày game
  walkXpPerHour: 2,         // thú đang đi theo bạn: XP mỗi giờ game
  loveDecay: 8,             // mỗi ngày không chăm: thân thiết giảm
  snackFeedBonus: 2,        // cho ăn bằng món ăn vặt: XP ×2
  // việc thú làm khi đi theo bạn (mở theo cấp). chance × (thân thiết / 100) mỗi giờ game
  skills: {
    dig: { level: 2, name: 'Đào hạt giống', icon: '🌱', chance: 0.2 },
    bugs: { level: 4, name: 'Đuổi sâu', icon: '🐛', minutes: 6 },
    mail: { level: 6, name: 'Mang thư của dân làng', icon: '💌', perDay: 1, coins: [60, 220] },
    egg: { level: 8, name: 'Tìm trứng', icon: '🥚', chance: 0.012 },
  },
  // tỉ lệ rơi trứng
  drops: { fish: 0.03, gather: 0.03, luckNormal: 0.08, luckGold: 0.12 },
};

export const PET_NAMES = ['Bông', 'Mây', 'Mít', 'Na', 'Cốm', 'Đậu', 'Sữa', 'Bơ', 'Kem', 'Xoài', 'Mochi', 'Gạo', 'Nấm', 'Tôm', 'Sóc', 'Mận', 'Chè', 'Lu', 'Bi', 'Tý'];
