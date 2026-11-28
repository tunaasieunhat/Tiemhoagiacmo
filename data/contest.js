// =============================================================
//  CUỘC THI HOA — mỗi "mùa thi" kéo dài 1 tuần THẬT (thứ Hai → Chủ nhật, giờ Việt Nam)
//  Chủ đề xoay vòng theo tuần. Máy chủ (Edge Function) chấm lại điểm bằng chính công thức này.
// =============================================================
export const CONTEST = {
  maxEntriesPerRound: 3,    // số lần nộp mỗi tuần (tính bó cao điểm nhất)
  rareBonusMax: 10,         // điểm cộng tối đa khi dùng màu hoa hiếm / ít gặp
  rewards: [                // thưởng khi hết mùa thi (theo hạng)
    { top: 1, coins: 3000, title: '🥇 Quán quân' },
    { top: 3, coins: 1800, title: '🥈 Á quân' },
    { top: 10, coins: 1000, title: '🏅 Top 10' },
    { topPct: 30, coins: 500, title: '🌟 Top 30%' },
    { topPct: 100, coins: 150, title: '🌼 Tham gia' },
  ],
};

export const CONTEST_THEMES = [
  { id: 'xuan', name: 'Sắc Xuân rạng rỡ', icon: '🌸', tone: 'pastel', meaning: 'joy', min: 5, max: 9 },
  { id: 'ha', name: 'Nắng Hạ chói chang', icon: '☀️', tone: 'warm', meaning: 'hope', min: 5, max: 9 },
  { id: 'thu', name: 'Thu dịu dàng', icon: '🍁', tone: 'natural', meaning: 'gratitude', min: 5, max: 9 },
  { id: 'dong', name: 'Đông ấm áp', icon: '❄️', tone: 'cool', meaning: 'love', min: 5, max: 9 },
];
