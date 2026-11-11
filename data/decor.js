// =============================================================
//  ĐỒ TRANG TRÍ — đặt TỰ DO quanh nông trại, tiệm hoa, khu chợ (GĐ10)
//  beauty : điểm xinh xắn (bạn bè thấy khi ghé thăm)
//  size   : bán kính chỗ chiếm trên mặt đất (đơn vị 3D) — 2 món không được đè lên nhau
//  event  : 'pumpkin' = đồ Lễ hội Bí Ngô (Halloween), chỉ BÁN trong Mùa Thu (mua rồi thì giữ mãi)
//  luck   : đồ chỉ có ở 🍀 Vận May (không bán ở Chợ, mỗi món chỉ có 1 cái)
//  weekly : quà sự kiện tuần (không bán ở Chợ)
// =============================================================
export const DECOR = {
  fishtank: { name: 'Bể cá cảnh', icon: '🐠', price: 4000, level: 20, beauty: 12, size: 0.8 }, // (GĐ22) cá bơi vòng quanh trong bể
  bench: { name: 'Ghế gỗ', icon: '🪑', price: 240, level: 1, beauty: 2, size: 0.8 },
  pot: { name: 'Chậu hoa to', icon: '🪴', price: 160, level: 1, beauty: 1, size: 0.45 },
  lantern: { name: 'Đèn lồng', icon: '🏮', price: 300, level: 2, beauty: 2, size: 0.55 },
  mailbox: { name: 'Hòm thư', icon: '📮', price: 200, level: 2, beauty: 1, size: 0.4 },
  birdhouse: { name: 'Nhà chim', icon: '🐦', price: 360, level: 3, beauty: 3, size: 0.45 },
  swing: { name: 'Xích đu', icon: '🎠', price: 800, level: 3, beauty: 5, size: 1.0 },
  bunny: { name: 'Tượng thỏ', icon: '🐰', price: 600, level: 4, beauty: 4, size: 0.45 },
  teaset: { name: 'Bàn trà', icon: '🍵', price: 700, level: 4, beauty: 4, size: 1.15 },
  windmill: { name: 'Cối xay gió', icon: '🌬️', price: 1400, level: 5, beauty: 7, size: 0.75 },
  fountain: { name: 'Đài phun nước', icon: '⛲', price: 1800, level: 6, beauty: 9, size: 1.15 },
  arch: { name: 'Cổng hoa hồng', icon: '💒', price: 1300, level: 5, beauty: 6, size: 1.15 },
  balloon: { name: 'Khinh khí cầu', icon: '🎈', price: 3000, level: 8, beauty: 12, size: 1.0 },

  // ---- 🎃 Lễ hội Bí Ngô (Halloween) ----
  pumpkin: { name: 'Đèn bí ngô', icon: '🎃', price: 180, level: 1, beauty: 2, size: 0.5, event: 'pumpkin' },
  candles: { name: 'Chùm nến ma', icon: '🕯️', price: 220, level: 1, beauty: 2, size: 0.4, event: 'pumpkin' },
  ghost: { name: 'Bù nhìn ma', icon: '👻', price: 440, level: 2, beauty: 3, size: 0.55, event: 'pumpkin' },
  grave: { name: 'Bia mộ dễ thương', icon: '🪦', price: 320, level: 2, beauty: 2, size: 0.5, event: 'pumpkin' },
  bats: { name: 'Cột dơi bay', icon: '🦇', price: 520, level: 3, beauty: 3, size: 0.5, event: 'pumpkin' },
  cauldron: { name: 'Nồi phù thủy', icon: '🧪', price: 760, level: 3, beauty: 4, size: 0.7, event: 'pumpkin' },
  web: { name: 'Cổng mạng nhện', icon: '🕸️', price: 900, level: 4, beauty: 5, size: 1.1, event: 'pumpkin' },
  pumpkinhouse: { name: 'Nhà bí ngô', icon: '🏚️', price: 2400, level: 5, beauty: 10, size: 1.35, event: 'pumpkin' },

  // ---- 🍀 Vận May (GĐ15) ----
  clover: { name: 'Tượng cỏ bốn lá', icon: '🍀', price: 0, level: 1, beauty: 8, size: 0.6, luck: true },
  luckycat: { name: 'Mèo vẫy tay', icon: '🐱', price: 0, level: 1, beauty: 8, size: 0.55, luck: true },
  starlamp: { name: 'Đèn ngôi sao', icon: '⭐', price: 0, level: 1, beauty: 10, size: 0.6, luck: true },

  // ---- 📅 Sự kiện tuần (GĐ18): quà mốc cuối, không bán ở Chợ ----
  flowercart: { name: 'Xe hoa sự kiện', icon: '🛒', price: 0, level: 1, beauty: 12, size: 0.9, weekly: true },
  trophy: { name: 'Cúp vàng sự kiện', icon: '🏆', price: 0, level: 1, beauty: 12, size: 0.55, weekly: true },
  carousel: { name: 'Đu quay hoa mini', icon: '🎠', price: 0, level: 1, beauty: 14, size: 1.0, weekly: true },
};

// Sự kiện bán đồ theo mùa
export const DECOR_EVENTS = {
  pumpkin: { name: 'Lễ hội Bí Ngô', icon: '🎃', season: 'thu', desc: 'Đồ Halloween chỉ bán trong Mùa Thu. Mua rồi thì giữ mãi, đặt lúc nào cũng được.' },
};

// Luật đặt đồ tự do
export const DECOR_RULES = {
  grid: 0.5,          // đồ bám theo lưới 0,5 ô cho thẳng hàng
  rotateStep: 45,     // mỗi lần bấm "Xoay" quay bao nhiêu độ
  maxPlaced: 60,      // tối đa bao nhiêu món đặt cùng lúc
  islandMargin: 1.6,  // cách mép đảo tối thiểu
  pathMargin: 0.55,   // cách đường đá tối thiểu (để khách và nhân vật đi lại)
};

// Vị trí cố định của bản cũ (GĐ8–9) — chỉ dùng để chuyển save cũ sang kiểu đặt tự do
export const LEGACY_SLOTS = [
  { id: 'f1', zone: 'farm', x: -7.4, z: 8.6 }, { id: 'f2', zone: 'farm', x: -3.0, z: 9.0 },
  { id: 'f3', zone: 'farm', x: 1.8, z: 9.0 }, { id: 'f4', zone: 'farm', x: 6.6, z: 8.2 },
  { id: 'f5', zone: 'farm', x: 7.2, z: 3.2 }, { id: 'f6', zone: 'farm', x: 7.0, z: -2.0 },
  { id: 'f7', zone: 'farm', x: -3.6, z: -4.6 }, { id: 'f8', zone: 'farm', x: 3.4, z: -4.8 },
  { id: 's1', zone: 'shop', x: 7.2, z: -3.4 }, { id: 's2', zone: 'shop', x: 14.6, z: -3.8 },
  { id: 's3', zone: 'shop', x: 15.2, z: -8.4 }, { id: 's4', zone: 'shop', x: 7.0, z: -8.6 },
];
