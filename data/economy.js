// =============================================================
//  📈 NỀN KINH TẾ QUẦN ĐẢO SỐNG (0.31 · gói C)
//  1) Giá bán sỉ mỗi loài hoa lên xuống theo ngày (sóng giá + mùa + lễ hội + tin đồn)
//  2) Tin đồn: báo trước vài ngày một sự kiện làm giá loài hoa nào đó tăng vọt / rớt
//  3) Chuỗi cung ứng: mỗi đảo cần hàng định kỳ; giao đều đặn thì đảo phát triển (cấp 0–5) và cho bạn ưu đãi
// =============================================================

export const PRICE = {
  wave: 0.22,            // biên độ sóng giá riêng từng loài (±22%)
  periodDays: [5, 10],   // chu kỳ sóng giá (ngày game) — mỗi loài khác nhau
  noise: 0.08,           // dao động ngẫu nhiên từng ngày
  inSeason: 0.9,         // loài đang đúng mùa: nhiều người trồng ⇒ giá thấp hơn
  offSeason: 1.15,       // trái mùa: hiếm ⇒ giá cao hơn
  festival: 1.25,        // loài hoa của lễ hội hôm đó
  min: 0.5, max: 1.9,
  history: 3,            // biểu đồ: số ngày trước
  forecast: 3,           // biểu đồ: số ngày dự báo (có thể sai do tin đồn chưa biết)
};

// Tin đồn: mỗi ngày có tỉ lệ `chance` sinh 1 tin, sự kiện xảy ra sau `lead` ngày, kéo dài 1 ngày.
// kind: up (giá tăng, mult) | down (rớt giá) · tone: loài theo tông (data/shop.js TONES) · island: nơi xảy ra (chỉ để kể chuyện)
export const RUMOR_RULES = { chance: 0.4, lead: [2, 3], perTone: 3 }; // perTone: tin theo tông chỉ ảnh hưởng tối đa bấy nhiêu loài
export const RUMORS = [
  { kind: 'up', mult: 1.8, tone: 'pastel', island: 'en', text: 'Nghe nói {ngày} có đám cưới lớn ở Mũi Én — cần nhiều hoa tông pastel!' },
  { kind: 'up', mult: 1.7, tone: 'warm', island: 'lang', text: '{ngày} làng mở hội chợ mùa, người ta săn hoa tông ấm.' },
  { kind: 'up', mult: 1.7, tone: 'cool', island: 'huong', text: 'Tiệm Hương Nhài {ngày} cần gấp hoa tông mát để chưng cất.' },
  { kind: 'up', mult: 1.6, tone: 'natural', island: 'con', text: 'Lễ cầu ngư ở Cồn Lặng {ngày}: hoa mộc mạc bán chạy.' },
  { kind: 'up', mult: 1.9, species: true, island: 'fun', text: 'Khu Vui Chơi {ngày} trang trí theo chủ đề {loài} — thương lái đang lùng mua!' },
  { kind: 'down', mult: 0.6, species: true, island: 'lang', text: 'Thuyền hàng {ngày} chở về cả khoang {loài} từ đất liền — giá sẽ rớt.' },
  { kind: 'down', mult: 0.65, tone: 'warm', island: 'en', text: 'Bão {ngày} làm thuyền buôn hoa tông ấm mắc kẹt ở Mũi Én, ai cũng bán tháo.' },
];

// Chuỗi cung ứng: mỗi chu kỳ `cycleDays` ngày, mỗi đảo đưa ra `perCycle` yêu cầu lấy ngẫu nhiên từ `pool`.
// pool: { kind: 'flower', tone?, n, q } (hoa bất kỳ đúng tông, từ q★) | { kind: 'item', id, n } | { kind: 'craft', n } (hàng Tiệm Hương Nhài) | { kind: 'fish', n, t? }
// need: dấu cốt truyện để đảo hiện ra (null = luôn có) · perk: ưu đãi theo cấp (perLevel × cấp)
export const SUPPLY_RULES = {
  cycleDays: 3, perCycle: 3,
  pts: 12,               // điểm phát triển mỗi yêu cầu giao đủ
  bonusAll: 10,          // giao đủ cả 3 yêu cầu trong chu kỳ: thưởng thêm
  decay: 8,              // chu kỳ không giao gì: đảo "vắng dần", mất bấy nhiêu điểm
  levels: [0, 30, 80, 160, 280, 450],
  levelNames: ['Vắng vẻ', 'Có sinh khí', 'Nhộn nhịp', 'Sầm uất', 'Phồn thịnh', 'Trái tim quần đảo'],
  coinsPer: 1.15,        // tiền nhận khi giao = giá trị hàng × hệ số này
};
export const ISLANDS = {
  lang: {
    name: 'Làng Hoa', icon: '🏘️', need: null,
    perk: { key: 'spawn', perLevel: 0.06, text: 'Khách tới tiệm đông hơn' },
    pool: [{ kind: 'flower', tone: 'warm', n: 4, q: 1 }, { kind: 'flower', tone: 'pastel', n: 4, q: 2 }, { kind: 'item', id: 'fertilizer', n: 5 }, { kind: 'flower', n: 6, q: 1 }],
  },
  en: {
    name: 'Mũi Én', icon: '🌫️', need: 'boat_ready',
    perk: { key: 'salt', perLevel: 0.08, text: 'Hoa chịu mặn bán sỉ được giá hơn' },
    pool: [{ kind: 'flower', tone: 'cool', n: 4, q: 2 }, { kind: 'fish', n: 3 }, { kind: 'flower', tone: 'natural', n: 5, q: 1 }, { kind: 'item', id: 'fishmeal', n: 2 }],
  },
  con: {
    name: 'Cồn Lặng', icon: '🌊', need: 'co_open',
    perk: { key: 'fish', perLevel: 0.06, text: 'Bán cá được giá hơn' },
    pool: [{ kind: 'flower', tone: 'natural', n: 4, q: 1 }, { kind: 'item', id: 'fertilizer', n: 6 }, { kind: 'flower', tone: 'cool', n: 3, q: 2 }, { kind: 'craft', n: 1 }],
  },
  huong: {
    name: 'Ngàn Hương', icon: '🌼', need: 'hg_shop',
    perk: { key: 'craft', perLevel: 0.06, text: 'Khách du lịch trả cao hơn ở Tiệm Hương Nhài' },
    pool: [{ kind: 'flower', tone: 'pastel', n: 5, q: 2 }, { kind: 'flower', tone: 'cool', n: 5, q: 1 }, { kind: 'item', id: 'fishmeal', n: 2 }, { kind: 'fish', n: 2 }],
  },
  fun: {
    name: 'Khu Vui Chơi', icon: '🎡', need: 'fun_open',
    perk: { key: 'snack', perLevel: 0.08, text: 'Quầy ăn vặt bán được giá hơn' },
    pool: [{ kind: 'flower', tone: 'warm', n: 6, q: 1 }, { kind: 'craft', n: 1 }, { kind: 'flower', tone: 'pastel', n: 4, q: 2 }, { kind: 'item', id: 'fertilizer', n: 4 }],
  },
};
