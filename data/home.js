// =============================================================
//  🏡 NHÀ CỦA BẠN (GĐ24) — ngôi nhà nhỏ cạnh nông trại, chỉ nhìn từ bên ngoài, trang trí được
//  Màu tường / mái / cửa: mua một lần là đổi qua lại thoải mái. Vật phẩm: mua rồi bật / tắt tùy thích.
//  price: giá (xu) · level: cấp tối thiểu
// =============================================================

export const HOME_COLORS = {
  wall: {
    cream: { name: 'Kem sữa', color: '#fff3e4', price: 0 },
    pink: { name: 'Hồng đào', color: '#ffe0e6', price: 300 },
    mint: { name: 'Bạc hà', color: '#dff5ea', price: 300 },
    sky: { name: 'Xanh trời', color: '#e2f0ff', price: 300 },
    lilac: { name: 'Tím nhạt', color: '#ece2ff', price: 450 },
    butter: { name: 'Vàng bơ', color: '#fff4c8', price: 450 },
    brick: { name: 'Gạch nung', color: '#e7b49a', price: 800, level: 8 },
  },
  roof: {
    coral: { name: 'San hô', color: '#f08a7e', price: 0 },
    teal: { name: 'Xanh ngọc', color: '#5fb8b0', price: 300 },
    plum: { name: 'Mận chín', color: '#b07ab8', price: 300 },
    forest: { name: 'Xanh rêu', color: '#6f9e62', price: 450 },
    navy: { name: 'Xanh đêm', color: '#5a6f9e', price: 450 },
    choco: { name: 'Sô-cô-la', color: '#8a5a44', price: 600, level: 6 },
  },
  door: {
    wood: { name: 'Gỗ mộc', color: '#9a6a4c', price: 0 },
    red: { name: 'Đỏ son', color: '#d9506f', price: 200 },
    blue: { name: 'Xanh biển', color: '#5f9fd0', price: 200 },
    yellow: { name: 'Vàng nắng', color: '#f4c34e', price: 200 },
    white: { name: 'Trắng sứ', color: '#f8f6f2', price: 200 },
  },
};
export const HOME_PARTS = { wall: 'Tường', roof: 'Mái', door: 'Cửa' };

// Vật phẩm gắn vào nhà
export const HOME_ITEMS = {
  mailbox: { name: 'Hộp thư', icon: '📮', price: 250, desc: 'Hộp thư gỗ bên lối đi.' },
  flowerbox: { name: 'Bồn hoa cửa sổ', icon: '🌷', price: 400, desc: 'Hai bồn hoa nhỏ dưới cửa sổ.' },
  wreath: { name: 'Vòng hoa cửa', icon: '💐', price: 300, desc: 'Vòng hoa treo trên cửa ra vào.' },
  lantern: { name: 'Đèn hiên', icon: '🏮', price: 500, desc: 'Đèn lồng sáng ấm khi trời tối.' },
  chimney: { name: 'Ống khói', icon: '🏭', price: 600, desc: 'Ống khói gạch, tỏa khói nhẹ.', level: 4 },
  bench: { name: 'Ghế hiên', icon: '🪑', price: 450, desc: 'Ghế gỗ ngồi hóng gió.' },
  mat: { name: 'Thảm chùi chân', icon: '🟫', price: 120, desc: 'Tấm thảm “Chào mừng”.' },
  pots: { name: 'Chậu cây', icon: '🪴', price: 350, desc: 'Ba chậu cây xanh bên bậc thềm.' },
  fence: { name: 'Hàng rào trắng', icon: '🤍', price: 900, desc: 'Hàng rào cọc trắng quanh sân nhà.', level: 5 },
  arch: { name: 'Cổng hoa', icon: '🌸', price: 1200, desc: 'Cổng vòm hoa hồng leo ở lối vào.', level: 7 },
  lights: { name: 'Dây đèn', icon: '✨', price: 800, desc: 'Dây đèn nhỏ dọc mái, lấp lánh ban đêm.', level: 6 },
  birdhouse: { name: 'Nhà chim', icon: '🐦', price: 550, desc: 'Nhà chim trên cột gỗ.' },
  swing: { name: 'Xích đu', icon: '🌳', price: 1500, desc: 'Xích đu gỗ treo cạnh nhà.', level: 9 },
  cat: { name: 'Mèo mướp', icon: '🐈', price: 2000, desc: 'Một chú mèo nằm phơi nắng trên bậc thềm.', level: 10 },
};
