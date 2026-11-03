// =============================================================
//  MÙA, THỜI TIẾT, THIÊN TAI, DỊCH BỆNH, LỄ HỘI — chỉnh số ở đây
//  1 ngày game = 24 phút thật
// =============================================================

export const CALENDAR = {
  daysPerSeason: 7, // số ngày game mỗi mùa (1 năm = 4 mùa)
};

// Thứ tự mùa trong năm. grass/leaf: màu cỏ & lá cây trên đảo theo mùa
export const SEASONS = [
  { id: 'xuan', name: 'Mùa Xuân', icon: '🌸', grass: '#b5e39a', leaf: '#8fd18b', leaf2: '#a6dd94', farm: '#a5d98a' },
  { id: 'ha', name: 'Mùa Hạ', icon: '☀️', grass: '#a8de86', leaf: '#76c46f', leaf2: '#93d47f', farm: '#9cd57e' },
  { id: 'thu', name: 'Mùa Thu', icon: '🍁', grass: '#d8d98e', leaf: '#f0b96a', leaf2: '#e9a25a', farm: '#c9cf86' },
  { id: 'dong', name: 'Mùa Đông', icon: '❄️', grass: '#dfeee6', leaf: '#b9d8c4', leaf2: '#cfe6d8', farm: '#cfe3d4' },
];

// Ảnh hưởng của mùa lên hoa (xem trường "seasons" của từng loài trong data/flowers.js)
export const SEASON_EFFECT = {
  inSeasonSpeed: 1.15,          // đúng mùa: lớn nhanh hơn 15%
  outSeasonSpeed: 0.7,          // trái mùa: lớn chậm còn 70%
  outSeasonQualityPenalty: 0.12,// trái mùa: khó đạt chất lượng cao (trừ điểm chất lượng)
  coldHardy: ['daisy', 'lavender', 'marigold', 'carnation'], // các loài chịu lạnh, không sợ sương giá
};

// Thời tiết. chance: xác suất mỗi mùa [xuân, hạ, thu, đông] (tỉ trọng, không cần cộng đủ 1)
//   disaster : là thiên tai (cần bạt che / nhà kính)
//   waters   : tự tưới cho lô không có nhà kính
//   waterMult: đất khô nhanh/chậm hơn (lô không được che)
//   hour     : giờ thiên tai quét qua; damage: trừ sức khỏe; destroyChance: tỉ lệ cây bị phá hỏng luôn
//   spawnMult: khách đến thưa hơn (>1) / đông hơn (<1)
export const WEATHER = {
  sunny: { name: 'Nắng đẹp', icon: '☀️', chance: [0.55, 0.45, 0.5, 0.4] },
  rain: { name: 'Mưa rào', icon: '🌧️', chance: [0.3, 0.25, 0.3, 0.1], waters: true, desc: 'Mưa tự tưới cho các lô không có nhà kính' },
  snow: { name: 'Tuyết rơi', icon: '🌨️', chance: [0, 0, 0, 0.25], desc: 'Tuyết đẹp, không hại gì' },
  heat: { name: 'Nắng nóng', icon: '🥵', chance: [0.05, 0.2, 0, 0], disaster: true, desc: 'Đất khô nhanh gấp đôi', waterMult: 2.2 },
  storm: { name: 'Bão', icon: '🌀', chance: [0.05, 0.1, 0.15, 0], disaster: true, desc: 'Lúc 14:00 bão quét qua, làm dập hoa', hour: 14, damage: 45, destroyChance: 0.25 },
  frost: { name: 'Sương giá', icon: '🥶', chance: [0.05, 0, 0.05, 0.25], disaster: true, desc: 'Lúc 4:00 sương giá làm hại hoa không chịu lạnh', hour: 4, damage: 40 },
  // --- GĐ14 ---
  hail: { name: 'Mưa đá', icon: '🧊', chance: [0.04, 0.06, 0.03, 0], disaster: true, waters: true, desc: 'Lúc 15:00 mưa đá rơi làm dập hoa (vẫn tưới như mưa)', hour: 15, damage: 35, destroyChance: 0.12 },
  wind: { name: 'Gió lớn', icon: '🌬️', chance: [0.06, 0.05, 0.1, 0.06], disaster: true, desc: 'Đất khô nhanh hơn. Lúc 11:00 gió quật gãy cây thân cao (hướng dương, hoa ly). Bạt che đỡ được nhưng bị thổi bay mất', hour: 11, damage: 30, destroyChance: 0.15, waterMult: 1.3, tallOnly: true, blowsCover: true },
  fog: { name: 'Sương mù', icon: '🌫️', chance: [0.06, 0, 0.06, 0.1], desc: 'Đất lâu khô, nhưng khách ít ra đường và nấm mốc dễ lây', waterMult: 0.6, spawnMult: 1.4, fungusBoost: true },
  rainbow: { name: 'Cầu vồng', icon: '🌈', chance: [0.04, 0.05, 0.03, 0], good: true, desc: 'Ngày may mắn: mỗi lần thu hoạch có 35% cơ hội được thêm 1⭐', bonusStarChance: 0.35 },
  meteor: { name: 'Mưa sao băng', icon: '🌠', chance: [0.02, 0.03, 0.02, 0.03], good: true, desc: 'Lúc 22:00 sao băng rơi xuống vườn, tặng 1 hạt màu hiếm', giftHour: 22 },
};
// Thời tiết xấu: dân làng ở trong nhà, đèn sân khấu tối hơn...
export const BAD_WEATHER = ['rain', 'storm', 'hail', 'wind'];

// Dịch bệnh. chance: xác suất xuất hiện mỗi ngày theo mùa; spread: tỉ lệ ô bị lây
//   hour       : giờ bùng phát (mặc định DISEASE.outbreakHour)
//   onlyWeather: chỉ xuất hiện khi trời có thời tiết này
//   coverSafe  : lô có bạt che / nhà kính không bị
//   growMult   : cây bệnh lớn chậm lại (0 = ngừng lớn hẳn)
//   healthLoss : sức khỏe mất mỗi giờ (mặc định DISEASE.healthLossPerHour)
//   qPenalty   : hoa thu hoạch khi đang bệnh bị trừ số sao
//   lowFertBoost: ô chưa bón phân lần nào dễ bị gấp bao nhiêu lần
//   fertCures  : bón phân là khỏi (không cần thuốc)
export const DISEASES = {
  aphid: { name: 'Rệp hại', icon: '🐛', chance: [0.12, 0.12, 0.05, 0], spread: 0.35, desc: 'Rệp bám lá, cây ngừng lớn và yếu dần' },
  fungus: { name: 'Nấm mốc', icon: '🍄', chance: [0.05, 0.05, 0.12, 0.05], spread: 0.3, desc: 'Nấm mốc lan khi trời ẩm, cây ngừng lớn và yếu dần' },
  // --- GĐ14 ---
  borer: { name: 'Sâu đục nụ', icon: '🪲', chance: [0.04, 0.06, 0.04, 0], spread: 0.3, growMult: 1, healthLoss: 4, qPenalty: 1, desc: 'Sâu đục vào nụ: cây vẫn lớn nhưng hoa thu hoạch bị mất 1⭐' },
  yellowleaf: { name: 'Vàng lá', icon: '🍂', chance: [0.03, 0.03, 0.05, 0.06], spread: 0.25, growMult: 0.5, healthLoss: 6, lowFertBoost: 2, fertCures: true, desc: 'Thiếu chất nên lá vàng, cây lớn chậm. Bón 🧪 phân hoặc phun 💊 thuốc là khỏi. Ô chưa bón phân dễ bị gấp đôi' },
  snail: { name: 'Ốc sên', icon: '🐌', chance: [0.35, 0.3, 0.35, 0], spread: 0.4, hour: 19, onlyWeather: ['rain'], coverSafe: true, healthLoss: 10, desc: 'Tối ngày mưa ốc sên bò ra gặm lá. Lô có ⛺ bạt che hoặc nhà kính không bị' },
};
export const DISEASE = {
  outbreakHour: 10,        // giờ dịch bệnh bùng phát
  healthLossPerHour: 12,   // cây bệnh mất sức khỏe mỗi giờ
  greenhouseFactor: 0.5,   // nhà kính giảm một nửa khả năng bị lây
  rainBoostFungus: 1.6,    // trời mưa / sương mù thì nấm lây mạnh hơn
};

// Đồ phòng hộ
export const PROTECTION = {
  cover: { name: 'Bạt che', icon: '⛺', price: 25, level: 2, desc: 'Che 1 lô đất đến hết ngày mai: chống bão, mưa đá, sương giá, nắng nóng, ốc sên (gió lớn: bạt đỡ được 1 lần rồi bay mất)' },
  medicine: { name: 'Thuốc trừ bệnh', icon: '💊', price: 10, level: 2, desc: 'Chữa ô bị bệnh, hoặc phun phòng để không bị lây đến hết ngày mai' },
  greenhouse: { name: 'Nhà kính', icon: '🏠', price: 900, level: 5, desc: 'Xây cho 1 lô: chống mọi thiên tai, trồng trái mùa không bị chậm, giảm nửa nguy cơ bệnh. Lô có nhà kính không được mưa tưới.' },
  offlineDamageFactor: 0.5, // thiên tai xảy ra lúc bạn không chơi chỉ gây hại một nửa
};

// Lễ hội: season + days (ngày trong mùa). Khách đến nhanh hơn (spawnMult < 1), trả giá cao hơn (priceMult),
// hay đặt bó hoa (bouquetBoost) với loài hoa & tông riêng của dịp lễ.
export const FESTIVALS = [
  { id: 'tet', name: 'Tết Nguyên Đán', icon: '🧧', season: 'xuan', days: [1, 2], flowers: ['sunflower', 'daisy', 'marigold'], tone: 'warm', meaning: 'hope', occasion: 'chưng ngày Tết', spawnMult: 0.5, priceMult: 1.4, bouquetBoost: 0.25 },
  { id: 'valentine', name: 'Lễ Tình nhân 14/2', icon: '💘', season: 'xuan', days: [4], flowers: ['rose', 'tulip'], tone: 'warm', meaning: 'love', occasion: 'tặng người yêu dịp Valentine', spawnMult: 0.45, priceMult: 1.5, bouquetBoost: 0.3 },
  { id: 'women83', name: 'Quốc tế Phụ nữ 8/3', icon: '👩', season: 'xuan', days: [6], flowers: ['rose', 'tulip', 'daisy', 'carnation'], tone: 'pastel', meaning: 'gratitude', occasion: 'tặng mẹ và chị em ngày 8/3', spawnMult: 0.5, priceMult: 1.4, bouquetBoost: 0.3 },
  { id: 'wedding', name: 'Mùa cưới', icon: '💍', season: 'thu', days: [1, 2, 3, 4, 5, 6, 7], flowers: ['hydrangea', 'rose', 'daisy', 'peony', 'lily'], tone: 'pastel', meaning: 'loyalty', occasion: 'làm hoa cưới', spawnMult: 0.8, priceMult: 1.2, bouquetBoost: 0.2 },
  { id: 'women2010', name: 'Phụ nữ Việt Nam 20/10', icon: '🌹', season: 'thu', days: [5], flowers: ['rose', 'lavender', 'carnation'], tone: 'warm', meaning: 'gratitude', occasion: 'tặng mẹ ngày 20/10', spawnMult: 0.5, priceMult: 1.4, bouquetBoost: 0.3 },
  { id: 'pumpkin', name: 'Lễ hội Bí Ngô', icon: '🎃', season: 'thu', days: [7], flowers: ['sunflower', 'lavender', 'marigold'], tone: 'warm', meaning: 'joy', occasion: 'trang trí đêm Bí Ngô (Halloween)', spawnMult: 0.55, priceMult: 1.35, bouquetBoost: 0.25 },
  { id: 'teacher', name: 'Nhà giáo Việt Nam 20/11', icon: '📚', season: 'dong', days: [3], flowers: ['daisy', 'lavender', 'tulip', 'carnation'], tone: 'pastel', meaning: 'respect', occasion: 'tặng thầy cô ngày 20/11', spawnMult: 0.5, priceMult: 1.35, bouquetBoost: 0.3 },
];
