// =============================================================
//  📖 SỔ THƯỞNG MÙA & ĐIỂM DANH (GĐ26) — MIỄN PHÍ, không bán bằng tiền thật
//  Mỗi mùa sổ kéo dài 14 ngày THẬT (giờ Việt Nam). Làm việc hằng ngày ⇒ điểm ⭐ ⇒ lên bậc ⇒ nhận quà (bấm nhận).
//  Mỗi mùa có chủ đề và trang phục riêng ở bậc 10/20/30.
// =============================================================

export const PASS_RULES = {
  days: 14,            // độ dài 1 mùa sổ (ngày thật)
  tiers: 30,
  perTier: 100,        // điểm mỗi bậc
  dailyCap: 900,       // tối đa điểm mỗi ngày thật (chống cày quá đà)
  epoch: '2026-11-02', // ngày bắt đầu mùa sổ đầu tiên (Thứ Hai)
};

// Nguồn điểm ⭐
export const PASS_POINTS = {
  checkin: 60,     // điểm danh mỗi ngày
  planTask: 30,    // xong 1 việc trong Kế hoạch hôm nay
  planAll: 80,     // xong cả kế hoạch
  booth: 8,        // mỗi ⭐ ở quầy trò chơi (×số sao)
  ride: 12,        // đi 1 trò chơi lớn
  snack: 4,        // bán 1 món ăn vặt
  party: 60,       // xong 1 tiệc
  order: 30,       // giao 1 đơn hàng lớn
  serve: 4,        // phục vụ 1 khách
  harvest: 1,      // thu 1 bông
  fish: 3,         // câu 1 con cá
  petCare: 10,     // cho ăn / vuốt ve thú cưng
  favor: 15,       // giúp dân làng (mini game)
};

// Chủ đề xoay vòng theo mùa sổ: 3 trang phục riêng ở bậc 10, 20, 30
export const PASS_THEMES = [
  { id: 'spring', name: 'Mùa Hoa Đào', icon: '🌸', outfits: ['hat_crown', 'face_heart', 'top_star'] },
  { id: 'sea', name: 'Mùa Biển Xanh', icon: '🌊', outfits: ['shoes_gold', 'face_heart', 'top_star'] },
  { id: 'lantern', name: 'Mùa Đèn Lồng', icon: '🏮', outfits: ['hat_crown', 'shoes_gold', 'top_star'] },
  { id: 'snow', name: 'Mùa Tuyết Bạc', icon: '❄️', outfits: ['face_heart', 'shoes_gold', 'hat_crown'] },
];

// Quà từng bậc (1–30). outfit: 0/1/2 = trang phục thứ mấy của chủ đề · egg: loại trứng · luck/gold: vé · xu: 🪙 · coins · seeds: số gói hạt ngẫu nhiên
export const PASS_REWARDS = [
  { coins: 300 }, { xu: 10 }, { luck: 1 }, { seeds: 3 }, { coins: 500 },
  { egg: 'common' }, { xu: 15 }, { coins: 600 }, { luck: 1 }, { outfit: 0 },
  { coins: 800 }, { seeds: 5 }, { xu: 20 }, { gold: 1 }, { egg: 'common' },
  { coins: 1000 }, { luck: 2 }, { xu: 25 }, { seeds: 6 }, { outfit: 1 },
  { coins: 1200 }, { egg: 'rare' }, { xu: 30 }, { luck: 2 }, { coins: 1500 },
  { gold: 1 }, { xu: 40 }, { seeds: 8 }, { egg: 'rare' }, { outfit: 2, egg: 'star' },
];

// Điểm danh: 7 ngày lặp lại + mốc tổng số ngày trong 28 ngày
export const CHECKIN_WEEK = [
  { coins: 200 }, { seeds: 2 }, { xu: 8 }, { luck: 1 }, { coins: 400 }, { xu: 15 }, { egg: 'common' },
];
export const CHECKIN_MILESTONES = [
  { days: 14, outfit: 'hat_leaf', luck: 2 },
  { days: 28, outfit: 'top_aodai_red', egg: 'rare', gold: 1 },
];
