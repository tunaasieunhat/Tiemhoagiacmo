// =============================================================
//  KHU CHỢ: vật tư, nâng cấp, mở rộng đất
//  (giá hạt giống nằm trong data/flowers.js, giấy gói/ruy băng trong data/wrapping.js)
// =============================================================

export const SUPPLIES = {
  fertilizer: { name: 'Phân bón', icon: '🧪', price: 12, desc: 'Bón cho cây để hoa đẹp hơn và lớn nhanh hơn' },
};

// Mỗi nâng cấp có nhiều bậc. Bậc 0 là đồ có sẵn (miễn phí).
//   value : con số tác dụng (hệ số nhân hoặc số lượng)
export const UPGRADES = {
  can: {
    name: 'Bình tưới', icon: '🚿', effect: 'Độ ẩm sau mỗi lần tưới',
    tiers: [
      { name: 'Bình tưới thiếc', value: 1, desc: 'Giữ ẩm bình thường' },
      { name: 'Bình tưới đồng', value: 1.5, price: 600, level: 2, desc: 'Đất giữ ẩm lâu hơn 50%' },
      { name: 'Bình tưới vàng', value: 2, price: 2250, level: 5, desc: 'Đất giữ ẩm gấp đôi' },
    ],
  },
  shoes: {
    name: 'Giày đi vườn', icon: '👟', effect: 'Tốc độ đi lại',
    tiers: [
      { name: 'Dép lê', value: 1, desc: 'Đi bình thường' },
      { name: 'Giày vải', value: 1.35, price: 400, level: 2, desc: 'Đi nhanh hơn 35%' },
      { name: 'Ủng cầu vồng', value: 1.7, price: 1500, level: 4, desc: 'Đi nhanh hơn 70%' },
    ],
  },
  gloves: {
    name: 'Găng tay', icon: '🧤', effect: 'Tốc độ làm việc',
    tiers: [
      { name: 'Tay không', value: 1, desc: 'Làm bình thường' },
      { name: 'Găng vải', value: 1.4, price: 500, level: 3, desc: 'Làm nhanh hơn 40%' },
      { name: 'Găng da mềm', value: 1.8, price: 1750, level: 5, desc: 'Làm nhanh hơn 80%' },
    ],
  },
  counter: {
    name: 'Quầy hàng', icon: '🪴', effect: 'Số khách chờ tối đa',
    tiers: [
      { name: 'Quầy nhỏ', value: 3, desc: '3 khách cùng lúc' },
      { name: 'Quầy rộng', value: 4, price: 1250, level: 3, desc: '4 khách cùng lúc' },
      { name: 'Quầy sang trọng', value: 5, price: 3750, level: 6, desc: '5 khách cùng lúc' },
    ],
  },
  sign: {
    name: 'Biển hiệu', icon: '🪧', effect: 'Độ kiên nhẫn của khách',
    tiers: [
      { name: 'Biển gỗ', value: 1, desc: 'Bình thường' },
      { name: 'Biển hoa', value: 1.2, price: 750, level: 2, desc: 'Khách kiên nhẫn hơn 20%' },
      { name: 'Biển đèn lấp lánh', value: 1.45, price: 2500, level: 5, desc: 'Khách kiên nhẫn hơn 45%' },
    ],
  },
};

// Mở rộng lô đất (slot = vị trí trên bản đồ, 0 là lô có sẵn)
export const PLOT_UNLOCKS = [
  { slot: 1, price: 1000, level: 2 },
  { slot: 2, price: 3000, level: 4 },
  { slot: 3, price: 7500, level: 6 },
];
