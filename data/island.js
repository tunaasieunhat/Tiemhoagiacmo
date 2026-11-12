// =============================================================
//  🏝️ ĐẢO CHÍNH (GĐ24) — hình dạng & các khu
//  Đảo = hình tròn gốc (tâm 0,0 bán kính 25: nông trại, tiệm hoa, nhà bạn) + các "mũi đất" mở rộng ra những hướng
//  còn trống (không đụng Đồi Mộng phía bắc, Cồn Lặng phía tây, Mũi Én phía đông, Ngàn Hương tây bắc, Làng phía nam).
//  Tọa độ: x (trái/phải), z (càng âm càng về phía bắc).
// =============================================================

export const MAIN_R = 25;

// Mũi đất mở rộng. zone: khu gì · cam: true = camera kéo tới được
export const LOBES = [
  { id: 'park', x: -20, z: -8, r: 12, zone: 'park' },
  { id: 'fun', x: 24, z: -22, r: 15, zone: 'fun' },
  { id: 'market', x: 32, z: 1, r: 12, zone: 'market' },
  { id: 'grove_se', x: 26, z: 24, r: 14, zone: 'forest' },
  { id: 'grove_sw', x: -22, z: 28, r: 13, zone: 'forest' },
];

// Các khu (biển tên + chỗ đặt)
export const ISLAND_ZONES = {
  home: { name: 'Nhà của bạn', sub: 'Chạm để trang trí nhà', at: [-7, -12], face: [0, -6] },
  park: { name: 'Công Viên', sub: 'Khu đặt đồ trang trí', at: [-20, -8], fountain: [-20, -7.5], gazebo: [-25, -12.5] },
  fun: { name: 'Khu Vui Chơi', sub: 'Đu quay · quầy trò chơi · ăn vặt', at: [24, -22], fence: 11.5 }, // (GĐ26) rộng hơn để đủ chỗ trò chơi
  market: { name: 'Khu Mua Bán', sub: 'Hạt giống, vật tư, nâng cấp', at: [31, 1], pier: [43.6, 1.2] },
};

// Lối ra các đảo khác: rừng không mọc ở đây (x, z, bán kính để trống)
export const ISLAND_EXITS = [
  [3, -25, 4.5],      // cầu lên Đồi Mộng (bắc)
  [-25, 5.5, 4],      // đường đá sang Cồn Lặng (tây)
  [-21.8, -20.2, 4],  // cầu gỗ sang Đảo Ngàn Hương (tây bắc)
  [43, 1.2, 4],       // cầu tàu phía đông (khu mua bán)
  [0, 24, 6],         // đường xuống Làng Hoa (nam)
];

// Rừng bao quanh
export const FOREST = {
  band: 4.2,          // rừng mọc trong dải cách bờ bấy nhiêu đơn vị
  spacing: 1.9,       // khoảng cách lưới rải cây (càng nhỏ càng rậm)
  groveFill: 0.62,    // ở 2 khu rừng (đông nam, tây nam): tỉ lệ ô có cây
  pineRatio: 0.35,    // tỉ lệ cây thông (lá kim, mùa đông vẫn xanh)
  // màu tán lá theo mùa [xuân, hạ, thu, đông]. Mỗi mùa vài màu để rừng loang lổ tự nhiên
  leaf: [
    ['#8fd18b', '#7cc27f', '#f6b8cf', '#ffd1e0'],      // xuân: xanh non + hoa anh đào hồng
    ['#5fae5c', '#4f9e52', '#6fbf63', '#58a957'],      // hạ: xanh đậm
    ['#f0a04a', '#e0603a', '#f2c14e', '#c96a3a'],      // thu: cam, đỏ, vàng
    ['#e9f1f4', '#dfe8ee', '#cfd8dd', '#f4f8fa'],      // đông: trụi lá, phủ tuyết
  ],
  pine: ['#4f8f52', '#3f8048', '#4a7a45', '#3f6f50'],
  winterLeafScale: 0.7, // mùa đông tán cây nhỏ lại (rụng lá)
};

// Thời tiết chi tiết (GĐ24)
export const WEATHER_FX = {
  wetUp: 0.06,        // đất ướt dần mỗi giây thật khi mưa (0..1)
  wetDown: 0.008,     // khô dần mỗi giây khi tạnh
  snowUp: 0.025,      // tuyết phủ dần mỗi giây khi có tuyết
  snowDown: 0.006,    // tuyết tan dần
  frostMorning: 0.35, // sương giá: sáng sớm cỏ trắng mờ (tan dần tới trưa)
  lightning: [3.5, 9],// bão: chớp mỗi 3,5–9 giây
  splashes: 0,        // (0.25.2) bọt nước giờ bắn đúng chỗ hạt mưa rơi xuống (src/render/weatherFx.js)
  puddles: 60,        // số vũng nước rải trên đảo
  clouds: 0,          // (0.25.2) bóng mây giờ đi theo mây 3D thật (src/render/weatherFx.js)
};
