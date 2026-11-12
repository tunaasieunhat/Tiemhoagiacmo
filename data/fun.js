// =============================================================
//  🎡 KHU VUI CHƠI (GĐ26 · Lễ Hội Đảo Mây) — mũi đất đông bắc đảo chính
//  Trò chơi lớn (đi bằng 💰) · 5 quầy trò chơi (mini game, thưởng 🪙 Xu Vui) · quầy đổi quà · quầy ăn vặt từ hoa.
//  Khu mở sau cốt truyện ngắn "Người dựng đu quay" (data/storyFun.js, dấu 'fun_open').
// =============================================================

export const FUN = {
  center: [24, -22],
  fence: 11.5,                 // bán kính hàng rào (to hơn bản "sắp khai trương" để đủ chỗ)
  gateAngle: Math.PI * 0.86,   // cổng phía tây nam (hướng về nông trại)
  open: [8, 22],               // giờ mở cửa
  coin: { name: 'Xu Vui', icon: '🪙' },
};

// Trò chơi lớn: at = vị trí so với tâm khu · price 💰 · pass: điểm Sổ thưởng mùa · desc
export const RIDES = {
  wheel: { name: 'Đu quay Mây', icon: '🎡', at: [4.6, -5.4], price: 40, seconds: 9, pass: 15, desc: 'Lên cao ngắm toàn quần đảo. Thú cưng đi cùng thì vui hơn!' },
  carousel: { name: 'Ngựa gỗ xoay', icon: '🎠', at: [-3.6, -5.6], price: 25, seconds: 7, pass: 10, desc: 'Vòng quay ngựa gỗ và nhạc hộp leng keng.' },
  coaster: { name: 'Tàu lượn Ong Vàng', icon: '🎢', at: [6.6, 1.6], price: 50, seconds: 7, pass: 15, desc: 'Tàu lượn mini chạy vòng quanh khu, hét to cho vui!' },
  mirror: { name: 'Nhà gương', icon: '🪞', at: [-7.2, -1.8], price: 20, seconds: 6, pass: 10, desc: 'Gương méo làm bạn thành người khổng lồ, rồi thành tí hon.' },
};

// Quầy trò chơi: game = mini game (src/ui/funGames.js, hoặc game có sẵn) · price 💰 mỗi lượt · xu: Xu Vui theo 0–3⭐
export const BOOTHS = {
  ringtoss: { name: 'Ném vòng', icon: '⭕', game: 'ringtoss', at: [-1.2, 6.8], color: '#ff8fb1', price: 30, xu: [1, 4, 8, 14] },
  watergun: { name: 'Bắn bóng nước', icon: '🎈', game: 'watergun', at: [1.8, 7.4], color: '#8fd8ff', price: 30, xu: [1, 4, 8, 14] },
  ducks: { name: 'Câu vịt', icon: '🦆', game: 'ducks', at: [4.6, 6.4], color: '#ffd36e', price: 30, xu: [1, 4, 8, 14] },
  whack: { name: 'Đập chuột chũi', icon: '🔨', game: 'whack', at: [-4.2, 5.8], color: '#b9a2ff', price: 30, xu: [1, 4, 8, 14] },
  bouquet: { name: 'Cắm hoa nhanh', icon: '💐', game: 'arrange', at: [-6.6, 3.4], color: '#9be29b', price: 30, xu: [1, 4, 8, 14] },
};

// Quầy đổi quà: kind outfit (mã trong data/wardrobe.js) | egg (loại trứng) | decor (mã trong data/decor.js) | luck (vé) · cost 🪙
export const PRIZES = [
  { id: 'p_flowercrown', kind: 'outfit', ref: 'hat_flower', cost: 50 },
  { id: 'p_curly', kind: 'outfit', ref: 'hair_curly', cost: 60 },
  { id: 'p_spiky', kind: 'outfit', ref: 'hair_spiky', cost: 60 },
  { id: 'p_starglass', kind: 'outfit', ref: 'face_star', cost: 60 },
  { id: 'p_flowerbag', kind: 'outfit', ref: 'bag_flower', cost: 70 },
  { id: 'p_bunny', kind: 'outfit', ref: 'hat_bunny', cost: 80 },
  { id: 'p_mint', kind: 'outfit', ref: 'top_dress_mint', cost: 90 },
  { id: 'p_egg', kind: 'egg', ref: 'common', cost: 45, repeat: true },
  { id: 'p_egg2', kind: 'egg', ref: 'rare', cost: 160, repeat: true },
  { id: 'p_luck', kind: 'luck', ref: 1, cost: 25, repeat: true },
  { id: 'p_teddy', kind: 'decor', ref: 'fun_teddy', cost: 40, repeat: true },
  { id: 'p_balloon', kind: 'decor', ref: 'fun_balloons', cost: 35, repeat: true },
];

// 🍡 Quầy ăn vặt: flowers = { loài: số bông } · pantry = nguyên liệu mua ở quầy · price 💰 (1⭐) · game: mini game "làm khéo"
export const SNACKS = {
  cotton_rose: { name: 'Kẹo bông hoa hồng', icon: '🍭', flowers: { rose: 2 }, pantry: { sugar: 2 }, price: 70, game: 'jam' },
  ice_lav: { name: 'Kem oải hương', icon: '🍦', flowers: { lavender: 2 }, pantry: { milk: 1, sugar: 1, ice: 1 }, price: 90, game: 'jam' },
  tea_milk: { name: 'Trà sữa hoa cúc', icon: '🧋', flowers: { daisy: 1 }, pantry: { milk: 1, ice: 1 }, price: 60, game: 'pour' },
  cake_marigold: { name: 'Bánh bông lan vạn thọ', icon: '🧁', flowers: { marigold: 2 }, pantry: { flour: 2, milk: 1, sugar: 1 }, price: 110, game: 'jam' },
  jelly_hyd: { name: 'Thạch tú cầu', icon: '🍮', flowers: { hydrangea: 1 }, pantry: { sugar: 1, ice: 1 }, price: 65, game: 'pour' },
  candy_sun: { name: 'Kẹo hạt hướng dương', icon: '🍬', flowers: { sunflower: 2 }, pantry: { sugar: 2 }, price: 75, game: 'jam' },
  waffle_tulip: { name: 'Bánh tổ ong tulip', icon: '🧇', flowers: { tulip: 2 }, pantry: { flour: 2, milk: 1 }, price: 95, game: 'jam' },
};

// Nguyên liệu mua ở quầy ăn vặt (💰 mỗi phần)
export const PANTRY = {
  sugar: { name: 'Đường', icon: '🍚', price: 6 },
  milk: { name: 'Sữa', icon: '🥛', price: 10 },
  flour: { name: 'Bột mì', icon: '🌾', price: 6 },
  ice: { name: 'Đá bào', icon: '🧊', price: 4 },
};

export const FUN_RULES = {
  snackQ: [0.8, 1, 1.35, 1.75],  // giá × theo số sao (0⭐ = làm nhanh, vẫn bán được)
  snackSales: 2.4,               // món bán được mỗi giờ (giờ mở cửa)
  saturdayMult: 2,               // tối Thứ Bảy (18–22h): lễ hội, khách đông gấp đôi
  shelfMax: 40,
  quickStars: 1,                 // "Làm nhanh" (không chơi mini game) = 1⭐
  storyNeed: { level: 6 },       // mở cốt truyện Khu Vui Chơi
  repairCost: 3000,              // góp tiền sửa đu quay (chương 1)
};

// Mini game quầy trò chơi: số liệu (gộp vào MINIGAMES ở data/minigames.js)
export const FUN_GAMES = {
  ringtoss: { seconds: 22, need: [3, 5, 7], speed: 1.4, help: 'Chai chạy qua lại. Chạm để ném vòng khi chai nằm ngay dưới vạch ném. Chai vàng ✨ được 2 điểm!' },
  watergun: { seconds: 20, need: [8, 13, 18], life: 1.6, help: 'Chạm bóng bay 🎈 trước khi bay mất. Đừng bắn trúng bom nước 💣!' },
  ducks: { seconds: 22, need: [4, 6, 9], speed: 70, help: 'Vịt trôi qua lại. Chạm vịt có số ⭐ để câu — vịt vàng ✨ được 3 điểm, vịt đen thì trừ điểm.' },
  whack: { seconds: 20, need: [9, 14, 19], life: 1.1, help: 'Đập chuột chũi 🐹 thò lên. Đừng đập trúng thỏ 🐰 nhé!' },
};
export const FUN_LEVELS = {
  ringtoss: { speed: [1.4, 1.75, 2.1] },
  watergun: { life: [1.6, 1.3, 1.05] },
  ducks: { speed: [70, 95, 120] },
  whack: { life: [1.1, 0.9, 0.72] },
};
