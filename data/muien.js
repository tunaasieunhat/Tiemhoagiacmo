// =============================================================
//  🌫️ MŨI ÉN (GĐ21) — hòn đảo phía đông, đi bằng thuyền từ cầu tàu Làng Hoa
//  Ba mươi năm không mưa, chỉ có sương. Đất mặn: chỉ trồng được hoa chịu mặn (salt: true trong data/flowers.js).
//  Tọa độ: tâm đảo ở center; các vị trí bên dưới là tọa độ THẬT trên bản đồ (x, z).
// =============================================================

export const EN = {
  center: [62, 4],       // tâm đảo
  radius: 13,            // bán kính đảo
  camRadius: 10.5,       // camera được kéo tới đâu trên đảo
  dock: [51.2, 6.2],     // bến thuyền (phía tây, hướng về Đảo Mây)
  homeDock: [2.6, 50.2], // chỗ thuyền đậu ở cầu tàu Làng Hoa
  lighthouse: [69, -3],
  sapling: [61.5, 7.6],  // chỗ trồng cành Cây Mộng
};

// Luật riêng của đất Mũi Én
export const EN_RULES = {
  fogWater: 0.5,         // sương giữ ẩm: đất khô chậm còn một nửa
  cloudPerHarvest: 2,    // mỗi bông thu hoạch ở Mũi Én cộng bấy nhiêu điểm "Mây về"
  cloudPerStar: 1,       // cộng thêm cho mỗi ⭐ vượt 1 sao
  cloudFull: 150,        // đủ bấy nhiêu điểm thì đảo xanh hẳn (màu đảo đổi dần theo tỉ lệ)
  unlockLevel: 16,       // cấp tối thiểu để ra khơi (kèm xong chương 5 cốt truyện chính)
};

// Ba lô đất bậc thang (mỗi lô 3×3 ô). Nhận dần qua cốt truyện "Cơn mưa đi lạc".
export const EN_PLOTS = {
  en1: { x: 57, z: 0, name: 'Bậc thang dưới' },
  en2: { x: 62.5, z: 2.5, name: 'Bậc thang giữa' },
  en3: { x: 67.5, z: 6.5, name: 'Bậc thang trên' },
};

export const EN_PEOPLE = ['ong_hai', 'trieu', 'ba_sao'];
// (GĐ22) người Cồn Lặng: Sổ tay ẩn tới khi bạn đã vào sương (cảnh l1_path)
export const CO_PEOPLE = ['chu_luoi', 'nhum'];

/** Lô đất này có nằm ở Mũi Én không */
export const isEnPlot = (plot) => !!(plot && plot.parcel && EN_PLOTS[plot.parcel]);
