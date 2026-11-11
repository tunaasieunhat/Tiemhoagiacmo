// =============================================================
//  NHIỆM VỤ NGÀY / TUẦN (theo ngày & tuần trong game: 1 tuần = 7 ngày game)
//  n: số lượng cần làm theo 3 mức độ (cấp 1–3, 4–6, 7+)
//  online: chỉ xuất hiện khi đã đăng nhập; minLevel: cấp tối thiểu
// =============================================================
export const QUESTS = {
  perDay: 3,
  perWeek: 3,
  // (0.16) giảm thưởng cho cân bằng
  dailyReward: [{ coins: 40, xp: 8 }, { coins: 80, xp: 12 }, { coins: 130, xp: 18 }],
  weeklyReward: [{ coins: 250, xp: 40, fertilizer: 3 }, { coins: 500, xp: 70, fertilizer: 5 }, { coins: 900, xp: 110, fertilizer: 8 }],
};

export const QUEST_TEMPLATES = {
  daily: [
    { id: 'harvest', text: 'Thu hoạch {n} bông hoa', icon: '🧺', event: 'harvest', n: [4, 8, 12] },
    { id: 'harvest3', text: 'Thu hoạch {n} bông hoa 3★', icon: '⭐', event: 'harvest3', n: [1, 3, 5] },
    { id: 'plant', text: 'Gieo {n} hạt giống', icon: '🌱', event: 'plant', n: [4, 8, 12] },
    { id: 'water', text: 'Tưới nước {n} lần', icon: '💧', event: 'water', n: [5, 10, 15] },
    { id: 'serve', text: 'Phục vụ {n} khách ở tiệm', icon: '🏪', event: 'serve', n: [2, 4, 6] },
    { id: 'bouquet', text: 'Gói {n} bó hoa cho khách', icon: '💐', event: 'bouquet', n: [1, 2, 3] },
    { id: 'earn', text: 'Kiếm {n} 💰 từ bán hoa', icon: '💰', event: 'earn', n: [150, 400, 800] },
    { id: 'fish', text: 'Câu được {n} con cá', icon: '🎣', event: 'fish', n: [3, 5, 8], flag: 'co_fish' }, // flag: chỉ có khi đã có dấu cốt truyện này
    { id: 'bugs', text: 'Bắt {n} con sâu trên luống hoa', icon: '🐛', event: 'bug', n: [3, 5, 8] },
  ],
  weekly: [
    { id: 'w_harvest', text: 'Thu hoạch {n} bông hoa', icon: '🧺', event: 'harvest', n: [30, 60, 100] },
    { id: 'w_perfect', text: 'Làm {n} khách cực kỳ hài lòng', icon: '😍', event: 'perfect', n: [3, 6, 10] },
    { id: 'w_earn', text: 'Kiếm {n} 💰 từ bán hoa', icon: '💰', event: 'earn', n: [1500, 3500, 7000] },
    { id: 'w_breed', text: 'Lai tạo {n} lần', icon: '🧬', event: 'breed', n: [1, 2, 3], minLevel: 3 },
    { id: 'w_regular', text: 'Làm khách quen vui lòng {n} lần', icon: '💌', event: 'regular', n: [1, 2, 3] },
    { id: 'w_help', text: 'Tưới giúp bạn bè {n} lần', icon: '👥', event: 'help', n: [1, 3, 5], online: true },
    { id: 'w_newcolor', text: 'Khám phá {n} màu hoa mới', icon: '📖', event: 'newcolor', n: [1, 1, 2], minLevel: 3 },
    { id: 'w_fish', text: 'Câu được {n} con cá', icon: '🎣', event: 'fish', n: [15, 25, 40], flag: 'co_fish' },
    { id: 'w_fishrare', text: 'Câu được {n} con cá bậc Hiếm trở lên', icon: '🐠', event: 'fishrare', n: [2, 3, 5], flag: 'co_fish' },
    { id: 'w_order', text: 'Giao {n} đơn hàng lớn', icon: '📦', event: 'order', n: [1, 2, 3], minLevel: 3 },
  ],
};
