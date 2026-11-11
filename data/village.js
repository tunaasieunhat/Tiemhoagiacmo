// =============================================================
//  LÀNG HOA (GĐ11) — vùng đất mới phía nam đảo, 6 ngôi nhà + trường làng
//  Dân làng đi lại theo GIỜ TRONG GAME (lịch ở mục schedule). Mưa / bão thì việc ngoài trời chuyển thành ở nhà.
//  Tọa độ: x (trái/phải), z (càng lớn càng về phía nam). Tâm làng ở (0, 34).
// =============================================================

export const VILLAGE = {
  center: { x: 0, z: 34 },
  radius: 14,          // bán kính vùng đất làng
  camRadius: 11.5,     // camera được kéo tới đâu trong làng
  walkSpeed: 1.7,      // tốc độ đi bộ (đơn vị 3D / giây thật)
  plazaRadius: 3.4,
};

// Nhà: door hướng về quảng trường. style quyết định hình dáng & màu.
//   owner: mã người ở (trùng mã khách quen trong data/regulars.js hoặc dân làng mới bên dưới)
export const HOUSES = {
  tu: { name: 'Nhà Bà Tư', owner: 'ba_tu', x: -7.5, z: 41.5, style: { wall: '#fff1dd', roof: '#c79cf2', trim: '#a87458', porch: true, flowers: '#f6a6b9' } },
  duy: { name: 'Nhà Anh Duy', owner: 'anh_duy', x: -9.5, z: 31, style: { wall: '#e8f4ff', roof: '#6fb7e0', trim: '#7c6a8f', books: true } },
  mai: { name: 'Nhà Cô Mai', owner: 'co_mai', x: -5, z: 24.5, style: { wall: '#fff0f3', roof: '#f47a93', trim: '#c9926a', vines: '#e85aa6' } },
  ba: { name: 'Xưởng mộc Ông Ba', owner: 'ong_ba', x: 6, z: 24.5, style: { wall: '#f0d9b8', roof: '#a8724f', trim: '#7a5238', workshop: true } },
  su: { name: 'Nhà Bé Su', owner: 'be_su', x: 9.5, z: 31.5, style: { wall: '#fff7d6', roof: '#ff9a5c', trim: '#c9926a', swing: true } },
  cafe: { name: 'Quán cà phê Mây', owner: 'co_ngan', x: 7.5, z: 41, style: { wall: '#ffffff', roof: '#9fd6f0', trim: '#c9926a', cafe: true } },
  school: { name: 'Trường làng', owner: null, x: -11.4, z: 37.6, style: { wall: '#fff3e0', roof: '#e8384f', trim: '#ffffff', school: true } },
};

// Dân làng mới (4 khách quen trong data/regulars.js cũng sống ở làng — lấy hình dáng từ đó)
export const NEW_VILLAGERS = {
  co_mai: {
    name: 'Cô Mai', self: 'cô', role: 'Cô giáo dạy văn',
    look: { skin: '#f8d4b8', hair: '#3b2a2a', outfit: '#f6a6b9', hat: null, bun: true },
    bio: 'Cô giáo dạy văn của trường làng, thích làm thơ và chăm giàn hoa giấy trước nhà. Hình như cô biết thầy Duy hay nhìn trộm mình...',
  },
  ong_ba: {
    name: 'Ông Ba', self: 'ông', role: 'Thợ mộc & câu cá',
    look: { skin: '#e0ac86', hair: '#d8d8d8', outfit: '#8fbf72', hat: '#d9b48a' },
    bio: 'Thợ mộc già khó tính mà tốt bụng. Sáng sớm đi câu cá, cả ngày đẽo gỗ. Ông là người đóng cái quầy hoa cho tiệm của bạn đấy.',
  },
};

// Vai trò hiển thị của 4 khách quen khi ở làng
export const REGULAR_ROLES = {
  ba_tu: 'Cụ bà đan len',
  anh_duy: 'Thầy giáo dạy toán',
  be_su: 'Học sinh lớp 3',
  co_ngan: 'Chủ quán cà phê Mây',
};

// Những người sẽ rời làng khi xong cốt truyện (vd Bà Tư lên thành phố) — Tết thì về chơi
export const LEAVES_AFTER_STORY = { ba_tu: { holdByStory: true, hearts: 5, back: ['tet'], note: 'Bà đã lên thành phố ở với con trai. Tết bà sẽ về thăm làng!' } };

// Việc làm: icon hiện trên đầu, outdoor = ngoài trời (trời mưa / bão thì về nhà), anim = kiểu cử động
export const ACTIVITIES = {
  sleep: { name: 'Đang ngủ', icon: '💤', indoor: true },
  home: { name: 'Đang ở nhà', icon: '🏠', indoor: true },
  teach: { name: 'Đang dạy học ở trường', icon: '📚', indoor: true },
  study: { name: 'Đang đi học', icon: '✏️', indoor: true },
  water: { name: 'Đang tưới vườn', icon: '💧', outdoor: true, anim: 'water' },
  knit: { name: 'Đang ngồi đan len', icon: '🧶', outdoor: true, anim: 'sit' },
  chat: { name: 'Đang tán gẫu bên giếng', icon: '💬', outdoor: true, anim: 'idle' },
  read: { name: 'Đang đọc sách', icon: '📖', outdoor: true, anim: 'sit' },
  coffee: { name: 'Đang uống cà phê', icon: '☕', anim: 'sit' },
  work: { name: 'Đang làm việc', icon: '🔨', anim: 'work' },
  serve: { name: 'Đang bán cà phê', icon: '☕', anim: 'idle' },
  fish: { name: 'Đang câu cá', icon: '🎣', outdoor: true, anim: 'fish' },
  play: { name: 'Đang chơi đùa', icon: '🎈', outdoor: true, anim: 'play' },
  watch: { name: 'Đang ngắm hoa', icon: '🌸', outdoor: true, anim: 'idle' },
  stroll: { name: 'Đang đi dạo ngắm biển', icon: '🌊', outdoor: true, anim: 'idle' },
};

// Chỗ đứng / ngồi. node = điểm đường gần nhất (đi theo đường đá). rot = hướng nhìn (độ, 0 = về phía nam)
export const SPOTS = {
  well: { x: 1.3, z: 34.9, rot: 200, node: 'E' },
  bench_w: { x: -2.3, z: 35.7, rot: 60, node: 'W' },
  bench_e: { x: 2.3, z: 32.3, rot: 240, node: 'NE' },
  cafe_t: { x: 5.0, z: 39.4, rot: 230, node: 'd_cafe' },
  cafe_c: { x: 6.2, z: 38.6, rot: 230, node: 'd_cafe' },
  dock: { x: 0.4, z: 50.4, rot: 0, node: 'pier' },
  garden_tu: { x: -4.9, z: 43.8, rot: 120, node: 'd_tu' },
  porch_tu: { x: -6.1, z: 39.6, rot: 45, node: 'd_tu' },
  mai_garden: { x: -7.6, z: 26.6, rot: 100, node: 'd_mai' },
  workshop: { x: 8.4, z: 26.4, rot: 250, node: 'd_ba' },
  swing_su: { x: 11.4, z: 34.6, rot: 250, node: 'd_su' },
  plaza_s: { x: -0.6, z: 37.2, rot: 180, node: 'S' },
  fence: { x: 6.6, z: 8.2, rot: 300, node: 'm0' },
  shop_win: { x: 12.4, z: -1.3, rot: 190, node: 'e1' },
  // cửa nhà (đi vào thì ẩn)
  door_tu: { node: 'd_tu', door: 'tu' }, door_duy: { node: 'd_duy', door: 'duy' }, door_mai: { node: 'd_mai', door: 'mai' },
  door_ba: { node: 'd_ba', door: 'ba' }, door_su: { node: 'd_su', door: 'su' }, door_cafe: { node: 'd_cafe', door: 'cafe' },
  door_school: { node: 'd_school', door: 'school' },
};

// Lịch sinh hoạt: [giờ bắt đầu, chỗ, việc]. Giờ có thể lẻ (6.5 = 6:30). Chỗ 'home' = nhà của người đó.
export const SCHEDULES = {
  ba_tu: [[0, 'home', 'sleep'], [6, 'garden_tu', 'water'], [8.5, 'porch_tu', 'knit'], [11, 'home', 'home'], [14, 'bench_w', 'knit'], [16.5, 'well', 'chat'], [18, 'home', 'home'], [21, 'home', 'sleep']],
  anh_duy: [[0, 'home', 'sleep'], [6, 'home', 'home'], [7, 'door_school', 'teach'], [11.5, 'cafe_t', 'coffee'], [13, 'door_school', 'teach'], [16.5, 'fence', 'watch'], [18, 'bench_e', 'read'], [20, 'home', 'home'], [22.5, 'home', 'sleep']],
  co_mai: [[0, 'home', 'sleep'], [6, 'mai_garden', 'water'], [7, 'door_school', 'teach'], [11.5, 'home', 'home'], [13, 'door_school', 'teach'], [16.5, 'well', 'chat'], [18.5, 'cafe_t', 'coffee'], [20, 'home', 'home'], [22, 'home', 'sleep']],
  be_su: [[0, 'home', 'sleep'], [7, 'door_school', 'study'], [11, 'home', 'home'], [13, 'swing_su', 'play'], [15.5, 'plaza_s', 'play'], [17, 'shop_win', 'watch'], [18.5, 'home', 'home'], [20.5, 'home', 'sleep']],
  co_ngan: [[0, 'home', 'sleep'], [6, 'cafe_c', 'serve'], [12, 'home', 'home'], [13.5, 'cafe_c', 'serve'], [17, 'dock', 'stroll'], [18.5, 'cafe_c', 'serve'], [21, 'home', 'home'], [22.5, 'home', 'sleep']],
  ong_ba: [[0, 'home', 'sleep'], [5, 'dock', 'fish'], [8, 'workshop', 'work'], [11.5, 'home', 'home'], [13, 'workshop', 'work'], [16, 'fence', 'watch'], [17.5, 'dock', 'fish'], [19, 'home', 'home'], [21, 'home', 'sleep']],
};

// Đường đi (các điểm nối nhau). stone: true = lát đá.
export const NODES = {
  m0: { x: 7.4, z: 8.9 }, m1: { x: 4.6, z: 16.5 }, entry: { x: 0.6, z: 25.8 },
  e0: { x: 12.8, z: 7.6 }, e1: { x: 13.0, z: 1.2 }, // vòng qua đất của Cô Ngân
  N: { x: 0, z: 30 }, NE: { x: 2.9, z: 31.1 }, E: { x: 4, z: 34 }, SE: { x: 2.9, z: 36.9 },
  S: { x: 0, z: 38 }, SW: { x: -2.9, z: 36.9 }, W: { x: -4, z: 34 }, NW: { x: -2.9, z: 31.1 },
  s1: { x: 0, z: 43 }, pier: { x: 0, z: 46.6 },
  d_tu: { x: -6.0, z: 39.9 }, d_duy: { x: -7.5, z: 31.6 }, d_mai: { x: -3.9, z: 26.4 }, d_ba: { x: 4.8, z: 26.3 },
  d_su: { x: 7.5, z: 32.0 }, d_cafe: { x: 5.9, z: 39.5 }, d_school: { x: -9.4, z: 37.0 },
};
export const EDGES = [
  ['m0', 'm1', true], ['m1', 'entry', true], ['entry', 'N', true], ['m0', 'e0', false], ['e0', 'e1', false],
  ['N', 'NE', true], ['NE', 'E', true], ['E', 'SE', true], ['SE', 'S', true], ['S', 'SW', true], ['SW', 'W', true], ['W', 'NW', true], ['NW', 'N', true],
  ['S', 's1', true], ['s1', 'pier', true],
  ['SW', 'd_tu', true], ['W', 'd_duy', true], ['NW', 'd_mai', true], ['entry', 'd_mai', true], ['NE', 'd_ba', true], ['entry', 'd_ba', true],
  ['E', 'd_su', true], ['SE', 'd_cafe', true], ['W', 'd_school', true], ['SW', 'd_school', false],
];

// Câu chào khi chạm vào dân làng — {self}: cách tự xưng của họ. Chọn ngẫu nhiên theo buổi / thời tiết.
export const LINES = {
  ba_tu: {
    any: ['Con đến chơi đấy à? Ngồi xuống đây bà kể chuyện cho nghe.', 'Hoa ở tiệm con năm nay đẹp hơn hẳn đấy!', 'Bà đang đan cái khăn cho đứa cháu ở thành phố.'],
    morning: ['Sáng sớm tưới rau xong là bà thấy khỏe cả ngày.'], evening: ['Chiều rồi, gió biển mát quá con ạ.'], rain: ['Mưa thế này bà chỉ muốn ngồi đan len uống trà gừng.'],
  },
  anh_duy: {
    any: ['Chào bạn! Hôm nay lớp mình học phân số đấy.', 'Bạn có biết... cô Mai thích hoa gì không? À, mình hỏi cho vui thôi!', 'Một bông hoa 5 cánh, mười bông là 50 cánh — toán học ở khắp nơi!'],
    morning: ['Sắp vào giờ dạy rồi, mình đi đây!'], evening: ['Đọc sách ở quảng trường lúc chiều là thích nhất.'], rain: ['Mưa rồi, học trò lại được nghỉ ra chơi trong lớp.'],
  },
  co_mai: {
    any: ['"Hoa nở trong vườn, thơ nở trong tim" — câu này mình mới nghĩ ra đó!', 'Giàn hoa giấy nhà mình năm nay nở rực luôn.', 'Thầy Duy dạo này hay mua hoa ghê... không biết tặng ai nhỉ?'],
    morning: ['Tưới hoa xong mình đi dạy đây, chúc bạn một ngày vui!'], evening: ['Cà phê chiều ở quán Mây là "đặc sản" của làng mình.'], rain: ['Trời mưa hợp để làm thơ ghê.'],
  },
  be_su: {
    any: ['Chị ơi, hoa của chị đẹp nhất đảo luôn!', 'Su đang để dành tiền mua hoa cho mẹ nè.', 'Hôm nay Su được cô Mai khen viết chữ đẹp đó!'],
    morning: ['Su đi học đây, chị ở nhà nhớ tưới hoa nha!'], evening: ['Su đứng ngắm tiệm hoa một xíu thôi rồi về.'], rain: ['Mưa rồi, Su không ra chơi xích đu được...'],
  },
  co_ngan: {
    any: ['Ghé quán Mây làm ly cà phê muối không? Cô mời!', 'Quán cô thích cắm hoa đồng nội, mộc mạc mà xinh.', 'Ngồi đây nghe sóng biển là quên hết mệt mỏi.'],
    morning: ['Mẻ cà phê đầu tiên trong ngày thơm nhất đấy.'], evening: ['Chiều nào cô cũng ra cầu tàu ngắm hoàng hôn một lúc.'], rain: ['Mưa thế này khách vào trú mưa đông lắm.'],
  },
  ong_ba: {
    any: ['Hừm... cái quầy hoa ông đóng cho cháu vẫn chắc chứ?', 'Gỗ tốt phải phơi đủ nắng mới bền, cũng như hoa phải đủ nước.', 'Câu cá cần kiên nhẫn. Trồng hoa cũng thế, cháu ạ.'],
    morning: ['Sáng nay cá cắn câu khá đấy.'], evening: ['Chiều chiều ông lại ra cầu tàu thả câu.'], rain: ['Mưa thì nghỉ câu, ở nhà mài đục.'],
  },
};
