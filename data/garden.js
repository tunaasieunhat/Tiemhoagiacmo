// =============================================================
//  🌿 NGHỀ TRỒNG HOA THẬT SỰ
//  1) Dòng giống có GEN · 2) Đất có ĐỘ CHUA (pH) · 3) Cây lâu năm (xem `perennial` trong data/flowers.js) · 4) Côn trùng có ích
// =============================================================

// ---------- 1) DÒNG GIỐNG ----------
// Mỗi dòng giống có 4 gen, mức 1–5. Hạt dòng giống trồng như hạt thường (chọn ở thanh hạt, có viền vàng).
export const GENES = {
  size: { name: 'Bông to', icon: '🌸', desc: 'Dễ đạt nhiều sao hơn', perLevel: 0.05 },        // cộng vào điểm chất lượng mỗi mức trên 1
  bloom: { name: 'Sai hoa', icon: '💐', desc: 'Có cơ hội thu 2 bông một lần', perLevel: 0.12 }, // tỉ lệ thêm 1 bông mỗi mức trên 1
  hardy: { name: 'Khỏe', icon: '💪', desc: 'Chịu khát & bệnh tốt hơn', perLevel: 0.12 },      // giảm % mất máu mỗi mức trên 1
  speed: { name: 'Lớn nhanh', icon: '⏩', desc: 'Lớn nhanh hơn', perLevel: 0.06 },            // tăng tốc lớn mỗi mức trên 1
};

export const STRAIN_RULES = {
  unlockLevel: 7,          // cấp mở Vườn ươm
  keepChance: 0.15,        // hái hoa 3★ (không phải dòng giống): tỉ lệ "giữ giống" thành dòng mới
  keepGoldenBonus: 0.15,   // hái trong giờ vàng: cộng thêm tỉ lệ giữ giống
  returnSeed: 0.6,         // hái cây dòng giống: tỉ lệ được lại 1 hạt dòng đó (giữ dòng)
  newGenes: [1, 3],        // dòng mới: gen ngẫu nhiên trong khoảng này
  maxStrains: 40,          // tối đa số dòng lưu trong sổ
  breedCost: 300,          // 💰 mỗi lần lai 2 dòng (tốn thêm 1 hạt mỗi dòng)
  breedHours: 6,           // giờ game để ra hạt lai
  mutation: 0.22,          // tỉ lệ 1 gen đột biến +1 khi lai
  breedSeeds: 2,           // số hạt dòng mới nhận được
};

// ---------- 2) ĐỘ CHUA CỦA ĐẤT (pH) ----------
// Mỗi lô có pH riêng (chua < 6,5 < kiềm). pH tự nhiên của lô cố định; bón vôi / than bùn làm lệch, rồi trôi dần về tự nhiên.
export const SOIL_PH = {
  native: [5.4, 7.6],      // pH tự nhiên của các lô nằm trong khoảng này (mỗi lô khác nhau)
  enNative: 8.0,           // đất Mũi Én mặn, hơi kiềm
  min: 4.5, max: 8.8,
  driftPerDay: 0.12,       // mỗi ngày game pH trôi về giá trị tự nhiên bấy nhiêu
  fitBonus: 0.05,          // đúng khẩu vị: cộng điểm chất lượng
  offPerUnit: 0.1,         // lệch 1 đơn vị pH: trừ điểm chất lượng
  offGrowPerUnit: 0.22,    // lệch 1 đơn vị pH: giảm tốc lớn (tối thiểu 55%)
  minGrow: 0.55,
};
// Vật tư chỉnh đất (mua ở Chợ › Vật tư, rải cho cả lô ở 🌿 Vườn ươm › Đất)
export const AMENDMENTS = {
  lime: { name: 'Vôi bột', icon: '🥛', price: 40, ph: +0.6, desc: 'Làm đất bớt chua (tăng pH). Hợp oải hương, cẩm chướng, mẫu đơn.' },
  peat: { name: 'Than bùn', icon: '🟫', price: 40, ph: -0.6, desc: 'Làm đất chua hơn (giảm pH). Hợp tú cầu, ly, lan, hồng.' },
  fishmeal: { name: 'Phân cá', icon: '🐟', price: 0, soil: 25, desc: 'Ủ từ cá ở quầy cá Cồn Lặng: trả lại độ màu cho cả lô (+25).' },
};
// Khẩu vị pH của từng loài [thấp, cao]. Thiếu loài nào thì loài đó dễ tính (không bị ảnh hưởng).
export const FLOWER_PH = {
  rose: [5.8, 6.8], tulip: [6.0, 7.0], sunflower: [6.0, 7.5], daisy: [6.0, 7.5], lavender: [6.6, 8.0],
  hydrangea: [5.0, 6.2], cosmos: [6.0, 7.5], carnation: [6.6, 7.8], marigold: [6.0, 7.5], lily: [5.5, 6.5],
  peony: [6.5, 7.6], orchid: [5.4, 6.4], sealavender: [7.2, 8.8], saltdaisy: [7.2, 8.8], beachglory: [7.0, 8.8],
  climbrose: [5.8, 6.8], bougain: [5.6, 7.0], mai: [6.0, 7.2], dao: [6.0, 7.0],
};

// ---------- 4) CÔN TRÙNG & SINH THÁI ----------
// Nhà ong / nhà chim mua ở Chợ › Tự động (như vòi tưới), mỗi lô 1 cái.
export const INSECTS = {
  hive: { qualityBonus: 0.05, seedChance: 0.12 },   // nhà ong: thụ phấn ⇒ +điểm chất lượng, có cơ hội rơi thêm 1 hạt cùng màu
  birdhouse: { bugMult: 0.4 },                       // nhà chim: sâu ít xuất hiện ở lô này (×0,4)
  diversity: { species: 3, bugMult: 0.6, qualityBonus: 0.03 }, // lô đang trồng ≥ 3 loài khác nhau: ít sâu, hoa đẹp hơn chút
};
