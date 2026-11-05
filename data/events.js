// =============================================================
//  📅 SỰ KIỆN HẰNG TUẦN (GĐ18) — theo tuần THẬT, giờ Việt Nam (bắt đầu thứ Hai)
//  Mỗi tuần 1 chủ đề (xoay vòng). Làm việc liên quan chủ đề để tích ĐIỂM SỰ KIỆN, đạt mốc thì nhận quà.
//  Mốc cuối tặng 1 đồ trang trí sự kiện (chỉ có ở sự kiện).
// =============================================================

export const EVENT_RULES = {
  unlockLevel: 2,
};

// Chủ đề xoay vòng theo số tuần. flowers: loài được tính điểm; decor: quà ở mốc cuối; bugMult: nhân điểm bắt sâu
export const EVENT_THEMES = [
  { id: 'rose', name: 'Tuần lễ Hoa Hồng', icon: '🌹', color: '#f47a93', flowers: ['rose', 'peony', 'carnation'], decor: 'flowercart',
    desc: 'Cả làng mê hoa hồng! Trồng và bán hồng, mẫu đơn, cẩm chướng để tích điểm.' },
  { id: 'sunny', name: 'Tuần lễ Nắng Vàng', icon: '🌻', color: '#f6b928', flowers: ['sunflower', 'marigold', 'cosmos'], decor: 'trophy',
    desc: 'Hoa vàng rực rỡ: hướng dương, cúc vạn thọ, sao nhái được săn đón.' },
  { id: 'pastel', name: 'Tuần lễ Pastel', icon: '🌷', color: '#c79cf2', flowers: ['tulip', 'hydrangea', 'lavender'], decor: 'carousel',
    desc: 'Màu dịu dàng lên ngôi: tulip, cẩm tú cầu, oải hương.' },
  { id: 'garden', name: 'Tuần lễ Vườn Trắng', icon: '🤍', color: '#9fd6c8', flowers: ['daisy', 'lily', 'orchid'], decor: 'flowercart',
    desc: 'Vườn hoa trắng tinh khôi: cúc họa mi, hoa ly, lan hồ điệp.' },
  { id: 'bugs', name: 'Tuần lễ Săn Sâu', icon: '🐛', color: '#8cc63f', flowers: ['cosmos', 'daisy'], decor: 'trophy', bugMult: 3,
    desc: 'Sâu kéo đến đông! Bắt sâu được gấp 3 điểm.' },
];

// Điểm sự kiện cho mỗi việc
export const EVENT_POINTS = {
  harvestTheme: 2,  // thu hoạch 1 bông thuộc chủ đề
  sellTheme: 3,     // bán cho khách 1 cành thuộc chủ đề
  bouquetTheme: 6,  // giao bó hoa có hoa chủ đề
  perfect: 3,       // khách cực kỳ hài lòng
  bug: 2,           // bắt 1 con sâu
  order: 15,        // giao 1 đơn hàng lớn
  favor: 5,         // giúp dân làng (≥1⭐)
};

// Mốc điểm và quà (mốc cuối: đồ trang trí sự kiện của tuần)
export const EVENT_MILESTONES = [
  { pts: 60, reward: { coins: 300 } },
  { pts: 150, reward: { luck: 2 } },
  { pts: 300, reward: { coins: 1200, fertilizer: 10 } },
  { pts: 500, reward: { gold: 1 } },
  { pts: 800, reward: { eventDecor: true, coins: 2000 } },
];
