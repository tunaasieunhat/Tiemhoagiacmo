// =============================================================
//  DỮ LIỆU CÁC LOÀI HOA — chỉnh số ở đây để cân bằng game
// =============================================================
//  Đơn vị thời gian: GIỜ GAME (1 giờ game = 1 phút ngoài đời)
//
//  growHours        : tổng thời gian lớn (khi được tưới đủ)
//  waterPerDay      : số lần cần tưới mỗi ngày game (càng cao càng mau khát)
//  fertilizerNeeded : số lần bón phân để đạt chất lượng tối đa
//  seasons          : mùa hợp (dùng từ Giai đoạn 5): xuan, ha, thu, dong
//  basePrice        : giá bán cơ bản 1 cành chất lượng 1★ (dùng từ GĐ3)
//  seedPrice        : giá hạt giống (dùng từ GĐ4)
//  unlockLevel      : level mở khóa (dùng từ GĐ4)
//  meaning          : ý nghĩa loài hoa (GĐ6 sẽ cho khám phá dần)
//  tones            : tông màu của hoa (ấm/mát/pastel/mộc mạc) — dùng chấm điểm bó hoa
//  colors           : màu mô hình 3D (mã màu HEX)
// =============================================================

export const FLOWERS = {
  rose: {
    id: 'rose',
    name: 'Hoa hồng',
    icon: '🌹',
    model: 'rose',
    growHours: 8,
    waterPerDay: 3,
    fertilizerNeeded: 2,
    seasons: ['xuan', 'thu'],
    basePrice: 30,
    seedPrice: 12,
    unlockLevel: 1,
    meaning: 'Tình yêu, sự trân trọng',
    tones: ['warm'],
    colors: { petal: '#f47a93', petalDark: '#d9506f', stem: '#5fae63', leaf: '#76c27a' },
  },
  tulip: {
    id: 'tulip',
    name: 'Tulip',
    icon: '🌷',
    model: 'tulip',
    growHours: 5,
    waterPerDay: 2,
    fertilizerNeeded: 1,
    seasons: ['xuan'],
    basePrice: 18,
    seedPrice: 6,
    unlockLevel: 1,
    meaning: 'Tình cảm chân thành',
    tones: ['cool', 'pastel'],
    colors: { petal: '#c79cf2', petalDark: '#a674dc', stem: '#63b06a', leaf: '#86cc84' },
  },
  sunflower: {
    id: 'sunflower',
    name: 'Hướng dương',
    icon: '🌻',
    model: 'sunflower',
    growHours: 10,
    waterPerDay: 2,
    fertilizerNeeded: 1,
    seasons: ['ha', 'thu'],
    basePrice: 35,
    seedPrice: 14,
    unlockLevel: 1,
    meaning: 'Niềm tin, hướng về tương lai',
    tones: ['warm', 'natural'],
    colors: { petal: '#ffd34e', petalDark: '#f4b42a', center: '#8a5a3b', stem: '#5aa55e', leaf: '#6dbd6f' },
  },
};

export const FLOWER_IDS = Object.keys(FLOWERS);
