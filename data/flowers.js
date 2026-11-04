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
//  greenhouseOnly   : true = chỉ trồng được trong lô có nhà kính (GĐ14)
//  tall             : cây cao, dễ bị gió lớn làm gãy (GĐ14)
//  luck             : Cây Vận May (GĐ15) — chỉ có hạt từ 🍀 Vận May, không bán ở Chợ, không lai tạo được
//  fx               : hiệu ứng động của cây (sparkle lấp lánh, fireflies đom đóm, hue đổi màu, flame lửa ma, snow tuyết)
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
    tall: true,
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
  daisy: {
    id: 'daisy',
    name: 'Cúc họa mi',
    icon: '🌼',
    model: 'daisy',
    growHours: 4,
    waterPerDay: 2,
    fertilizerNeeded: 1,
    seasons: ['thu', 'dong'],
    basePrice: 16,
    seedPrice: 6,
    unlockLevel: 2,
    meaning: 'Sự trong sáng, tình yêu thầm lặng',
    tones: ['pastel', 'natural'],
    colors: { petal: '#ffffff', petalDark: '#f1ece2', center: '#ffd34e', stem: '#62ad66', leaf: '#7cc47e' },
  },
  lavender: {
    id: 'lavender',
    name: 'Oải hương',
    icon: '💜',
    model: 'lavender',
    growHours: 7,
    waterPerDay: 1,            // chịu hạn tốt
    fertilizerNeeded: 1,
    seasons: ['ha'],
    basePrice: 32,
    seedPrice: 13,
    unlockLevel: 4,
    meaning: 'Sự chờ đợi, lòng thủy chung',
    tones: ['cool', 'pastel'],
    colors: { petal: '#b49be8', petalDark: '#8f74d1', stem: '#7fae8a', leaf: '#9cc7a4' },
  },
  hydrangea: {
    id: 'hydrangea',
    name: 'Cẩm tú cầu',
    icon: '💠',
    model: 'hydrangea',
    growHours: 12,
    waterPerDay: 4,            // rất khát nước
    fertilizerNeeded: 2,
    seasons: ['xuan', 'ha'],
    basePrice: 55,
    seedPrice: 22,
    unlockLevel: 6,
    meaning: 'Lòng biết ơn, sự chân thành',
    tones: ['cool', 'pastel'],
    colors: { petal: '#9cc7f2', petalDark: '#b9a3ef', stem: '#5fa565', leaf: '#6fbb72' },
  },
  // ---------------- GĐ14: 6 loài mới ----------------
  cosmos: {
    id: 'cosmos', name: 'Sao nhái', icon: '🌸', model: 'cosmos',
    growHours: 3,              // lớn rất nhanh, rẻ — hợp để bán sỉ / bó hoa đồng nội
    waterPerDay: 2, fertilizerNeeded: 1,
    seasons: ['ha', 'thu'], basePrice: 12, seedPrice: 4, unlockLevel: 2,
    meaning: 'Sự hồn nhiên, niềm vui giản dị', tones: ['warm', 'natural'],
    colors: { petal: '#f78fb3', petalDark: '#e5679a', center: '#ffd34e', stem: '#6fb66f', leaf: '#8fd18b' },
  },
  carnation: {
    id: 'carnation', name: 'Cẩm chướng', icon: '💮', model: 'carnation',
    growHours: 6, waterPerDay: 2, fertilizerNeeded: 1,
    seasons: ['xuan', 'dong'], basePrice: 26, seedPrice: 10, unlockLevel: 3,
    meaning: 'Tình mẹ, lòng biết ơn', tones: ['warm', 'pastel'],
    colors: { petal: '#f7a1b8', petalDark: '#e47995', stem: '#6aa98a', leaf: '#8cbfa6' },
  },
  marigold: {
    id: 'marigold', name: 'Cúc vạn thọ', icon: '🏵️', model: 'marigold',
    growHours: 6, waterPerDay: 2, fertilizerNeeded: 1,
    seasons: ['thu', 'dong'], basePrice: 22, seedPrice: 8, unlockLevel: 3,
    meaning: 'Sống lâu, bình an', tones: ['warm', 'natural'],
    colors: { petal: '#ff9f2e', petalDark: '#f27f12', stem: '#5f9e57', leaf: '#77b86a' },
  },
  lily: {
    id: 'lily', name: 'Hoa ly', icon: '🪷', model: 'lily', tall: true,
    growHours: 11, waterPerDay: 2, fertilizerNeeded: 2,
    seasons: ['ha', 'thu'], basePrice: 60, seedPrice: 24, unlockLevel: 6,
    meaning: 'Sự cao quý, thuần khiết', tones: ['cool', 'pastel'],
    colors: { petal: '#ffffff', petalDark: '#f3e7f0', center: '#f2b33d', stem: '#5ea765', leaf: '#74bd76' },
  },
  peony: {
    id: 'peony', name: 'Mẫu đơn', icon: '🌺', model: 'peony',
    growHours: 14, waterPerDay: 3, fertilizerNeeded: 2,
    seasons: ['xuan'], basePrice: 75, seedPrice: 30, unlockLevel: 7,
    meaning: 'Phú quý, hạnh phúc viên mãn', tones: ['warm', 'pastel'],
    colors: { petal: '#f9a8c9', petalDark: '#ec7fab', stem: '#5c9f62', leaf: '#71b672' },
  },
  orchid: {
    id: 'orchid', name: 'Lan hồ điệp', icon: '🪻', model: 'orchid', greenhouseOnly: true,
    growHours: 18, waterPerDay: 1, fertilizerNeeded: 2,
    seasons: ['xuan', 'ha', 'thu', 'dong'], basePrice: 130, seedPrice: 50, unlockLevel: 8,
    meaning: 'Sang trọng, tình yêu đẹp', tones: ['cool', 'pastel'],
    colors: { petal: '#c98be0', petalDark: '#a865c7', center: '#ffd34e', stem: '#4f8f5a', leaf: '#5fa86a' },
  },

  // ---------------- 🍀 CÂY VẬN MAY (GĐ15) ----------------
  crystal: {
    id: 'crystal', name: 'Hoa Pha Lê', icon: '💎', model: 'crystal', luck: true, fx: 'sparkle',
    growHours: 10, waterPerDay: 2, fertilizerNeeded: 2,
    seasons: ['xuan', 'ha', 'thu', 'dong'], basePrice: 150, seedPrice: 0, unlockLevel: 1,
    meaning: 'Tình cảm trong sáng, bền lâu', tones: ['cool', 'pastel'],
    colors: { petal: '#cdf3ff', petalDark: '#8fd8f2', center: '#ffffff', stem: '#6fb6a8', leaf: '#8fd1c4' },
  },
  firefly: {
    id: 'firefly', name: 'Hoa Đom Đóm', icon: '✨', model: 'firefly', luck: true, fx: 'fireflies',
    growHours: 12, waterPerDay: 2, fertilizerNeeded: 2,
    seasons: ['xuan', 'ha', 'thu', 'dong'], basePrice: 170, seedPrice: 0, unlockLevel: 1,
    meaning: 'Ánh sáng dẫn đường, hy vọng', tones: ['warm', 'natural'],
    colors: { petal: '#fff29a', petalDark: '#e8d04f', center: '#fffbe0', stem: '#4f8f5a', leaf: '#6aa86a' },
  },
  prism: {
    id: 'prism', name: 'Hoa Cầu Vồng', icon: '🌈', model: 'prism', luck: true, fx: 'hue',
    growHours: 14, waterPerDay: 3, fertilizerNeeded: 2,
    seasons: ['xuan', 'ha', 'thu', 'dong'], basePrice: 210, seedPrice: 0, unlockLevel: 1,
    meaning: 'Niềm vui rực rỡ, ước mơ thành thật', tones: ['warm', 'cool'],
    colors: { petal: '#ff9fb8', petalDark: '#8fb8ff', center: '#ffe066', stem: '#5c9f62', leaf: '#71b672' },
  },
  wisp: {
    id: 'wisp', name: 'Hoa Lửa Ma', icon: '🔥', model: 'wisp', luck: true, fx: 'flame',
    growHours: 9, waterPerDay: 2, fertilizerNeeded: 2,
    seasons: ['xuan', 'ha', 'thu', 'dong'], basePrice: 160, seedPrice: 0, unlockLevel: 1,
    meaning: 'Bí ẩn, nỗi nhớ người xa', tones: ['cool'],
    colors: { petal: '#8fa8ff', petalDark: '#6b5bd6', center: '#e6f0ff', stem: '#4a5f7a', leaf: '#5d7a8f' },
  },
  snowbell: {
    id: 'snowbell', name: 'Hoa Tuyết', icon: '❄️', model: 'snowbell', luck: true, fx: 'snow',
    growHours: 12, waterPerDay: 2, fertilizerNeeded: 2,
    seasons: ['xuan', 'ha', 'thu', 'dong'], basePrice: 180, seedPrice: 0, unlockLevel: 1,
    meaning: 'Thuần khiết, khởi đầu mới', tones: ['cool', 'pastel'],
    colors: { petal: '#ffffff', petalDark: '#dcecff', center: '#bfe0ff', stem: '#6a9fb0', leaf: '#8cc0cc' },
  },
};

export const FLOWER_IDS = Object.keys(FLOWERS);
/** Các loài bán ở Chợ / khách hỏi mua (không gồm Cây Vận May) */
export const NORMAL_FLOWER_IDS = FLOWER_IDS.filter((id) => !FLOWERS[id].luck);
export const LUCK_FLOWER_IDS = FLOWER_IDS.filter((id) => FLOWERS[id].luck);
