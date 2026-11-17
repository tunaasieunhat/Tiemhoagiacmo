// =============================================================
//  🎣 CÂU CÁ (GĐ22) — chỉnh số ở đây
//  Mở sau cảnh "Cần câu cũ" của cốt truyện Cồn Lặng. Mỗi lần quăng tốn 1 mồi (mua bằng tiền ở quầy cá của Nhum).
//  Cá đổi được 3 thứ ở quầy cá: bán lấy tiền · đổi hạt giống · ủ phân bón.
// =============================================================

export const FISH_RULES = {
  tierNames: ['Thường', 'Ít gặp', 'Hiếm', 'Quý', 'Huyền thoại'],
  tierColors: ['#9b7b6c', '#3f9b6b', '#3b8fd0', '#c86682', '#e0a21a'],
  tierWeight: [52, 28, 13, 5.5, 1.5],   // tỉ lệ gặp từng bậc (trước khi tính mồi / cần / quăng xa)
  baitMatch: 3,            // cá hợp mồi được nhân tỉ lệ bấy nhiêu lần
  farCast: 0.35,           // quăng trúng vùng xa: cá Hiếm trở lên dễ gặp hơn 35%
  qMult: { 1: 1, 2: 1.35, 3: 1.8 },  // giá theo số sao (cá to = nhiều sao)
  shinyChance: 0.04,       // 4% ra cá ánh kim (màu hiếm)
  shinyMult: 3,            // cá ánh kim bán đắt gấp 3
  starAt: [0.5, 0.85],     // cỡ cá vượt 50% / 85% khoảng kích thước thì được 2★ / 3★
  junkChance: 0.07,        // móc phải rác
  chestChance: 0.03,       // móc được rương báu
  pearlChance: 0.25,       // tách sò ra ngọc trai
  xp: [1, 2, 4, 8, 20],    // XP theo bậc cá
  lowTide: [[5, 8], [17, 20]],  // giờ triều xuống (rặng đá lộ ra)
  moonEvery: 5,            // cứ 5 ngày game có 1 đêm rằm 🌕
  fertPer: [1, 2, 4, 7, 12],    // 1 con cá bậc đó ủ ra bấy nhiêu 🧪 phân cá
  seedCost: [3, 2, 1, 1, 1],    // số con cá bậc đó để đổi lấy hạt giống
  seedGive: [1, 1, 1, 2, 3],    // số hạt nhận được mỗi lần đổi
  bottleChance: 0.3,       // khi cốt truyện đang cần chai thư: tỉ lệ móc được mỗi lần quăng ở Cồn Lặng
  bottlePity: 4,           // quăng bấy nhiêu lần chưa có thì lần kế chắc chắn có
  // ---- mini game kéo cá ----
  reel: {
    zone: [34, 28, 23, 19, 15],     // bề rộng vùng xanh (%) theo bậc cá
    gain: [26, 21, 17, 14, 11],     // % tiến độ mỗi giây khi giữ dây trong vùng xanh
    drain: [8, 11, 14, 17, 20],     // % tụt mỗi giây khi ra ngoài
    startProgress: 30,
    tensionUp: 62, tensionDown: 48, // dây căng lên / chùng xuống mỗi giây (giữ nút / thả nút)
    snapAfter: 0.7,                 // dây căng kịch (100%) quá bấy nhiêu giây thì đứt
    timeLimit: 40,
  },
  biteWindow: 0.95,        // giây để bấm khi phao chìm
  waitMin: 1.6, waitMax: 5,
};

// Chỗ câu: at = tọa độ điểm chạm 🎣 trên bản đồ. need = dấu cốt truyện phải có. night/lowTide/fog: điều kiện mở.
export const FISH_SPOTS = {
  pond: { name: 'Ao nông trại', icon: '🪷', at: [-14.2, 7.2], water: 'ngọt', desc: 'Cá nước ngọt hiền lành, hợp để tập quăng cần.' },
  vpier: { name: 'Cầu tàu Làng Hoa', icon: '⚓', at: [-1.4, 51.2], water: 'biển', desc: 'Cá ven bờ, chiều tối có mực.' },
  endock: { name: 'Bến Mũi Én', icon: '⛵', at: [50.3, 4.2], water: 'biển', need: 'boat_ready', desc: 'Nước lạnh, cá biển khơi theo sương vào.' },
  cpier: { name: 'Cầu tàu Cồn Lặng', icon: '🌫️', at: [-41, 18.6], water: 'biển', desc: 'Cá biển theo luồng nước sâu. Đôi khi móc được vật lạ.' },
  lagoon: { name: 'Đầm nước lợ', icon: '🦀', at: [-46.2, 5.2], water: 'lợ', desc: 'Cua, tôm, lươn trú trong bùn đầm.' },
  reef: { name: 'Rặng đá', icon: '🪨', at: [-45.2, -4.6], water: 'biển', lowTide: true, desc: 'Chỉ ra được lúc triều xuống (5–8 giờ, 17–20 giờ). Cá đá quý nhất vùng.' },
  fogsea: { name: 'Biển sương', icon: '🌙', at: [-52.2, 9.5], water: 'biển', night: true, desc: 'Chỉ câu được ban đêm. Những loài cá phát sáng lẩn trong sương.' },
};

// Mồi: price 💰 mỗi cái · tier: nhân tỉ lệ cho từng bậc cá [Thường..Huyền thoại]
export const BAITS = {
  worm: { name: 'Mồi giun', icon: '🪱', price: 6, tier: [1, 1, 1, 1, 1], desc: 'Rẻ. Hợp cá nước ngọt và cá thường.' },
  shrimp: { name: 'Mồi tôm', icon: '🦐', price: 16, tier: [0.9, 1.3, 1.3, 1.1, 1], desc: 'Hợp cá biển, cá đá.' },
  crab: { name: 'Mồi cua', icon: '🦀', price: 34, tier: [0.6, 1.2, 1.7, 1.6, 1.2], desc: 'Dụ cá to, cá quý.' },
  petal: { name: 'Mồi hoa', icon: '🌸', price: 60, tier: [0.5, 1, 1.8, 2.2, 1.8], desc: 'Tẩm hương hoa của tiệm. Cá hiếm rất mê.' },
  glow: { name: 'Mồi đêm', icon: '✨', price: 120, tier: [0.4, 1, 2, 2.6, 3], desc: 'Phát sáng trong nước. Bắt buộc để câu ở Biển sương.' },
};

// Cần câu: zone cộng thêm bề rộng vùng xanh (%) · far: quăng xa dễ hơn · need: dấu cốt truyện (không mua được)
export const RODS = {
  bamboo: { name: 'Cần tre', icon: '🎋', price: 0, zone: 0, far: 0, desc: 'Cần cũ ai đó để trước cửa.' },
  wood: { name: 'Cần gỗ', icon: '🎣', price: 2500, zone: 3, far: 0.1, desc: 'Vùng xanh rộng hơn một chút.' },
  fiber: { name: 'Cần sợi bền', icon: '🎣', price: 9000, zone: 6, far: 0.2, desc: 'Dẻo và khỏe, kéo cá Hiếm nhẹ tay hẳn.' },
  khoi: { name: 'Cần của Khơi', icon: '🪵', price: 0, zone: 9, far: 0.3, need: 'rod_khoi', desc: 'Cán khắc một chữ “Khơi”. Chú Lưới trao lại cho bạn.' },
};
// Nâng cấp dây (dây đứt chậm hơn) và phao (báo cắn câu lâu hơn): giá từng bậc
export const GEAR = {
  line: { name: 'Dây câu', icon: '🧵', prices: [1200, 4000, 9000], snapBonus: 0.25, desc: 'Mỗi bậc: dây chịu căng kịch lâu hơn 0,25 giây.' },
  float: { name: 'Phao', icon: '🔴', prices: [800, 2800, 6500], windowBonus: 0.2, desc: 'Mỗi bậc: thêm 0,2 giây để bấm khi phao chìm.' },
};

// Cá: t bậc 0–4 · s chỗ câu · cm [nhỏ, to] · p giá 1★ · mv kiểu vùng vẫy (calm đều · jerk giật · dash lao · dive lặn · fury dữ)
// b mồi hợp · seed hạt đổi được · điều kiện: night / day / rain / fog / moon / lowTide / season
const F = (id, name, icon, t, s, cm, p, mv, b, seed, cond = {}) => ({ id, name, icon, t, s, cm, p, mv, b, seed, ...cond });
export const FISH = Object.fromEntries([
  // ---- ao nông trại ----
  F('ro', 'Cá rô đồng', '🐟', 0, 'pond', [8, 18], 10, 'calm', ['worm'], 'daisy:white'),
  F('chep', 'Cá chép', '🐟', 0, 'pond', [20, 45], 14, 'calm', ['worm'], 'tulip:red'),
  F('loc', 'Cá lóc', '🐟', 1, 'pond', [25, 60], 34, 'jerk', ['worm', 'shrimp'], 'sunflower:orange'),
  F('tre', 'Cá trê', '🐟', 1, 'pond', [20, 50], 38, 'dive', ['worm'], 'carnation:white', { night: true }),
  F('chepvang', 'Cá chép vàng', '🐠', 2, 'pond', [25, 55], 110, 'jerk', ['petal', 'shrimp'], 'tulip:yellow', { rain: true }),
  F('koi', 'Cá koi ba màu', '🐠', 3, 'pond', [40, 80], 320, 'dash', ['petal'], 'tulip:black', { day: true }),
  // ---- cầu tàu Làng Hoa ----
  F('bong', 'Cá bống', '🐟', 0, 'vpier', [6, 14], 11, 'calm', ['worm'], 'cosmos:white'),
  F('doi', 'Cá đối', '🐟', 0, 'vpier', [18, 35], 15, 'calm', ['worm', 'shrimp'], 'marigold:yellow'),
  F('nuc', 'Cá nục', '🐟', 1, 'vpier', [15, 30], 32, 'jerk', ['shrimp'], 'cosmos:orange'),
  F('mucla', 'Mực lá', '🦑', 1, 'vpier', [15, 40], 44, 'dive', ['shrimp'], 'lavender:white', { night: true }),
  F('mucon', 'Cá mú con', '🐠', 2, 'vpier', [25, 50], 120, 'dive', ['crab', 'shrimp'], 'rose:yellow'),
  F('hong', 'Cá hồng', '🐠', 3, 'vpier', [35, 70], 340, 'dash', ['crab', 'petal'], 'rose:blue', { day: true }),
  // ---- bến Mũi Én ----
  F('trich', 'Cá trích', '🐟', 0, 'endock', [15, 28], 13, 'calm', ['worm', 'shrimp'], 'sealavender:violet'),
  F('bon', 'Cá bơn', '🐟', 1, 'endock', [25, 50], 40, 'dive', ['shrimp'], 'saltdaisy:white'),
  F('thu', 'Cá thu', '🐟', 1, 'endock', [35, 80], 46, 'dash', ['shrimp', 'crab'], 'beachglory:pink'),
  F('tuyet', 'Cá tuyết', '🐟', 2, 'endock', [40, 90], 135, 'jerk', ['crab'], 'sealavender:silver', { fog: true }),
  F('ngu', 'Cá ngừ', '🐟', 3, 'endock', [60, 150], 380, 'dash', ['crab', 'petal'], 'saltdaisy:blue'),
  // ---- cầu tàu Cồn Lặng ----
  F('com', 'Cá cơm', '🐟', 0, 'cpier', [5, 12], 12, 'calm', ['worm'], 'daisy:pink'),
  F('bacma', 'Cá bạc má', '🐟', 0, 'cpier', [15, 30], 16, 'calm', ['worm', 'shrimp'], 'carnation:red'),
  F('chim', 'Cá chim', '🐟', 1, 'cpier', [20, 45], 42, 'jerk', ['shrimp'], 'hydrangea:purple'),
  F('mucong', 'Mực ống', '🦑', 1, 'cpier', [18, 45], 48, 'dive', ['shrimp'], 'lily:pink', { night: true }),
  F('cam', 'Cá cam', '🐠', 2, 'cpier', [40, 90], 140, 'dash', ['crab'], 'lily:orange'),
  F('kiem', 'Cá kiếm con', '🦈', 3, 'cpier', [80, 180], 420, 'fury', ['crab', 'petal'], 'peony:red'),
  // ---- đầm nước lợ ----
  F('tom', 'Tôm đất', '🦐', 0, 'lagoon', [6, 14], 12, 'calm', ['worm'], 'marigold:orange'),
  F('cuadam', 'Cua đầm', '🦀', 0, 'lagoon', [8, 16], 18, 'jerk', ['worm', 'shrimp'], 'cosmos:pink'),
  F('keo', 'Cá kèo', '🐟', 1, 'lagoon', [12, 25], 36, 'jerk', ['worm'], 'hydrangea:white'),
  F('chem', 'Cá chẽm', '🐟', 2, 'lagoon', [40, 90], 130, 'dash', ['shrimp', 'crab'], 'peony:white'),
  F('luon', 'Lươn biển', '🐍', 2, 'lagoon', [50, 110], 150, 'dive', ['crab'], 'carnation:yellow', { night: true }),
  F('cuahd', 'Cua hoàng đế', '🦀', 3, 'lagoon', [25, 55], 400, 'fury', ['crab', 'petal'], 'peony:coral'),
  // ---- rặng đá ----
  F('so', 'Sò đá', '🐚', 0, 'reef', [5, 12], 20, 'calm', ['worm', 'shrimp'], 'hydrangea:pink'),
  F('boda', 'Cá bò da', '🐟', 1, 'reef', [20, 45], 50, 'jerk', ['shrimp'], 'lily:white'),
  F('mo', 'Cá mó xanh', '🐠', 2, 'reef', [30, 60], 160, 'jerk', ['crab'], 'hydrangea:mint'),
  F('tomhum', 'Tôm hùm', '🦞', 3, 'reef', [25, 60], 450, 'dive', ['crab', 'petal'], 'carnation:purple'),
  F('matquy', 'Cá mặt quỷ', '🐡', 3, 'reef', [20, 40], 480, 'fury', ['crab'], 'marigold:red'),
  F('cangua', 'Cá ngựa san hô', '🐠', 4, 'reef', [10, 25], 1500, 'jerk', ['petal', 'glow'], 'lily:yellow'),
  // ---- biển sương ----
  F('sua', 'Sứa trăng', '🪼', 1, 'fogsea', [15, 40], 70, 'calm', ['glow'], 'lavender:pink'),
  F('denlong', 'Cá đèn lồng', '🐡', 2, 'fogsea', [15, 35], 190, 'dive', ['glow'], 'daisy:blue'),
  F('bacsuong', 'Cá bạc sương', '🐟', 2, 'fogsea', [30, 70], 210, 'dash', ['glow'], 'sunflower:red'),
  F('anhtrang', 'Cá ánh trăng', '🐠', 3, 'fogsea', [40, 90], 560, 'fury', ['glow'], 'cosmos:chocolate', { moon: true }),
  F('rong', 'Cá rồng biển', '🐉', 4, 'fogsea', [90, 200], 2200, 'fury', ['glow'], 'sealavender:dusk'),
].map((f) => [f.id, f]));

// Cá Mộng: chỉ có trong cốt truyện (chương 6). Không bán, không vào sổ thường.
export const MONG = { id: 'mong', name: 'Cá Mộng', icon: '🐋', t: 4, s: 'fogsea', cm: [300, 300], mv: 'fury' };

// Rác và rương báu
export const JUNK = [
  { name: 'Chiếc ủng cũ', icon: '🥾', coins: 2 }, { name: 'Chai rỗng', icon: '🍾', coins: 3 },
  { name: 'Mảnh lưới rách', icon: '🕸️', coins: 4 }, { name: 'Khúc gỗ mục', icon: '🪵', coins: 2 },
];
export const CHEST = { coins: [300, 900], luckChance: 0.5, baitChance: 0.5 }; // rương: tiền + có thể kèm 🎟️ hoặc 3 mồi hoa
export const PEARL = { name: 'Ngọc trai', icon: '⚪', coins: 600 };

// Thưởng khi sưu tầm đủ cá của 1 chỗ câu (Sổ cá)
export const SPOT_REWARD = { coins: 1500, luck: 2 };
