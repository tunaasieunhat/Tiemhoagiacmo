// =============================================================
//  🌸 ĐẢO NGÀN HƯƠNG & TIỆM HƯƠNG NHÀI (GĐ23)
//  Hòn đảo lớn phía TÂY BẮC Đảo Mây, nối bằng một cây cầu gỗ dài (lúc đầu bị mục, sửa trong chương 1).
//  Đảo gồm nhiều "mũi đất" (hình tròn chồng nhau), mỗi mũi là một vùng có mini game hái nguyên liệu riêng.
//  Nguyên liệu + hoa trồng ở nông trại ⇒ làm thành trà, mứt, nến, nước hoa... ở Tiệm Hương Nhài để bán.
//  Bạn chỉnh số liệu thoải mái ở file này (giá, số nguyên liệu, số lượt hái mỗi ngày...).
// =============================================================

// ---- Bản đồ (tọa độ x, z; z càng âm càng về phía bắc). Đảo chính tâm (0,0) bán kính 25 ----
export const HG = {
  center: [-58, -50],
  // các mũi đất: r = bán kính. name = tên vùng hiện trên bản đồ
  lobes: [
    { id: 'ben', x: -37, z: -31, r: 10, name: 'Bến Hương', sub: 'Tiệm Hương Nhài', grass: '#c9e6a3' },
    { id: 'neck', x: -47, z: -40, r: 9, grass: '#c3e39d' },
    { id: 'meadow', x: -58, z: -50, r: 18, name: 'Đồng Hoa Sương', sub: 'Hái hoa nhài lúc sớm mai', grass: '#c8e8a6' },
    { id: 'orchard', x: -60, z: -27, r: 11, name: 'Vườn Quế & Cam', sub: 'Rung cây, bóc vỏ quế', grass: '#bfe09a' },
    { id: 'forest', x: -81, z: -42, r: 13, name: 'Rừng Ong', sub: 'Mật ong & sáp ong', grass: '#a9d48e' },
    { id: 'pond', x: -79, z: -66, r: 12, name: 'Đầm Sen', sub: 'Chèo thuyền hái sen', grass: '#bfe3a6' },
    { id: 'tea', x: -56, z: -76, r: 13, name: 'Đồi Trà', sub: 'Hái búp trà bậc thang', grass: '#b4dc93' },
    { id: 'banyan', x: -36, z: -62, r: 11, name: 'Suối & Cây Đa Cổ', sub: 'Đoán hương dưới gốc đa', grass: '#bfe0a0' },
  ],
  // cây cầu gỗ: từ mép đảo chính (tây bắc) sang Bến Hương
  bridge: { from: [-17.2, -16.6], to: [-29.6, -26.4] },
  shop: [-38.4, -32.6],       // Tiệm Hương Nhài (cửa hướng về phía cầu)
  workshop: [-41.6, -35.6],   // Xưởng Hương sau tiệm
  fair: [-47, -40],           // quảng trường chợ phiên
  banyan: [-34.5, -65.5],     // Cây Đa Cổ
  pond: [-80, -67],           // mặt đầm sen
  hill: [-56, -77],           // đỉnh Đồi Trà
};

// ---- Nguyên liệu ----
//  buy: giá mua ở tiệm (chỉ món có buy mới mua được) · story: chỉ có trong cốt truyện
export const INGREDIENTS = {
  tea: { name: 'Búp trà', icon: '🍃' },
  jasmine: { name: 'Hoa nhài', icon: '🤍' },
  dew: { name: 'Sương hoa', icon: '💧' },
  honey: { name: 'Mật ong', icon: '🍯' },
  wax: { name: 'Sáp ong', icon: '🟨' },
  lotus: { name: 'Hoa sen', icon: '🪷' },
  orange: { name: 'Cam', icon: '🍊' },
  cinnamon: { name: 'Vỏ quế', icon: '🪵' },
  sugar: { name: 'Đường phèn', icon: '🧊', buy: 12 },
  // 3 nguyên liệu cuối của chai hương (chương 16)
  moonjasmine: { name: 'Nhài nở đêm trăng', icon: '🌕', story: true },
  rainwater: { name: 'Nước mưa đầu mùa', icon: '🌧️', story: true },
  oldwax: { name: 'Sáp tổ đa cổ', icon: '🌳', story: true },
};

// ---- Chỗ hái (chạm biểu tượng trên đảo) ----
//  game: mini game · give: { nguyên liệu: [số nhận khi 1⭐, 2⭐, 3⭐] } · hours: [từ giờ, tới giờ] chỉ hái được trong khung giờ đó
//  perDay: mỗi ngày game được hái bấy nhiêu lần (hết thì đợi hôm sau) · need: dấu cốt truyện cần có
export const GATHER = {
  tea: { name: 'Đồi Trà', icon: '🍃', game: 'picktea', at: [-54.5, -71.5], give: { tea: [2, 4, 6] }, perDay: 3, need: 'h3_tra' },
  dew: { name: 'Đồng Hoa Sương', icon: '🤍', game: 'dew', at: [-60, -47], give: { jasmine: [2, 3, 5], dew: [1, 2, 3] }, perDay: 3, hours: [4, 11], need: 'h3_tra' },
  hive: { name: 'Tổ ong', icon: '🐝', game: 'smoke', at: [-79, -38.5], give: { honey: [1, 2, 3] }, perDay: 3, need: 'h6_mat' },
  spin: { name: 'Lán quay mật', icon: '🟨', game: 'spin', at: [-75.5, -46], give: { wax: [1, 2, 3], honey: [0, 0, 1] }, perDay: 3, need: 'h6_mat' },
  lotus: { name: 'Đầm Sen', icon: '🪷', game: 'row', at: [-72, -61.5], give: { lotus: [1, 2, 4] }, perDay: 3, need: 'h8_tra' },
  orchard: { name: 'Vườn Cam', icon: '🍊', game: 'catch', at: [-63, -24], give: { orange: [2, 3, 5] }, perDay: 3, need: 'h4_book' },
  cinnamon: { name: 'Hàng Quế', icon: '🪵', game: 'peel', at: [-55, -21.5], give: { cinnamon: [1, 2, 3] }, perDay: 3, need: 'h4_book' },
  banyan: { name: 'Cây Đa Cổ', icon: '👃', game: 'guess', at: [-37.5, -61], give: { any: [1, 2, 3] }, perDay: 2, need: 'h9_fair' },
  // chỉ mở trong chương 16 (bạn leo thay ông Quế)
  oldwax: { name: 'Tổ ong trên Cây Đa', icon: '🌳', game: 'spin', at: [-33.2, -66.8], give: { oldwax: [1, 1, 1] }, perDay: 9, need: 'hg_tree', hard: true, story: true },
};

// ---- Sản phẩm (12 công thức = 12 trang Sổ Hương) ----
//  flowers: { loài hoa: số bông } — hoa nào cũng được, ÍT SAO VẪN DÙNG ĐƯỢC (tiệm tự lấy hoa ít sao nhất trước)
//  ing: nguyên liệu · game: mini game chế biến (số ⭐ quyết định chất lượng & số lượng) · price: giá bán gốc 1 món
//  unlock: cảnh truyện mở công thức · page: trang Sổ Hương (0–11) · sell: false = không bán
export const PRODUCTS = {
  tea_jasmine: { name: 'Trà nhài', icon: '🍵', ing: { tea: 3, jasmine: 2 }, game: 'roast', price: 95, unlock: 'h3_tra', page: 0 },
  syrup_orange: { name: 'Siro cam quế', icon: '🧃', ing: { orange: 3, cinnamon: 1, sugar: 1 }, game: 'jam', price: 150, unlock: 'h4_book', page: 1 },
  soap_marigold: { name: 'Xà phòng vạn thọ', icon: '🧼', flowers: { marigold: 3 }, ing: { dew: 2 }, game: 'mold', price: 175, unlock: 'h4_book', page: 2 },
  jam_rose: { name: 'Mứt hoa hồng', icon: '🌹', flowers: { rose: 3 }, ing: { sugar: 2 }, game: 'jam', price: 145, unlock: 'h5_book', page: 3 },
  candle_lav: { name: 'Nến oải hương', icon: '🕯️', flowers: { lavender: 3 }, ing: { wax: 2 }, game: 'mold', price: 185, unlock: 'h6_mat', page: 4 },
  honey_daisy: { name: 'Mật ong hoa cúc', icon: '🍯', flowers: { daisy: 2 }, ing: { honey: 2 }, game: 'jam', price: 165, unlock: 'h6_que2', page: 5 },
  perfume_wedding: { name: 'Hương cưới', icon: '💍', flowers: { peony: 3 }, ing: { jasmine: 2, dew: 1, honey: 1 }, game: 'blend', price: 480, unlock: 'h7_que', page: 6 },
  tea_lotus: { name: 'Trà ướp sen', icon: '🪷', ing: { tea: 3, lotus: 2 }, game: 'roast', price: 225, unlock: 'h8_tra', page: 7 },
  perfume_jasmine: { name: 'Nước hoa nhài', icon: '🧴', ing: { jasmine: 4, dew: 2 }, game: 'distill', price: 265, unlock: 'h9_fair', page: 8 },
  sachet_lily: { name: 'Túi thơm hoa ly', icon: '👛', flowers: { lily: 2 }, ing: { cinnamon: 2 }, game: 'mortar', price: 205, unlock: 'h10_notes', page: 9 },
  tea_daisy: { name: 'Trà cúc mật ong', icon: '🫖', flowers: { daisy: 2 }, ing: { tea: 2, honey: 1 }, game: 'roast', price: 190, unlock: 'h12_que', page: 10 },
  perfume_last: { name: 'Hương để nhớ', icon: '🫙', ing: { moonjasmine: 1, rainwater: 1, oldwax: 1, orange: 1, cinnamon: 1, jasmine: 2 }, game: 'blend', price: 0, unlock: 'h16_flower', page: 11, sell: false, once: true },
};

// ---- Bán hàng ở Tiệm Hương Nhài ----
export const CRAFT_RULES = {
  open: [7, 20],            // giờ tiệm mở cửa (khách du lịch ghé mua)
  sellEvery: 35,            // cứ bấy nhiêu phút game có 1 khách du lịch mua 1 món (khi tiệm mở và kệ còn hàng)
  offlineRate: 0.5,         // lúc bạn vắng mặt khách ghé thưa hơn (× tỉ lệ này)
  quick: 0.6,               // "Bán ngay cho Sen": nhận bấy nhiêu phần giá
  qMult: [0.75, 1, 1.25, 1.6], // giá × theo chất lượng (0–3 ⭐ của mẻ)
  yield: [1, 1, 2, 3],      // số món làm ra theo số ⭐ của mini game chế biến
  xpMake: 12,               // XP mỗi mẻ
  xpGather: 4,              // XP mỗi lần hái
};

// ---- Mini game (cấu hình; độ khó tăng theo số lần đã chơi: dễ → vừa ở lần 6, khó ở lần 16) ----
export const HG_GAMES = {
  picktea: { seconds: 20, need: [6, 10, 14], help: 'Chỉ hái “1 tôm 2 lá” 🌱 (búp non). Chạm nhầm lá già 🍂 là bị trừ!' },
  dew: { seconds: 18, need: [7, 11, 15], life: 1.7, help: 'Chạm thật nhanh vào hoa nhài 🤍 còn đọng sương trước khi nắng lên làm khô. Tránh ong 🐝!' },
  smoke: { seconds: 22, need: 9, zone: 30, help: 'Giữ để thổi khói, thả để khói tan. Giữ khói trong vùng xanh cho ong ngủ yên rồi lấy mật.' },
  spin: { beats: 10, speed: 1.15, window: 0.22, need: [5, 7, 9], help: 'Chạm khi kim quay tới vạch đỏ trên cùng để quay đều tay.' },
  row: { seconds: 24, need: [5, 8, 11], speed: 120, help: 'Chạm nửa trái / nửa phải màn hình để lái thuyền. Hái 🪷 sen, tránh 🪨 đá và cọc tre.' },
  catch: { seconds: 20, need: [8, 12, 16], speed: 110, help: 'Kéo ngón tay để di chuyển rổ, hứng 🍊 cam rơi. Đừng hứng quả hỏng 🟤!' },
  peel: { rounds: 3, dots: 7, seconds: 24, help: 'Chạm lần lượt các điểm 1 → 7 dọc thanh quế để bóc vỏ thật nhanh.' },
  guess: { count: 5, seconds: 10, help: 'Đọc mô tả mùi hương rồi đoán xem đó là hương gì.' },
  roast: { seconds: 20, need: [6, 9, 12], ripe: 1.3, help: 'Lá trà chuyển vàng ✨ thì chạm để đảo. Để lâu quá lá cháy đen là hỏng!' },
  jam: { seconds: 18, zone: [35, 75], need: 10, help: 'Vuốt vòng tròn quanh nồi để khuấy. Khuấy chậm quá mứt cháy, nhanh quá mứt trào!' },
  distill: { seconds: 22, need: [6, 9, 12], zone: [45, 75], help: 'Chạm để thêm củi. Giữ lửa trong vùng xanh để tinh dầu nhỏ giọt. Lửa to quá bình sẽ nứt!' },
  mold: { molds: 4, rate: 34, help: 'Giữ để rót sáp vào khuôn, thả ra đúng vạch. Mỗi khuôn một vạch khác nhau.' },
  mortar: { beats: 12, speed: 150, window: 26, need: [6, 9, 11], help: 'Chạm khi nốt rơi xuống tới vạch để giã đều tay.' },
  blend: { drops: 6, tol: [8, 14, 22], help: 'Chọn nguyên liệu để nhỏ vào chai. Mỗi giọt cộng vào Hương đầu / giữa / cuối. Làm cho 3 thanh khớp vạch mục tiêu rồi bấm Xong.' },
};
// Độ khó theo mức Dễ / Vừa / Khó (gán thẳng giá trị)
export const HG_LEVELS = {
  picktea: { need: [[6, 10, 14], [7, 11, 15], [8, 12, 16]] },
  dew: { life: [1.7, 1.45, 1.25] },
  smoke: { zone: [30, 25, 20] },
  spin: { speed: [1.15, 1.35, 1.6], window: [0.22, 0.18, 0.15] },
  row: { speed: [120, 150, 180] },
  catch: { speed: [110, 135, 165] },
  peel: { seconds: [24, 20, 16] },
  guess: { seconds: [10, 8, 6.5] },
  roast: { ripe: [1.3, 1.05, 0.85] },
  jam: { zone: [[35, 75], [40, 70], [45, 66]] },
  distill: { zone: [[45, 75], [50, 72], [54, 70]] },
  mold: { rate: [34, 42, 50] },
  mortar: { speed: [150, 180, 215], window: [26, 22, 18] },
  blend: { tol: [[8, 14, 22], [6, 11, 18], [5, 9, 15]] },
};
export const HG_GAME_NAMES = {
  picktea: ['Hái búp trà', '🍃'], dew: ['Hái hoa sương sớm', '🤍'], smoke: ['Hun khói lấy mật', '🐝'], spin: ['Quay mật', '🟨'],
  row: ['Chèo thuyền hái sen', '🛶'], catch: ['Rung cây hứng cam', '🍊'], peel: ['Bóc vỏ quế', '🪵'], guess: ['Đoán hương', '👃'],
  roast: ['Sao trà', '🔥'], jam: ['Nấu mứt', '🥄'], distill: ['Chưng cất', '⚗️'], mold: ['Đổ khuôn', '🕯️'], mortar: ['Giã cối', '🪨'], blend: ['Pha hương 3 tầng', '🧪'],
};

// "Pha hương 3 tầng": mỗi giọt cộng [đầu, giữa, cuối]
export const BLEND_DROPS = {
  orange: [16, 2, 0], jasmine: [8, 14, 2], cinnamon: [0, 6, 14], wax: [0, 2, 18], dew: [6, 10, 0], honey: [2, 6, 10], lotus: [4, 12, 6],
};

// "Đoán hương": mô tả → đáp án đúng (3 lựa chọn lấy ngẫu nhiên từ danh sách)
export const SCENTS = [
  ['Ngọt, hơi chua, có mùi nắng trên vỏ.', 'Cam'], ['Thơm cay, ấm, như bếp ngày Tết.', 'Quế'], ['Ngọt dịu, hơi phấn, giống áo mới.', 'Hoa hồng'],
  ['Mát, hơi đắng, như sáng sớm trên đồi.', 'Búp trà'], ['Thơm thanh, nghe như có nước.', 'Hoa sen'], ['Ngọt lịm, hơi khói, dính tay.', 'Mật ong'],
  ['Thơm đằm, dễ ngủ, tím như hoàng hôn.', 'Oải hương'], ['Thơm gắt lúc tối, dịu lúc sáng, trắng muốt.', 'Hoa nhài'], ['Ấm, hơi béo, như cây nến vừa thổi tắt.', 'Sáp ong'],
  ['Hăng nồng, rực rỡ, như ngày hội.', 'Vạn thọ'], ['Thoang thoảng, rất nhẹ, như sương.', 'Sương hoa'], ['Sang trọng, kiêu kỳ, hơi lạnh.', 'Hoa ly'],
];
