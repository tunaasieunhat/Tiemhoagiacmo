// =============================================================
//  ĐỒ TRANG TRÍ — đặt vào các vị trí quanh nông trại & tiệm hoa
//  beauty: điểm xinh xắn (bạn bè thấy khi ghé thăm)
// =============================================================
export const DECOR = {
  bench: { name: 'Ghế gỗ', icon: '🪑', price: 120, level: 1, beauty: 2 },
  pot: { name: 'Chậu hoa to', icon: '🪴', price: 80, level: 1, beauty: 1 },
  lantern: { name: 'Đèn lồng', icon: '🏮', price: 150, level: 2, beauty: 2 },
  mailbox: { name: 'Hòm thư', icon: '📮', price: 100, level: 2, beauty: 1 },
  birdhouse: { name: 'Nhà chim', icon: '🐦', price: 180, level: 3, beauty: 3 },
  swing: { name: 'Xích đu', icon: '🎠', price: 400, level: 3, beauty: 5 },
  bunny: { name: 'Tượng thỏ', icon: '🐰', price: 300, level: 4, beauty: 4 },
  teaset: { name: 'Bàn trà', icon: '🍵', price: 350, level: 4, beauty: 4 },
  windmill: { name: 'Cối xay gió', icon: '🌬️', price: 700, level: 5, beauty: 7 },
  fountain: { name: 'Đài phun nước', icon: '⛲', price: 900, level: 6, beauty: 9 },
  arch: { name: 'Cổng hoa hồng', icon: '💒', price: 650, level: 5, beauty: 6 },
  balloon: { name: 'Khinh khí cầu', icon: '🎈', price: 1500, level: 8, beauty: 12 },
};

// Vị trí đặt đồ (tọa độ trên bản đồ). zone: farm | shop
export const DECOR_SLOTS = [
  { id: 'f1', zone: 'farm', x: -7.4, z: 8.6 }, { id: 'f2', zone: 'farm', x: -3.0, z: 9.0 },
  { id: 'f3', zone: 'farm', x: 1.8, z: 9.0 }, { id: 'f4', zone: 'farm', x: 6.6, z: 8.2 },
  { id: 'f5', zone: 'farm', x: 7.2, z: 3.2 }, { id: 'f6', zone: 'farm', x: 7.0, z: -2.0 },
  { id: 'f7', zone: 'farm', x: -3.6, z: -4.6 }, { id: 'f8', zone: 'farm', x: 3.4, z: -4.8 },
  { id: 's1', zone: 'shop', x: 7.2, z: -3.4 }, { id: 's2', zone: 'shop', x: 14.6, z: -3.8 },
  { id: 's3', zone: 'shop', x: 15.2, z: -8.4 }, { id: 's4', zone: 'shop', x: 7.0, z: -8.6 },
];
