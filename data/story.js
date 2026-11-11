// =============================================================
//  📜 CỐT TRUYỆN CHÍNH "GIẤC MƠ CỦA TIỆM HOA" (GĐ20A: chương 1–2 · GĐ20B: chương 3–7, Nụ Mộng, 3 kết thúc)
//  File này viết như KỊCH BẢN — bạn sửa câu chữ thoải mái, không cần đụng code.
//
//  Mỗi CẢNH (SCENES) là một danh sách dòng, chạy từ trên xuống:
//    ['nar', 'chữ']                      lời dẫn truyện (không có người nói)
//    ['ong_ba', 'chữ']                   một người nói. Mã người: xem CAST bên dưới ('you' = người chơi)
//    ['ong_ba', 'sad', 'chữ']            nói kèm nét mặt: normal · happy · sad · surprised · think · cry · angry · shy
//    ['mo', 'happy', 'chữ', { as: '???' }]   hiện tên khác (khi chưa biết tên)
//    ['choice', [ { t: 'câu chọn', go: 'nhãn', set: 'dấu', fp: { ong_ba: 15 }, remember: 'ong_ba' }, ... ]]
//         go: nhảy tới ['label', 'nhãn'] · set: ghi dấu để sau này rẽ nhánh · fp: cộng/trừ điểm tình thân
//         remember: hiện dòng "… sẽ nhớ điều này."
//    ['label', 'tên'] · ['go', 'tên'] · ['if', 'dấu', 'tên'] (có dấu thì nhảy; '!dấu' = chưa có)
//    ['title', 'Chương 1', 'Tên chương']  màn đen hiện tên chương
//    ['cam', 'shop' | 'mã người' | [x, z], độ_zoom]   lia máy quay
//    ['meet', 'mã người']                 người chơi tới đứng nói chuyện với người đó (máy quay lia theo)
//    ['place', 'mã', x, z] · ['walk', 'mã', x, z] · ['hide', 'mã']   xếp chỗ diễn viên
//    ['emote', 'mã', '❗']                bong bóng cảm xúc trên đầu nhân vật 3D
//    ['fx', 'sepia' | 'dark', true/false] cảnh hồi ức màu nâu cũ · màn tối dần
//    ['cg', 'letter' | 'sign' | 'page' | 'fade' | null, { ... }]   hiện tranh minh họa (null = cất đi)
//    ['wait', giây] · ['sfx', 'chime'] · ['set', 'dấu'] · ['end']
//    ['place', 'mã', x, z, 'mã người' | [x, z]]   xếp chỗ và quay mặt về phía ai / điểm nào
//    ['bud', 'mã nụ'] nhận 1 Nụ Mộng · ['give', 'mã nụ'] trao Hoa Mộng lại cho chủ (xem BUDS)
//    Lựa chọn có thể thêm if: 'dấu' — chỉ hiện khi đã có dấu đó (vd kết ẩn cần 'all_given').
//  Trong chữ: {dấu?câu A|câu B} = có dấu thì hiện câu A, không thì câu B.
//  Trong chữ: {name} = tên người chơi.
// =============================================================

// ---- Diễn viên: tên hiện trên khung thoại, giọng "bíp" (pitch: số càng lớn giọng càng cao), hình dáng ----
export const CAST = {
  you: { name: '{name}', pitch: 660 },
  mo: { name: 'Mơ', pitch: 1380, look: { skin: '#fff3ea', hair: '#6a4a3a', outfit: '#bdeee0', hat: null, bun: true }, spirit: true, color: '#7fd8c4' },
  diep: { name: 'Bà Diệp', pitch: 520, look: { skin: '#f8d4b8', hair: '#6a4a3a', outfit: '#9fd6c8', hat: '#f6e3a8', bun: true }, color: '#5fb8a2' },
  me_su: { name: 'Mẹ bé Su', pitch: 600, look: { skin: '#fbe3d0', hair: '#4a3328', outfit: '#ffe9b8', hat: null, bun: true }, color: '#e0a86a' },
  ba_tu: { pitch: 330 }, ong_ba: { pitch: 240 }, co_mai: { pitch: 640 }, anh_duy: { pitch: 420 }, co_ngan: { pitch: 560 }, be_su: { pitch: 1040 },
};

// ---- Số liệu chung ----
export const STORY_RULES = {
  autoDelay: 4,          // vào game bao nhiêu giây thì cảnh "tự chạy" bắt đầu
  typeSpeed: 34,         // số chữ hiện mỗi giây
  autoPlayPause: 1.6,    // chế độ Tự chạy: nghỉ bao nhiêu giây + thêm theo độ dài câu
  moSpot: [9.4, -3.5],   // chỗ Mơ hay lơ lửng (trước hiên tiệm) vào ban đêm
  storyLineChance: 0.6,
  // ---- GĐ20B ----
  omenDays: 2,           // giữ nụ quá bấy nhiêu ngày mà trời chưa hợp ⇒ Mơ "gọi" đúng thời tiết cho ngày mai
  budBeauty: 40,         // mỗi Hoa Mộng giữ ở tiệm cộng bấy nhiêu điểm xinh xắn
  bridgeCost: 2000,      // tiền góp vật liệu sửa cầu lên đồi
  hill: [3, -37],        // tâm Đồi Mộng (phía bắc đảo)
  shelf: [-3.1, 2.9],    // chỗ đặt kệ Nụ Mộng, tính theo tọa độ của tiệm (mặt tiền hướng +z)  // tỉ lệ dân làng nói câu liên quan cốt truyện thay cho câu chào thường
};

// ---- Chương: need = điều kiện mở (level cấp, hearts tổng tim dân làng, orders đơn hàng lớn đã giao) ----
//  steps: các bước theo thứ tự. Mỗi bước có các "điểm kích hoạt" (triggers):
//    via: 'auto' tự chạy · 'villager' hỏi dân làng (who) · 'spot' chạm điểm sáng trên bản đồ (at: [x, y, z]) · 'mo' gặp Mơ ban đêm
//    need: cần xem bao nhiêu cảnh trong bước (mặc định: tất cả). Cảnh chưa xem của bước cũ vẫn xem được cho tới hết chương.
export const CHAPTERS = [
  {
    id: 'c1', n: 1, title: 'Tiệm không có tên chủ', need: {},
    intro: 'Một lá thư không ký tên, một chiếc chìa khóa cũ, và một tiệm hoa mà cả làng không ai nhớ nổi chủ cũ là ai.',
    steps: [
      { goal: 'Đọc lại lá thư đã đưa bạn đến đảo', triggers: [{ scene: 'c1_letter', via: 'auto' }] },
      { goal: 'Hỏi 2 người trong làng về chủ cũ của tiệm hoa (chạm vào người có 📜)', need: 2, triggers: [
        { scene: 'c1_ask_ba', via: 'villager', who: 'ong_ba', label: 'Hỏi về chủ cũ của tiệm' },
        { scene: 'c1_ask_ngan', via: 'villager', who: 'co_ngan', label: 'Hỏi về chủ cũ của tiệm' },
        { scene: 'c1_ask_duy', via: 'villager', who: 'anh_duy', label: 'Hỏi về chủ cũ của tiệm' },
        { scene: 'c1_ask_tu', via: 'villager', who: 'ba_tu', label: 'Hỏi về chủ cũ của tiệm' },
      ] },
      { goal: 'Về tiệm, chạm vào điểm sáng ✨ trên tấm biển', triggers: [{ scene: 'c1_sign', via: 'spot', at: [11.75, 4.35, -4.55], icon: '✨' }] },
      { goal: 'Đợi trời tối (sau 19:00) rồi tìm đốm sáng lạ trước hiên tiệm', triggers: [{ scene: 'c1_mo', via: 'mo' }] },
    ],
    reward: { coins: 300, xp: 40, luck: 1 },
    outro: 'Bạn đã gặp Mơ — cô bé chỉ mình bạn nhìn thấy. Từ nay, đêm nào Mơ cũng ở trước hiên tiệm.',
  },
  {
    id: 'c2', n: 2, title: 'Trang giấy phai', need: { level: 5 },
    intro: 'Dưới sàn tiệm có một chiếc hộp sắt. Trong hộp là những trang nhật ký của người mà cả đảo đã quên.',
    steps: [
      { goal: 'Ban đêm, ra hiên tiệm gặp Mơ (Mơ có chuyện gấp!)', triggers: [{ scene: 'c2_mo_start', via: 'mo' }] },
      { goal: 'Tìm 5 trang nhật ký 📄 bay lạc: giếng làng, cầu tàu, trường làng, bờ ao, đường xuống làng', triggers: [
        { scene: 'c2_page1', via: 'spot', at: [0.2, 1.1, 33.3], icon: '📄' },
        { scene: 'c2_page2', via: 'spot', at: [-0.9, 1.1, 48.3], icon: '📄' },
        { scene: 'c2_page3', via: 'spot', at: [-9.2, 1.1, 39.0], icon: '📄' },
        { scene: 'c2_page4', via: 'spot', at: [-10.4, 1.1, 6.9], icon: '📄' },
        { scene: 'c2_page5', via: 'spot', at: [5.7, 1.1, 17.3], icon: '📄' },
      ] },
      { goal: 'Mang các trang giấy tới nhờ Cô Mai đọc giúp', triggers: [{ scene: 'c2_mai', via: 'villager', who: 'co_mai', label: 'Nhờ đọc những trang giấy cũ' }] },
      { goal: 'Ban đêm, kể lại cho Mơ nghe', triggers: [{ scene: 'c2_mo_end', via: 'mo' }] },
    ],
    reward: { coins: 800, xp: 80, luck: 2 },
    outro: 'Chủ cũ của tiệm tên là Diệp. Cả làng quên, nhưng bạn thì nhớ.',
  },
  {
    id: 'c3', n: 3, title: 'Chiếc thuyền đóng dở', need: { level: 8, hearts: 10 },
    intro: 'Sau xưởng mộc của ông Ba có một con thuyền phủ bạt suốt ba mươi năm. Và một cái nụ không bao giờ nở.',
    steps: [
      { goal: 'Ban đêm, ra hiên tiệm gặp Mơ', triggers: [{ scene: 'c3_mo', via: 'mo' }] },
      { goal: 'Xuống làng, chạm điểm sáng 🛶 sau xưởng mộc của Ông Ba', triggers: [{ scene: 'c3_boat', via: 'spot', at: [9.3, 1.7, 21.9], icon: '🛶' }] },
      { goal: 'Ban đêm, cho Mơ xem cái nụ vừa mang về', triggers: [{ scene: 'c3_shelf', via: 'mo' }] },
    ],
    reward: { coins: 1200, xp: 100, luck: 2 },
    outro: 'Giấc mơ người làng bỏ lại năm xưa đã hóa thành Nụ Mộng. Mỗi nụ chỉ nở đúng khoảnh khắc của giấc mơ ấy.',
  },
  {
    id: 'c4', n: 4, title: 'Chiếc khăn tháo ra đan lại', need: { level: 12, orders: 10 },
    intro: 'Bà Tư biết nhiều hơn bà nói. Và trong hộp sắt còn một tờ giấy toàn con số.',
    steps: [
      { goal: 'Tìm Bà Tư, nói với bà cái tên “Diệp”', triggers: [{ scene: 'c4_tu', via: 'villager', who: 'ba_tu', label: 'Nói với bà cái tên “Diệp”' }] },
      { goal: 'Đưa tờ giấy toàn con số cho Thầy Duy', triggers: [{ scene: 'c4_duy', via: 'villager', who: 'anh_duy', label: 'Đưa tờ giấy toàn con số' }] },
      { goal: 'Ra mỏm bắc đảo (phía sau Khu Chợ), chạm 🔨 để góp 2.000 💰 vật liệu sửa cầu', triggers: [{ scene: 'c4_bridge', via: 'spot', at: [3, 1.5, -24.0], icon: '🔨', cost: 2000 }] },
    ],
    reward: { coins: 2000, xp: 150, luck: 2 },
    outro: 'Cây cầu đã nối lại. Trên đồi bắc có một cái cây rất già đang đợi.',
  },
  {
    id: 'c5', n: 5, title: 'Dưới gốc Cây Mộng', need: { level: 15, blooms: 1 },
    intro: 'Qua cầu là Đồi Mộng. Người mà cả đảo đã quên chưa từng rời đi.',
    steps: [
      { goal: 'Qua cầu lên Đồi Mộng, chạm điểm sáng ✨ dưới gốc cây', triggers: [{ scene: 'c5_tree', via: 'spot', at: [4.4, 1.6, -34.4], icon: '✨' }] },
      { goal: 'Tìm thêm hai Nụ Mộng: hỏi Cô Ngân và Bé Su', triggers: [
        { scene: 'c5_ngan', via: 'villager', who: 'co_ngan', label: 'Kể chuyện trên đồi' },
        { scene: 'c5_su', via: 'villager', who: 'be_su', label: 'Su có cái này cho chị' },
      ] },
      { goal: 'Ban đêm, trò chuyện với Mơ', triggers: [{ scene: 'c5_mo', via: 'mo' }] },
    ],
    reward: { coins: 3000, xp: 200, gold: 1 },
    outro: 'Mơ chính là giấc mơ của bà Diệp. Nếu bà tỉnh dậy, Mơ sẽ không còn.',
  },
  {
    id: 'c6', n: 6, title: 'Trả lại giấc mơ', need: { level: 18, shopLevel: 2 },
    intro: 'Hoa Mộng đã nở. Giữ ở tiệm cho đẹp, hay trao lại để người ta nhớ ra mình từng mơ gì?',
    steps: [
      { goal: 'Ban đêm, ra hiên tiệm gặp Mơ', triggers: [{ scene: 'c6_mo', via: 'mo' }] },
      { goal: 'Quyết định cho 3 Hoa Mộng đã nở: Trao lại hoặc Giữ ở tiệm (chạm kệ Nụ Mộng cạnh hiên)', triggers: [], count: { buds: 'decided', n: 3 } },
      { goal: 'Ban đêm, trò chuyện với Mơ', triggers: [{ scene: 'c6_end', via: 'mo' }] },
    ],
    reward: { coins: 4000, xp: 250, gold: 1 },
    outro: 'Mỗi bông hoa đã có chỗ của nó. Trên đồi, Cây Mộng vừa ra một chiếc lá xanh.',
  },
  {
    id: 'c7', n: 7, title: 'Đêm sao băng thứ hai', need: { level: 20, blooms: 3 },
    intro: 'Ba mươi năm trước, người lớn đem giấc mơ lên đồi để đổi. Đêm nay, một đứa trẻ muốn đem lên để cho.',
    steps: [
      { goal: 'Bé Su có chuyện muốn hỏi bạn', triggers: [{ scene: 'c7_su', via: 'villager', who: 'be_su', label: 'Su hỏi cái này nha' }] },
      { goal: 'Ban đêm, lên Đồi Mộng và chạm điểm sáng 🌠 dưới gốc cây', triggers: [{ scene: 'c7_final', via: 'spot', at: [4.4, 1.6, -34.4], icon: '🌠', night: true }] },
    ],
    reward: { coins: 8000, xp: 400, gold: 2 },
    outro: 'Câu chuyện đã khép lại. Bạn có thể xem lại cảnh cuối trong Sổ tay để thử một lựa chọn khác.',
  },
];

// Chưa có chương nào đang chờ ra mắt (GĐ21 sẽ kể chuyện vùng đất mới)
export const COMING_CHAPTERS = [];

// =============================================================
//  🌱 NỤ MỘNG → 🌸 HOA MỘNG (GĐ20B)
//  Mỗi nụ là giấc mơ một người làng bỏ lại. Nụ chỉ nở khi đúng điều kiện "when":
//    weather: hôm nay là 1 trong các kiểu thời tiết này (mã trong data/seasons.js)
//    night: true ⇒ phải là ban đêm · season: chỉ "gọi" được thời tiết này trong mùa đó (xuan/ha/thu/dong)
//    water: số ngày liền phải tưới (bấm 💧 trong bảng của nụ, mỗi ngày 1 lần, sót 1 ngày là tính lại)
//  Hoa nở rồi: Trao lại cho chủ (cảnh give) hoặc Giữ ở tiệm (+ điểm xinh xắn). color: màu hoa.
// =============================================================
export const BUDS = {
  ba: { owner: 'ong_ba', who: 'Ông Ba', icon: '⛵', flower: 'Hoa Buồm Trắng', color: '#dff3ff', glow: '#8fd3ff',
    dream: 'Cùng vợ đóng thuyền đi hết biển', when: { weather: ['wind', 'storm'] },
    hint: 'Mơ nghe trong nụ có tiếng gió và tiếng buồm đập. Nụ này đợi một ngày gió lớn.',
    bloom: ['Gió lớn tràn qua đảo. Trên kệ gỗ, cái nụ xám run lên bần bật.', 'Từng cánh bung ra, trắng và cong như cánh buồm no gió. Hoa Buồm Trắng đã nở.'], give: 'give_ba' },
  tu: { owner: 'ba_tu', who: 'Bà Tư', icon: '❄️', flower: 'Hoa Tuyết Đầu Mùa', color: '#ffffff', glow: '#cfe8ff',
    dream: 'Ngồi ngắm tuyết đầu mùa cùng người bạn thân', when: { weather: ['snow'], night: true, season: 'dong' },
    hint: 'Nụ này lạnh như nước giếng. Nó đợi một đêm tuyết rơi, mà tuyết thì chỉ có vào mùa Đông.',
    bloom: ['Tuyết rơi lặng lẽ trong đêm. Một bông tuyết đậu lên cái nụ xám mà không tan.', 'Nụ mở ra, trắng muốt, sáng dịu như ánh trăng trên tuyết. Hoa Tuyết Đầu Mùa đã nở.'], give: 'give_tu' },
  duy: { owner: 'anh_duy', who: 'Thầy Duy', icon: '🔭', flower: 'Hoa Sao Rơi', color: '#fff2a8', glow: '#ffd86b',
    dream: 'Trở thành nhà thiên văn', when: { weather: ['meteor'], night: true },
    hint: 'Cái nụ này cứ nghiêng lên trời. Nó đợi một đêm có mưa sao băng.',
    bloom: ['Vệt sao băng đầu tiên xé ngang trời. Cái nụ xám ngẩng hẳn lên, như đang đếm.', 'Năm cánh nhọn bung ra, vàng như ánh sao. Hoa Sao Rơi đã nở.'], give: 'give_duy' },
  ngan: { owner: 'co_ngan', who: 'Cô Ngân', icon: '🎨', flower: 'Hoa Bảy Sắc', color: '#ffb3d9', glow: '#ff9fd0',
    dream: 'Trở thành họa sĩ', when: { weather: ['rainbow'] },
    hint: 'Nụ này xám nhất trong các nụ, như bức tranh chưa tô. Nó đợi một ngày có cầu vồng.',
    bloom: ['Cầu vồng bắc ngang đảo. Ánh sáng bảy màu rơi đúng vào cái nụ xám.', 'Mỗi cánh hoa mở ra một màu khác nhau. Hoa Bảy Sắc đã nở.'], give: 'give_ngan' },
  su: { owner: 'be_su', who: 'mẹ bé Su', icon: '🌱', flower: 'Hoa Nối Mầm', color: '#c9f5a8', glow: '#a6e88f',
    dream: 'Nối nghiệp tiệm hoa của cô Diệp', when: { water: 3 },
    hint: 'Nụ này không đợi trời. Nó đợi người: tưới cho nó mỗi ngày, ba ngày liền không sót.',
    bloom: ['Ngày thứ ba. Giọt nước vừa chạm đất, cái nụ xám đã hé ra như đợi sẵn.', 'Một bông hoa xanh non, nhỏ mà chắc, vươn thẳng lên. Hoa Nối Mầm đã nở.'], give: 'give_su' },
};

// Bà Diệp nói gì khi bạn chạm vào (sau kết "Thức giấc" / "Cả làng cùng mơ" bà ngồi bên hiên tiệm ban ngày)
export const DIEP_LINES = [
  'Quầy vẫn thấp vừa tầm trẻ con. Cháu giữ khéo lắm.',
  'Ba mươi năm mà nhài vẫn thơm như cũ. Lạ thật đấy.',
  'Bà Tư bắt bà quàng khăn cả ngày, nóng ơi là nóng. Mà bà không nỡ cởi.',
  'Hoa ngoan thì phải khen. Cháu khen nó chưa?',
  'Tiệm là của cháu rồi. Bà chỉ ngồi đây uống trà, ngắm khách ra vào thôi.',
];

// ---- Nội dung tranh minh họa ----
export const CG_TEXT = {
  letter: ['Gửi người sẽ mở cánh cửa này,', '', 'Tiệm đã ngủ lâu quá rồi.', 'Hoa trên đảo đang nhạt màu dần.', '', 'Tiệm cần một người biết mơ.', '', 'Chìa khóa gửi kèm. Xin hãy đến.'],
  sign: { name: 'Tiệm Hoa Giấc Mơ', sub: 'nơi ai cũng được mơ một giấc thật đẹp', by: 'D.' },
  // ▒ = chỗ mực đã phai
  pages: [
    'Ngày 3, mùa Xuân.\nHôm nay mở tiệm! Bác Ba đóng xong cái quầy, thấp vừa tầm trẻ con với tới hoa. Con bé Ngân sang vẽ đầy lên giấy gói. Mình ▒▒▒▒▒ treo luôn mấy bức ấy lên tường cho khách xem.',
    'Ngày 19, mùa Hạ.\nĐã bốn mươi ngày không mưa. Giếng làng trơ đáy. Hoa ngoài ruộng cúi đầu hết cả. Tư bảo ▒▒▒▒▒▒ đừng lo, nhưng mình thấy Tư quay đi lau mắt lúc tưới gáo nước cuối.',
    'Trên đồi phía bắc có một cái cây rất già.\nCác cụ bảo nó nghe được giấc mơ. Ai đem giấc mơ của mình đặt dưới gốc cây thì ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
    'Hôm nay thêm ba nhà nữa lên đồi. Sáng ra trời mưa thật.\nNhưng bác thợ mộc thôi không nhắc chuyện đóng thuyền nữa. Con bé Ngân hỏi mình bút chì màu để làm gì.\n▒▒▒▒▒ mình sợ.',
    'Nếu ai đọc được những dòng này:\nmình không ▒▒▒▒▒. Mình chỉ đi ngủ một giấc dài thôi.\nXin hãy tưới hoa giùm mình. Và nói với Tư là ▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
  ],
};

// =============================================================
//  CÁC CẢNH
// =============================================================
export const SCENES = {
  // ------------------------------------------------ CHƯƠNG 1
  c1_letter: { title: 'Lá thư không ký tên', lines: [
    ['fx', 'dark', true],
    ['title', 'Chương 1', 'Tiệm không có tên chủ'],
    ['cam', 'shop', 1.25],
    ['fx', 'dark', false],
    ['nar', 'Ngày bạn đặt chân lên Đảo Mây, trong túi chỉ có hai thứ: một lá thư không ký tên, và một chiếc chìa khóa đã xỉn màu.'],
    ['cg', 'letter'],
    ['nar', 'Nét chữ run run, mực đã ngả nâu, như được viết từ rất lâu rồi mới gửi đi.'],
    ['you', 'think', '“Tiệm cần một người biết mơ”... Ai đã viết cho mình lá thư này?'],
    ['cg', null],
    ['nar', 'Chìa khóa tra vừa khít ổ. Cánh cửa mở ra, bụi bay lên trong nắng. Từ hôm ấy, bạn là chủ Tiệm Hoa Giấc Mơ.'],
    ['nar', 'Chỉ có một điều lạ: trên giấy tờ, trên biển hiệu, trong lời kể của cả làng... không ở đâu còn tên người chủ cũ.'],
    ['you', 'Phải hỏi người làng xem sao. Chắc chắn phải có ai còn nhớ chứ.'],
    ['end'],
  ] },

  c1_ask_ba: { title: 'Cái quầy gỗ ba mươi năm', lines: [
    ['meet', 'ong_ba'],
    ['you', 'Ông Ba ơi, cháu hỏi chút. Trước cháu, ai là chủ tiệm hoa vậy ông?'],
    ['ong_ba', 'Hừm? Cái tiệm đó thì ông rành. Chính tay ông đóng cái quầy gỗ cho nó cơ mà.'],
    ['ong_ba', 'think', 'Đóng cho... cho cháu chứ còn ai.'],
    ['you', 'surprised', 'Nhưng cháu mới đến đảo thôi ạ. Mà mặt quầy đã lên nước bóng, mòn cả góc rồi ông.'],
    ['emote', 'ong_ba', '❓'],
    ['ong_ba', 'surprised', '...Ừ nhỉ. Gỗ lim phải ba chục năm mới lên màu như thế.'],
    ['ong_ba', 'sad', 'Ba chục năm trước ông đóng nó. Ông nhớ từng cái mộng, từng đường bào. Nhớ có người đứng cạnh, cười, bảo: “Bác làm thấp thôi, cho trẻ con với tới hoa.”'],
    ['ong_ba', 'sad', 'Mà người đó là ai thì... ông chịu. Như nhìn qua lớp kính mờ vậy.'],
    ['choice', [
      { t: 'Ông đừng cố quá. Từ từ rồi sẽ nhớ ạ.', fp: { ong_ba: 15 }, go: 'a' },
      { t: 'Ông thử nhớ kỹ lại xem! Chuyện này quan trọng lắm.', fp: { ong_ba: -5 }, set: 'c1_pushed_ba', remember: 'ong_ba', go: 'b' },
    ]],
    ['label', 'a'],
    ['ong_ba', 'Ừ. Già rồi, cái gì cũng phải từ từ. Cháu là đứa biết điều.'],
    ['go', 'z'],
    ['label', 'b'],
    ['ong_ba', 'angry', 'Ông mà nhớ được thì đã chẳng phải đứng gãi đầu thế này! ...Thôi, để ông yên.'],
    ['label', 'z'],
    ['nar', 'Ông Ba quay lại với khúc gỗ. Nhưng tay bào cứ dừng lại giữa chừng.'],
    ['end'],
  ] },

  c1_ask_ngan: { title: 'Những khung tranh trống', lines: [
    ['meet', 'co_ngan'],
    ['you', 'Cô Ngân ơi, cô có biết chủ cũ của tiệm hoa không ạ?'],
    ['co_ngan', 'happy', 'Tiệm hoa hả? Biết chứ! Hồi nhỏ ngày nào cô chẳng chạy sang đó...'],
    ['co_ngan', 'think', '...sang đó làm gì ấy nhỉ?'],
    ['co_ngan', 'Cô nhớ mùi. Mùi đất ướt với mùi hoa nhài. Nhớ có bàn tay ai đó dúi cho cô hộp bút chì màu.'],
    ['co_ngan', 'sad', 'Còn gương mặt thì... trống trơn. Lạ thật, cô vốn nhớ mặt khách giỏi lắm cơ.'],
    ['nar', 'Bạn nhìn quanh quán. Trên tường treo rất nhiều khung tranh gỗ. Khung nào cũng trống.'],
    ['you', 'Mấy cái khung này sao cô không lồng tranh vào ạ?'],
    ['co_ngan', 'Khung tranh à? Cô treo cho đẹp thôi.'],
    ['emote', 'co_ngan', '💭'],
    ['co_ngan', 'think', '...Mà sao cô lại đi treo khung trống nhỉ.'],
    ['choice', [
      { t: 'Biết đâu ngày xưa cô từng thích vẽ?', fp: { co_ngan: 15 }, set: 'c1_ngan_draw', remember: 'co_ngan', go: 'a' },
      { t: 'Chắc tại cô bận quá nên quên thôi ạ.', fp: { co_ngan: 5 }, go: 'b' },
    ]],
    ['label', 'a'],
    ['co_ngan', 'shy', 'Vẽ ư? Cháu nói nghe buồn cười ghê. Cô chỉ biết pha cà phê thôi.'],
    ['nar', 'Cô cười. Nhưng mắt cô dừng lại trên một chiếc khung trống rất lâu.'],
    ['go', 'z'],
    ['label', 'b'],
    ['co_ngan', 'Ừ, chắc thế. Bán quán mà, đầu óc lúc nào cũng toàn hóa đơn.'],
    ['label', 'z'],
    ['end'],
  ] },

  c1_ask_duy: { title: 'Chỗ trống trong sổ làng', lines: [
    ['meet', 'anh_duy'],
    ['you', 'Thầy Duy ơi, thầy có biết ai mở tiệm hoa đầu tiên trên đảo không?'],
    ['anh_duy', 'happy', 'Câu hỏi hay đấy! Để mình tra sổ làng. Bố mình là người chép sổ, mình còn giữ một bản.'],
    ['nar', 'Thầy lật cuốn sổ bìa da đã sờn.'],
    ['anh_duy', '“Tiệm Hoa Giấc Mơ. Khai trương mùa Xuân. Chủ tiệm là...”'],
    ['emote', 'anh_duy', '❗'],
    ['anh_duy', 'surprised', '...Ơ.'],
    ['nar', 'Chỗ ghi tên chỉ còn một khoảng giấy trắng. Không phải bị tẩy. Như thể mực chưa từng chạm vào đó.'],
    ['anh_duy', 'think', 'Lạ thật. Dòng trên dòng dưới còn nguyên. Xác suất để mực phai đúng một cái tên là... gần bằng không.'],
    ['anh_duy', 'Mình là dân toán, mình không tin chuyện ma quỷ. Nhưng bài này thì mình chưa giải được.'],
    ['choice', [
      { t: 'Vậy mình cùng giải nhé, thầy?', fp: { anh_duy: 15 }, set: 'c1_duy_team', remember: 'anh_duy', go: 'a' },
      { t: 'Chắc người chép sổ sót thôi mà.', go: 'b' },
    ]],
    ['label', 'a'],
    ['anh_duy', 'happy', 'Được! Có gì mới bạn báo mình ngay nhé. Bài toán khó mới vui.'],
    ['go', 'z'],
    ['label', 'b'],
    ['anh_duy', 'Có thể... Nhưng bố mình cẩn thận lắm. Cả đời ông chưa chép sót một dòng nào.'],
    ['label', 'z'],
    ['end'],
  ] },

  c1_ask_tu: { title: 'Chiếc khăn đan mãi chưa xong', lines: [
    ['meet', 'ba_tu'],
    ['you', 'Bà Tư ơi, con muốn hỏi về người chủ cũ của tiệm hoa.'],
    ['nar', 'Đôi que đan trên tay bà khựng lại.'],
    ['emote', 'ba_tu', '💬'],
    ['ba_tu', '...Con hỏi chuyện xưa làm gì thế con.'],
    ['you', 'Cả làng không ai nhớ nổi tên người đó. Con thấy lạ lắm bà ạ.'],
    ['ba_tu', 'sad', 'Người ta quên thì cũng phải thôi. Ba mươi năm rồi còn gì.'],
    ['you', 'think', '(Ba mươi năm? Mình đã nói với bà con số ấy đâu...)'],
    ['ba_tu', 'Bà già rồi, lẩm cẩm. Con đừng để ý.'],
    ['nar', 'Bà cúi xuống đan tiếp. Chiếc khăn đang dở có hàng mũi đầu tiên sờn hơn hẳn phần còn lại, như đã bị tháo ra đan lại rất nhiều lần.'],
    ['choice', [
      { t: 'Chiếc khăn này bà đan cho ai vậy ạ?', fp: { ba_tu: 10 }, set: 'c1_tu_scarf', remember: 'ba_tu', go: 'a' },
      { t: '(Không hỏi thêm. Chào bà rồi về.)', fp: { ba_tu: 5 }, go: 'b' },
    ]],
    ['label', 'a'],
    ['ba_tu', 'sad', 'Cho một người bạn. ...Bà đan chậm lắm, mãi chưa xong.'],
    ['go', 'z'],
    ['label', 'b'],
    ['nar', 'Bạn chào bà. Đi được một quãng, ngoái lại, vẫn thấy bà ngồi im nhìn về phía tiệm hoa.'],
    ['label', 'z'],
    ['end'],
  ] },

  c1_sign: { title: 'Nét chữ dưới lớp sơn', lines: [
    ['cam', 'shop', 1.7],
    ['nar', 'Hỏi mãi không ra, bạn về tiệm, định bụng lau lại tấm biển cho đỡ buồn tay.'],
    ['nar', 'Dưới lớp sơn trắng ai đó quét đè lên năm nào, có gì đó gờ gợn.'],
    ['you', 'Hình như... có chữ ở dưới.'],
    ['cg', 'sign'],
    ['nar', 'Một nét chữ tay mềm, tròn, viết bằng sơn xanh đã bạc. Và ở góc dưới, nhỏ xíu, một chữ ký chỉ có đúng một chữ cái.'],
    ['you', 'surprised', '“D.”...'],
    ['you', 'think', 'Vậy là người ấy có thật. Có người đã tự tay viết tấm biển này, rồi cả đảo quên mất.'],
    ['cg', null],
    ['nar', 'Gió từ biển thổi vào. Trong một thoáng, bạn ngửi thấy mùi hoa nhài, dù tiệm chưa hề trồng nhài.'],
    ['end'],
  ] },

  c1_mo: { title: 'Đốm sáng trước hiên', lines: [
    ['meet', 'mo'],
    ['nar', 'Đêm ấy bạn đóng cửa tiệm muộn. Trước hiên có một đốm sáng. Không phải đom đóm.'],
    ['mo', 'happy', 'Ngủ ngoan nhé, bé hồng. Mai có nắng đó. Ngủ ngoan nhé, bé cúc...', { as: '???' }],
    ['nar', 'Một cô bé nhỏ xíu, sáng mờ như trăng sau mây, đang lơ lửng đi chúc từng chậu hoa ngủ ngon.'],
    ['you', 'surprised', '...Này em!'],
    ['emote', 'mo', '❗'],
    ['mo', 'surprised', 'Á!', { as: '???' }],
    ['mo', 'surprised', 'Cậu... cậu nhìn thấy Mơ á?!', { as: '???' }],
    ['choice', [
      { t: 'Thấy chứ. Em là ai vậy?', set: 'c1_mo_kind', go: 'a' },
      { t: 'Em... là ma hả?', set: 'c1_mo_ghost', go: 'b' },
    ]],
    ['label', 'a'],
    ['emote', 'mo', '🎵'],
    ['mo', 'happy', 'Lâu lắm rồi mới có người nhìn thấy Mơ! Lâu ơi là lâu!'],
    ['go', 'z'],
    ['label', 'b'],
    ['mo', 'angry', 'Ma gì mà ma! Mơ có dọa ai đâu. Mơ chỉ chúc hoa ngủ ngon thôi mà...'],
    ['you', 'shy', 'Xin lỗi nhé. Tại em sáng quá.'],
    ['mo', '...Hừ. Tha cho cậu đó.'],
    ['label', 'z'],
    ['you', 'Em tên là Mơ à?'],
    ['mo', 'think', 'Chắc vậy. Mơ không nhớ ai đặt. Chỉ nhớ có người hay gọi “Mơ ơi”, thế là Mơ thưa.'],
    ['you', 'Em ở đây lâu chưa?'],
    ['mo', 'Từ lúc tiệm đóng cửa. Mơ đếm được nhiều mùa Đông lắm. Mơ trông hoa giùm, đợi người ta về mở cửa.'],
    ['you', 'Đợi ai cơ?'],
    ['mo', 'sad', '...Mơ không nhớ. Mơ chỉ nhớ là phải đợi.'],
    ['nar', 'Cô bé ngước nhìn tấm biển bạn vừa lau, chỗ có chữ “D.” nhỏ xíu, rất lâu.'],
    ['mo', 'Nhưng mà cậu mở cửa rồi. Hoa lại có người tưới. Vậy là Mơ đợi đúng rồi, đúng không?'],
    ['choice', [
      { t: 'Đúng rồi. Từ nay có mình trông tiệm cùng em.', set: 'c1_promise', remember: 'mo', go: 'p' },
      { t: 'Mình không chắc mình là người em đợi đâu.', set: 'c1_doubt', remember: 'mo', go: 'd' },
    ]],
    ['label', 'p'],
    ['mo', 'happy', 'Hứa nha! Móc ngoéo!'],
    ['nar', 'Ngón tay bé xíu đi xuyên qua tay bạn, như một làn hơi ấm.'],
    ['mo', 'shy', '...Ơ. Mơ quên là Mơ không chạm được. Thôi, coi như móc rồi nha.'],
    ['go', 'e'],
    ['label', 'd'],
    ['mo', 'Không sao. Mơ cũng có chắc Mơ là ai đâu. Hai đứa mình cùng không chắc, vậy là huề.'],
    ['label', 'e'],
    ['mo', 'happy', 'Ban ngày Mơ buồn ngủ lắm. Tối cậu ra hiên là thấy Mơ. Có gì lạ Mơ kể cho!'],
    ['nar', 'Đốm sáng chao một vòng quanh mái hiên rồi đậu lên chậu hoa trước cửa. Lần đầu tiên từ khi đến đảo, tiệm hoa không còn chỉ có một mình bạn.'],
    ['end'],
  ] },

  // ------------------------------------------------ CHƯƠNG 2
  c2_mo_start: { title: 'Chiếc hộp dưới sàn', lines: [
    ['fx', 'dark', true],
    ['title', 'Chương 2', 'Trang giấy phai'],
    ['meet', 'mo'],
    ['fx', 'dark', false],
    ['emote', 'mo', '❗'],
    ['mo', 'surprised', 'Cậu ơi cậu ơi! Có chuyện rồi!'],
    ['mo', 'Hồi chiều gió to, Mơ nghe tiếng sột soạt dưới sàn tiệm. Có cái hộp sắt nằm đó từ hồi nào. Nắp bung ra rồi.'],
    ['mo', 'sad', 'Giấy bay hết trơn. Mơ đuổi theo, mà Mơ có cầm được cái gì đâu...'],
    ['you', 'Giấy gì vậy Mơ?'],
    ['mo', 'think', 'Giấy có chữ. Chữ tròn tròn, giống y trên tấm biển.'],
    ['you', 'surprised', 'Chữ của “D.”!'],
    ['mo', 'Năm tờ. Mơ đếm được năm tờ. Một tờ bay về phía giếng làng, một tờ ra cầu tàu, một tờ vướng ở trường học...'],
    ['mo', 'shy', 'Hai tờ kia Mơ quên mất rồi. Hình như gần bờ ao với con đường xuống làng.'],
    ['mo', 'happy', 'Cậu tìm giùm Mơ nha? Chỗ nào có giấy là Mơ làm cho nó sáng sáng lên, cậu nhìn là thấy liền!'],
    ['end'],
  ] },

  c2_page1: { title: 'Trang thứ nhất', lines: [
    ['cg', 'page', { i: 0 }],
    ['nar', 'Một trang giấy dó ố vàng mắc dưới thành giếng.'],
    ['you', 'think', '“Bác Ba”... “con bé Ngân”... Vậy là ông Ba và cô Ngân đều từng ở tiệm này.'],
    ['cg', null],
    ['end'],
  ] },
  c2_page2: { title: 'Trang thứ hai', lines: [
    ['cg', 'page', { i: 1 }],
    ['nar', 'Trang giấy kẹt giữa hai tấm ván cầu tàu, mép đã ướt nước biển.'],
    ['you', 'sad', 'Bốn mươi ngày không mưa... “Tư” ở đây là Bà Tư sao?'],
    ['cg', null],
    ['end'],
  ] },
  c2_page3: { title: 'Trang thứ ba', lines: [
    ['cg', 'page', { i: 2 }],
    ['nar', 'Trang này vướng trên hàng rào trường làng. Nửa dưới mực đã phai trắng.'],
    ['you', 'think', 'Một cái cây nghe được giấc mơ? Đặt giấc mơ dưới gốc cây thì... thì sao chứ?'],
    ['cg', null],
    ['end'],
  ] },
  c2_page4: { title: 'Trang thứ tư', lines: [
    ['cg', 'page', { i: 3 }],
    ['nar', 'Trang giấy nằm trên đám cỏ ven ao, đom đóm đậu kín xung quanh.'],
    ['you', 'surprised', 'Thôi đóng thuyền. Quên cả bút chì màu. Người làng lên đồi rồi... đánh mất một thứ gì đó.'],
    ['cg', null],
    ['end'],
  ] },
  c2_page5: { title: 'Trang cuối', lines: [
    ['cg', 'page', { i: 4 }],
    ['nar', 'Trang cuối cùng nằm ngay giữa đường xuống làng, như đang chờ người nhặt.'],
    ['you', 'sad', '“Mình chỉ đi ngủ một giấc dài thôi.” ...Người này không bỏ đi. Người này đang ở đâu đó.'],
    ['cg', null],
    ['end'],
  ] },

  c2_mai: { title: 'Mực phai trên tay', lines: [
    ['meet', 'co_mai'],
    ['you', 'Cô Mai, mình nhặt được mấy trang giấy cũ. Chữ mờ quá, cô đọc giúp mình được không?'],
    ['co_mai', 'happy', 'Đưa mình xem nào. Ôi, giấy dó, mực tàu... Phải ba chục năm rồi đó.'],
    ['co_mai', 'Nét chữ đẹp quá. Người viết chắc hay chép thơ.'],
    ['co_mai', '“Hôm nay mở tiệm...” “Đã bốn mươi ngày không mưa. Giếng làng trơ đáy...”'],
    // --- hồi ức ---
    ['fx', 'dark', true],
    ['place', 'diep', 11.9, -4.2],
    ['cam', 'diep', 1.8],
    ['fx', 'sepia', true],
    ['fx', 'dark', false],
    ['nar', 'Ba mươi năm trước.'],
    ['nar', 'Mùa Hạ năm ấy trời quên mưa. Giếng làng trơ đáy, hoa ngoài ruộng cúi đầu.'],
    ['diep', 'Ráng lên nào, mấy đứa. Uống đỡ gáo này đã.', { as: '???' }],
    ['nar', 'Người phụ nữ chia gáo nước cuối cùng cho từng gốc hoa, không giữ lại ngụm nào cho mình.'],
    ['diep', 'sad', 'Mình mở tiệm để ai cũng được mơ một giấc thật đẹp. Vậy mà chưa gì đã để hoa khát thế này...', { as: '???' }],
    ['fx', 'dark', true],
    ['hide', 'diep'],
    ['fx', 'sepia', false],
    ['meet', 'co_mai'],
    ['fx', 'dark', false],
    // --- hết hồi ức ---
    ['emote', 'co_mai', '❗'],
    ['co_mai', 'surprised', 'Khoan đã. Ở mép trang này có ký tên!'],
    ['co_mai', 'happy', '“Diệp”. Bà ấy tên là Diệp! Mình nhớ rồi, hồi bé xíu mình hay sang tiệm nghe bà ngâm th—'],
    ['cg', 'fade'],
    ['nar', 'Ngay trên tay cô, từng nét mực nhạt dần, như sương gặp nắng.'],
    ['emote', 'co_mai', '💭'],
    ['co_mai', 'think', '...Mình vừa nói đến đâu rồi nhỉ?'],
    ['you', 'surprised', 'Cô vừa đọc được tên mà! Bà Diệp!'],
    ['co_mai', 'Diệp nào cơ? ...Mà sao bạn lại đưa mình xem toàn giấy trắng thế này?'],
    ['cg', null],
    ['nar', 'Năm trang giấy trong tay cô đã trắng tinh.'],
    ['choice', [
      { t: 'Nhắc lại cho cô: “Bà ấy tên Diệp. Cô từng sang tiệm nghe bà ngâm thơ.”', fp: { co_mai: 20 }, set: 'c2_told_mai', remember: 'co_mai', go: 'a' },
      { t: 'Thôi, không có gì đâu cô. Cảm ơn cô nhé.', fp: { co_mai: 5 }, set: 'c2_hid_mai', go: 'b' },
    ]],
    ['label', 'a'],
    ['co_mai', 'sad', '...Mình không nhớ gì cả. Nhưng nghe bạn nói, tự dưng mình muốn khóc. Lạ ghê.'],
    ['co_mai', 'Để mình chép cái tên ấy vào sổ thơ. Chữ của mình thì chắc không phai đâu.'],
    ['go', 'z'],
    ['label', 'b'],
    ['you', 'think', '(Nói ra chỉ làm cô ấy rối thêm. Mình sẽ tự nhớ lấy.)'],
    ['label', 'z'],
    ['nar', 'Cô quên. Cả làng quên. Nhưng bạn thì vẫn nhớ nguyên vẹn: Diệp. Có lẽ vì bạn đến sau, nên cái quên ấy chưa kịp chạm tới bạn.'],
    ['end'],
  ] },

  c2_mo_end: { title: 'Tiếng lá chạm nhau', lines: [
    ['meet', 'mo'],
    ['you', 'Mơ ơi. Chủ cũ của tiệm tên là Diệp.'],
    ['emote', 'mo', '❗'],
    ['mo', 'surprised', '...'],
    ['mo', 'think', 'Diệp. Diệp. Nghe như tiếng lá chạm nhau.'],
    ['mo', 'Mơ không nhớ mặt. Nhưng nghe tên là Mơ thấy ấm ở đây nè.'],
    ['emote', 'mo', '🎵'],
    ['mo', 'happy', '♪ Hoa ơi hoa ngủ cho ngoan, mai sương xuống ướt đầu làng cùng mơ... ♪'],
    ['you', 'Bài gì vậy Mơ?'],
    ['mo', 'surprised', 'Mơ không biết! Tự nhiên Mơ thuộc.'],
    ['nar', 'Bạn kể cho Mơ nghe về mùa hạn, về cái cây già trên đồi phía bắc, về những người đã lên đồi rồi quên mất một điều gì.'],
    ['mo', 'sad', 'Cậu ơi. Lúc cô Mai quên cái tên... Mơ thấy mình mờ đi một xíu. Như này nè.'],
    ['nar', 'Cô bé giơ tay lên. Dưới ánh trăng, mấy đầu ngón tay gần như trong suốt.'],
    ['choice', [
      { t: 'Mình sẽ không quên. Mình hứa.', set: 'c2_promise', remember: 'mo', go: 'a' },
      { t: 'Vậy mình phải làm cho cả làng nhớ lại.', set: 'c2_resolve', remember: 'mo', go: 'b' },
    ]],
    ['label', 'a'],
    ['mo', 'happy', 'Vậy là đủ rồi. Có một người nhớ là Mơ không tắt đâu.'],
    ['go', 'z'],
    ['label', 'b'],
    ['mo', 'surprised', 'Cả làng luôn á? ...Cậu gan ghê. Mơ thích!'],
    ['label', 'z'],
    ['mo', 'think', 'Trong giấy có nhắc bác thợ mộc với cái thuyền, đúng không?'],
    ['mo', 'Sau xưởng ông Ba có một cái thuyền đóng dở, phủ bạt kín. Ba chục mùa Đông rồi không ai đụng tới.'],
    ['end'],
  ] },

  // ================================================================ CHƯƠNG 3
  c3_mo: { title: 'Thứ gì đó sáng sáng', lines: [
    ['fx', 'dark', true],
    ['title', 'Chương 3', 'Chiếc thuyền đóng dở'],
    ['meet', 'mo'],
    ['fx', 'dark', false],
    ['mo', 'Cậu ơi, Mơ nghĩ hoài về cái thuyền sau xưởng ông Ba.'],
    ['mo', 'think', 'Đêm qua Mơ bay qua đó. Dưới tấm bạt có cái gì sáng sáng, nhỏ xíu. Giống Mơ lắm.'],
    ['you', 'surprised', 'Giống em?'],
    ['mo', 'sad', 'Ừ. Mà nó buồn. Cậu ra coi giùm Mơ đi, ban ngày Mơ không bay xa được.'],
    ['end'],
  ] },

  c3_boat: { title: 'Hải trình trên vách bếp', lines: [
    ['place', 'ong_ba', 7.7, 22.9, [8.9, 24.0]],
    ['place', 'you', 8.9, 24.0, 'ong_ba'],
    ['cam', [8.9, 23.0], 1.9],
    ['nar', 'Sau xưởng mộc, dưới tấm bạt bạc màu, là một con thuyền gỗ đóng dở. Mới lên được nửa mạn.'],
    ['emote', 'ong_ba', '❗'],
    ['ong_ba', 'angry', 'Ai cho ra đây!'],
    ['ong_ba', '...À, cháu. Thôi. Đã thấy rồi thì thôi.'],
    ['you', 'Thuyền của ông ạ? Đẹp quá. Sao ông không đóng tiếp?'],
    ['ong_ba', 'think', 'Đóng cho ai đi? Hồi đó ông với bà ấy tính đóng xong là giong buồm đi hết biển. Bà ấy lấy phấn vẽ cả hải trình lên vách bếp.'],
    ['fx', 'dark', true],
    ['fx', 'sepia', true],
    ['cam', [9.3, 23.1], 1.6],
    ['fx', 'dark', false],
    ['nar', 'Ba mươi năm trước. Năm hạn.'],
    ['nar', 'Giếng cạn. Ruộng nứt. Người làng rỉ tai nhau về cái cây già trên đồi bắc: đem giấc mơ lên đổi, trời sẽ mưa.'],
    ['nar', 'Anh thợ mộc trẻ đứng rất lâu trước con thuyền đóng dở. Rồi anh lên đồi.'],
    ['nar', 'Sáng hôm sau trời mưa. Và anh không còn hiểu vì sao mình từng muốn ra khơi.'],
    ['fx', 'dark', true],
    ['fx', 'sepia', false],
    ['place', 'ong_ba', 7.7, 22.9, [8.9, 24.0]],
    ['place', 'you', 8.9, 24.0, 'ong_ba'],
    ['cam', [8.9, 23.0], 1.9],
    ['fx', 'dark', false],
    ['ong_ba', 'sad', 'Bà ấy không trách ông nửa lời. Chỉ lặng lẽ lau cái hải trình trên vách đi.'],
    ['ong_ba', 'sad', 'Rồi bà ấy mất, trước khi ông kịp nhớ ra mình nợ bà ấy một chuyến đi.'],
    ['nar', 'Trong lòng thuyền, giữa lớp mùn cưa cũ, có một chậu đất nhỏ. Một cái nụ khép chặt, xám như tro.'],
    ['ong_ba', 'Cái chậu đó tự mọc lên sau cơn mưa năm ấy. Tưới mấy cũng không nở. Vứt thì ông không nỡ. Chẳng hiểu vì sao.'],
    ['choice', [
      { t: 'Ông cho cháu mang nó về tiệm chăm thử nhé?', fp: { ong_ba: 15 }, go: 'a' },
      { t: 'Biết đâu nó đang đợi ông đấy.', fp: { ong_ba: 20 }, set: 'c3_wait', remember: 'ong_ba', go: 'b' },
    ]],
    ['label', 'a'],
    ['ong_ba', 'Ừ, mang đi. Ở với hoa của cháu chắc nó đỡ tủi.'],
    ['go', 'z'],
    ['label', 'b'],
    ['ong_ba', 'sad', 'Đợi ông à... Ông già rồi, cháu ạ. Cháu cứ mang về đi.'],
    ['label', 'z'],
    ['bud', 'ba'],
    ['nar', 'Bạn nhận được 🌱 Nụ Mộng của Ông Ba. Nó được đặt lên chiếc kệ gỗ cạnh hiên tiệm.'],
    ['end'],
  ] },

  c3_shelf: { title: 'Nụ biết mơ', lines: [
    ['meet', 'mo'],
    ['emote', 'mo', '❗'],
    ['mo', 'surprised', 'Nó đó! Cái sáng sáng Mơ thấy!'],
    ['nar', 'Mơ bay vòng quanh chậu đất, áp tai vào cái nụ xám.'],
    ['mo', 'think', 'Nó đang ngủ. Mà nó có mơ. Mơ nghe... tiếng gió. Tiếng buồm đập. Tiếng một cô cười.'],
    ['you', 'Đó là giấc mơ ông Ba đã đem lên đồi.'],
    ['mo', 'Vậy thì tưới nước thường nó không nở đâu. Nó chỉ nở đúng lúc trời giống giấc mơ của nó thôi.'],
    ['mo', 'happy', 'Cậu đừng lo. Mơ ngửi được trời trước một ngày. Khi nào sắp tới lúc, Mơ báo!'],
    ['nar', 'Chạm vào kệ Nụ Mộng cạnh hiên tiệm để xem từng nụ đang đợi điều gì.'],
    ['end'],
  ] },

  // ================================================================ CHƯƠNG 4
  c4_tu: { title: 'Người duy nhất còn nhớ', lines: [
    ['fx', 'dark', true],
    ['title', 'Chương 4', 'Chiếc khăn tháo ra đan lại'],
    ['meet', 'ba_tu'],
    ['fx', 'dark', false],
    ['you', 'Bà Tư, con tìm được nhật ký của bà Diệp rồi. Trong đó có nhắc tên bà.'],
    ['emote', 'ba_tu', '❗'],
    ['ba_tu', 'cry', '...Con gọi được tên bà ấy.'],
    ['ba_tu', 'sad', 'Ba mươi năm nay bà chưa nghe ai gọi cái tên đó.'],
    ['ba_tu', 'Lá thư với chiếc chìa khóa là bà gửi. Bà nhờ người trên thành phố tìm một đứa biết thương hoa. Tìm mãi mới ra con.'],
    ['fx', 'dark', true],
    ['place', 'diep', 3.0, -25.6],
    ['cam', 'diep', 1.7],
    ['fx', 'sepia', true],
    ['fx', 'dark', false],
    ['nar', 'Đêm sao băng, ba mươi năm trước.'],
    ['nar', 'Cả làng đã lên đồi. Mưa có về, nhưng thưa dần, rồi lại tạnh. Cái cây vẫn còn đói.'],
    ['diep', 'Tư à. Còn một giấc mơ đủ lớn. Giấc mơ của mình.'],
    ['diep', 'sad', 'Rồi mọi người sẽ quên mình. Cây nó lấy luôn cả phần ấy. Tư đừng buồn nhé.'],
    ['diep', 'happy', 'Tư nhớ tưới giùm mình mấy chậu nhài.'],
    ['walk', 'diep', 3.0, -30.5],
    ['nar', 'Cô bước qua cầu, không ngoái lại. Sáng ra, mưa trắng trời. Và cả đảo chỉ còn một người nhớ rằng từng có cô.'],
    ['fx', 'dark', true],
    ['hide', 'diep'],
    ['fx', 'sepia', false],
    ['meet', 'ba_tu'],
    ['fx', 'dark', false],
    ['ba_tu', 'sad', 'Bà không lên đồi. Bà sợ. Nhà bà là nhà duy nhất còn giữ nguyên giấc mơ, nên bà là người duy nhất còn nhớ.'],
    ['ba_tu', 'Mỗi năm bà đan tên Diệp vào khăn. Sang năm tháo ra đan lại, cho tay khỏi quên.'],
    ['choice', [
      { t: 'Bà không có lỗi gì cả, bà ạ.', fp: { ba_tu: 20 }, set: 'c4_forgive', remember: 'ba_tu', go: 'a' },
      { t: 'Sao bà không nói với ai?', fp: { ba_tu: 5 }, go: 'b' },
    ]],
    ['label', 'a'],
    ['ba_tu', 'cry', '...Ba mươi năm bà chờ một người nói câu đó. Cảm ơn con.'],
    ['go', 'z'],
    ['label', 'b'],
    ['ba_tu', 'Nói rồi chứ con. Người ta nhìn bà như nhìn người lẩm cẩm. Riết rồi bà thôi.'],
    ['label', 'z'],
    ['ba_tu', 'Giấc mơ của bà nhỏ lắm: được ngồi ngắm tuyết đầu mùa với Diệp. Diệp đi rồi, nó tự héo thành cái này.'],
    ['bud', 'tu'],
    ['nar', 'Bạn nhận được 🌱 Nụ Mộng của Bà Tư.'],
    ['ba_tu', 'Trong hộp sắt còn một tờ toàn con số. Diệp bảo đó là đường lên đồi. Con đưa thầy Duy xem thử.'],
    ['end'],
  ] },

  c4_duy: { title: 'Bài toán có lời giải', lines: [
    ['meet', 'anh_duy'],
    ['you', 'Thầy Duy, bài toán có manh mối mới: một tờ giấy toàn con số.'],
    ['anh_duy', 'happy', 'Đưa đây, đưa đây!'],
    ['anh_duy', 'think', '312 bước... lệch đông 7 độ... Đây là tọa độ tính từ giếng làng!'],
    ['emote', 'anh_duy', '❗'],
    ['anh_duy', 'Nó chỉ thẳng lên mỏm bắc đảo. Chỗ cây cầu gỗ gãy từ đời nào ấy.'],
    ['anh_duy', 'think', 'Mà lạ. Nhìn mấy con số này mình thấy... nhớ. Hồi nhỏ mình hay nằm trên mái trường đếm sao, định lớn lên làm nhà thiên văn.'],
    ['anh_duy', 'sad', 'Sao mình lại quên mất nhỉ. Trên bàn mình có cái chậu cây khô, mình toàn dùng để cắm bút...'],
    ['bud', 'duy'],
    ['nar', 'Bạn nhận được 🌱 Nụ Mộng của Thầy Duy.'],
    ['anh_duy', 'Muốn lên đồi thì phải sửa cầu. Ông Ba là thợ giỏi nhất đảo, mình sẽ đi gom người. Bạn lo giúp phần gỗ và dây nhé!'],
    ['end'],
  ] },

  c4_bridge: { title: 'Nhịp cầu lên đồi', lines: [
    ['place', 'ong_ba', 2.2, -23.6, [3, -26]],
    ['place', 'anh_duy', 3.9, -23.4, [3, -26]],
    ['place', 'co_ngan', 4.9, -22.4, 'ong_ba'],
    ['place', 'you', 3.2, -22.2, [3, -26]],
    ['cam', [3.2, -23.4], 1.7],
    ['nar', 'Cả làng kéo ra mỏm bắc. Người vác ván, người bện thừng.'],
    ['ong_ba', 'Đỡ đầu kia lên! Thầy giáo, cầm cái thước cho thẳng vào!'],
    ['anh_duy', 'shy', 'Lệch có hai li thôi mà ông...'],
    ['co_ngan', 'happy', 'Cà phê tới đây! Làm xong nhịp này mỗi người một ly!'],
    ['fx', 'dark', true],
    ['set', 'bridge'],
    ['fx', 'dark', false],
    ['nar', 'Đến chiều, tấm ván cuối cùng được đóng xuống. Lần đầu sau ba mươi năm, có đường lên đồi.'],
    ['ong_ba', 'think', 'Lạ thật. Ông đóng cái cầu này mà cứ như đã đóng nó một lần rồi.'],
    ['end'],
  ] },

  // ================================================================ CHƯƠNG 5
  c5_tree: { title: 'Người ngủ giữa vòng rễ', lines: [
    ['fx', 'dark', true],
    ['title', 'Chương 5', 'Dưới gốc Cây Mộng'],
    ['place', 'you', 4.6, -34.2, [3.9, -36]],
    ['place', 'mo', 3.2, -34.4],
    ['cam', [3.6, -35.4], 1.6],
    ['fx', 'dark', false],
    ['nar', 'Trên đỉnh đồi là một cái cây lớn hơn mọi cái cây bạn từng thấy. Cành trơ trụi. Lá xám như tro.'],
    ['mo', 'surprised', 'Cậu ơi... Mơ đi được tới đây nè. Lạ ghê. Như có ai kéo Mơ lên.'],
    ['nar', 'Giữa những chiếc rễ cuộn lại như vòng tay, có một người phụ nữ đang ngủ. Mũ rơm úp trên ngực. Tóc chưa bạc một sợi.'],
    ['you', 'surprised', 'Bà Diệp...! Ba mươi năm, mà bà không già đi chút nào.'],
    ['emote', 'mo', '❗'],
    ['mo', 'sad', 'Cô ấy có cái kẹp tóc giống Mơ.'],
    ['walk', 'mo', 3.7, -35.3],
    ['nar', 'Mơ bay lại gần, rất chậm. Khi bàn tay bé xíu chạm vào má người đang ngủ, cả cái cây khẽ rung.'],
    ['mo', 'cry', 'Mơ nhớ rồi. Mơ không phải là ai hết. Mơ là giấc mơ của cô ấy.'],
    ['mo', 'cry', 'Hồi cô ấy tám tuổi, cô ấy mơ có một tiệm hoa. Là Mơ đó.'],
    ['mo', 'Cái cây ăn Mơ để làm mưa. Ăn chậm lắm. Ba mươi năm rồi chưa hết.'],
    ['you', 'Vậy nếu đánh thức bà Diệp...'],
    ['mo', 'sad', 'Thì cô ấy lấy lại giấc mơ. Mà giấc mơ về chỗ cũ rồi thì đâu còn bay lung tung được nữa. Sẽ không còn Mơ.'],
    ['choice', [
      { t: 'Phải có cách khác. Mình sẽ tìm.', set: 'c5_other', remember: 'mo', go: 'a' },
      { t: 'Em có sợ không?', set: 'c5_ask', remember: 'mo', go: 'b' },
    ]],
    ['label', 'a'],
    ['mo', 'shy', 'Cậu hay nói vậy ghê. ...Mà Mơ thích nghe.'],
    ['go', 'z'],
    ['label', 'b'],
    ['mo', 'Có. Một xíu. Nhưng Mơ sợ cô ấy ngủ hoài hơn.'],
    ['label', 'z'],
    ['mo', 'think', 'Cây đói nên mới giữ cô ấy. Nếu mấy cái nụ kia nở, mấy giấc mơ cũ về nhà... biết đâu cây hết đói.'],
    ['nar', 'Còn hai người nữa từng nhắc tới tiệm hoa cũ: cô Ngân, và mẹ của bé Su.'],
    ['end'],
  ] },

  c5_ngan: { title: 'Hai mươi bốn màu', lines: [
    ['meet', 'co_ngan'],
    ['you', 'Cô Ngân, cháu lên đồi rồi. Cháu biết vì sao khung tranh của cô để trống.'],
    ['co_ngan', '{c1_ngan_draw?Cháu lại nói chuyện vẽ vời đấy à.|Khung tranh thì liên quan gì hả cháu?}'],
    ['you', 'Ngày xưa cô vẽ lên giấy gói hoa ở tiệm bà Diệp. Bà treo hết lên tường cho khách xem.'],
    ['emote', 'co_ngan', '💭'],
    ['co_ngan', 'think', '...Hộp bút chì màu. Cô nhớ cái hộp. Hai mươi bốn màu, cây màu hồng cô gọt cụt lủn.'],
    ['co_ngan', 'sad', 'Mẹ cô ốm. Giếng cạn. Người ta bảo lên đồi... Cô mới chín tuổi. Cô đổi cái thích vẽ lấy một cơn mưa cho mẹ.'],
    ['co_ngan', 'Dưới quầy pha chế có cái chậu, cô cứ tưởng của khách bỏ quên. Cháu cầm đi.'],
    ['bud', 'ngan'],
    ['nar', 'Bạn nhận được 🌱 Nụ Mộng của Cô Ngân.'],
    ['end'],
  ] },

  c5_su: { title: 'Chậu cây của mẹ', lines: [
    ['meet', 'be_su'],
    ['be_su', 'happy', 'Chị ơi! Mẹ Su bảo đưa chị cái này.'],
    ['be_su', 'Mẹ nói hồi nhỏ mẹ phụ ở tiệm hoa, có cô chủ dạy mẹ ươm hạt. Mẹ không nhớ mặt cô, chỉ nhớ cô bảo: “Con có tay trồng.”'],
    ['be_su', 'sad', 'Mẹ nằm hoài, chậu của mẹ không ai tưới. Su tưới thì mẹ bảo nó không chịu uống nước của Su.'],
    ['you', 'Chị sẽ tưới giúp. Mỗi ngày.'],
    ['be_su', 'happy', 'Chị hứa nha! Mẹ bảo cây này khó tính lắm, bỏ một bữa là nó dỗi lại từ đầu đó.'],
    ['bud', 'su'],
    ['nar', 'Bạn nhận được 🌱 Nụ Mộng của mẹ bé Su. Nụ này cần được tưới mỗi ngày, ba ngày liền không sót.'],
    ['end'],
  ] },

  c5_mo: { title: 'Cái quầy thấp', lines: [
    ['meet', 'mo'],
    ['mo', 'Cậu biết không, hồi tám tuổi cô Diệp lùn lắm. Phải kê ghế mới với tới chậu hoa.'],
    ['you', 'Em nhớ được à?'],
    ['mo', 'happy', 'Nhớ chứ, Mơ là cô ấy hồi đó mà! Cô ấy mơ một cái tiệm có quầy thấp, để con nít khỏi phải kê ghế.'],
    ['you', 'Ông Ba đã đóng đúng cái quầy đó.'],
    ['mo', 'think', 'Ừ. Mơ thành thật rồi đó. Một giấc mơ thành thật rồi thì... chắc cũng đủ rồi ha.'],
    ['choice', [
      { t: 'Chưa đủ đâu. Em còn phải xem tiệm mình lớn lên nữa.', set: 'c5_stay', remember: 'mo', go: 'a' },
      { t: 'Em muốn bà Diệp tỉnh lại, đúng không?', set: 'c5_wake', remember: 'mo', go: 'b' },
    ]],
    ['label', 'a'],
    ['mo', 'happy', 'Hì. Cậu tham ghê.'],
    ['go', 'z'],
    ['label', 'b'],
    ['mo', 'Muốn. Cô ấy ngủ lâu quá rồi, lỡ hết bao nhiêu mùa hoa.'],
    ['label', 'z'],
    ['mo', 'Mình lo mấy cái nụ trước đi. Nở được cái nào, Mơ thấy cây bớt đói cái đó.'],
    ['end'],
  ] },

  // ================================================================ CHƯƠNG 6
  c6_mo: { title: 'Giữ hay trao', lines: [
    ['fx', 'dark', true],
    ['title', 'Chương 6', 'Trả lại giấc mơ'],
    ['meet', 'mo'],
    ['fx', 'dark', false],
    ['mo', 'Cậu ơi. Hoa nở rồi thì cậu tính sao?'],
    ['mo', 'think', 'Để ở tiệm thì đẹp lắm, tiệm mình sẽ đẹp nhất đảo. Mà mang trả thì người ta nhớ lại.'],
    ['mo', 'Mơ không biết cái nào đúng. Hoa là công cậu chăm mà. Cậu chọn đi, Mơ không giận đâu.'],
    ['nar', 'Chạm vào kệ Nụ Mộng: mỗi bông đã nở có thể Trao lại cho chủ, hoặc Giữ ở tiệm. Giữ rồi vẫn trao được về sau; trao rồi thì không lấy lại.'],
    ['end'],
  ] },

  c6_end: { title: 'Một cái lá xanh', lines: [
    ['meet', 'mo'],
    ['mo', 'Cây trên đồi hôm nay ra một cái lá. Xanh thiệt xanh. Mơ đếm đi đếm lại, đúng một cái.'],
    ['if', '!gave_any', 'k'],
    ['mo', 'happy', 'Chắc tại có người vừa nhớ ra mình từng mơ gì.'],
    ['go', 'z'],
    ['label', 'k'],
    ['mo', 'think', 'Hoa ở tiệm mình sáng lắm. Tối Mơ khỏi cần đom đóm luôn. Mà... cây thì vẫn đói.'],
    ['label', 'z'],
    ['mo', 'Bé Su dạo này hay đứng ngó lên đồi. Con nít nó thấy nhiều thứ hơn người lớn á.'],
    ['end'],
  ] },

  // ================================================================ CHƯƠNG 7
  c7_su: { title: 'Cho, chứ không đổi', lines: [
    ['fx', 'dark', true],
    ['title', 'Chương 7', 'Đêm sao băng thứ hai'],
    ['meet', 'be_su'],
    ['fx', 'dark', false],
    ['be_su', 'Chị ơi, Su hỏi cái này nha. Người lớn đem giấc mơ lên đồi là để đổi mưa hả chị?'],
    ['you', 'surprised', 'Ai nói với em vậy?'],
    ['be_su', 'Có một bạn nhỏ sáng sáng trước tiệm chị nói. Bạn ấy bảo chỉ có Su với chị thấy bạn ấy thôi.'],
    ['you', 'think', '(Su nhìn thấy Mơ...)'],
    ['be_su', 'Su không đổi đâu. Su muốn cho. Su có một giấc mơ, Su cho cái cây, khỏi cần nó trả gì hết.'],
    ['be_su', 'happy', 'Tối nay có sao băng đó chị. Chị dắt Su lên đồi nha? Su rủ cả làng rồi!'],
    ['end'],
  ] },

  c7_final: { title: 'Đêm sao băng thứ hai', lines: [
    ['fx', 'dark', true],
    ['place', 'ba_tu', 2.2, -34.5, [3.9, -36]],
    ['place', 'ong_ba', 0.9, -34.0, [3.9, -36]],
    ['place', 'co_mai', -0.2, -34.8, [3.9, -36]],
    ['place', 'co_ngan', 5.6, -34.1, [3.9, -36]],
    ['place', 'anh_duy', 6.6, -34.9, [3.9, -36]],
    ['place', 'be_su', 3.2, -35.0, [3.9, -36.4]],
    ['place', 'you', 4.5, -33.8, [3.9, -36]],
    ['place', 'mo', 3.4, -33.9],
    ['cam', [3.4, -35.0], 1.35],
    ['fx', 'dark', false],
    ['nar', 'Đêm ấy cả làng cầm đèn lên đồi. Trên đầu, sao băng rơi từng vệt dài, như ba mươi năm trước.'],
    ['ba_tu', 'sad', 'Diệp ơi. Tư lên rồi nè. Trễ ba mươi năm, bà đừng giận.'],
    ['nar', 'Bé Su bước tới gốc cây, hai tay khum lại như đang bưng một thứ gì rất nhẹ.'],
    ['be_su', 'Cây ơi. Con cho cây giấc mơ của con nè. Con mơ mẹ ăn hết bát cháo. Có vậy thôi.'],
    ['nar', 'Không ai dạy bé rằng một giấc mơ thì phải lớn. Bé đặt nó xuống, và không xin lại gì.'],
    ['set', 'tree_bloom'],
    ['sfx', 'chime', 6],
    ['cam', [3.2, -36.2], 1.1],
    ['nar', 'Cái cây già run lên. Trên cành trơ trụi, một nụ hoa bật ra. Rồi mười. Rồi cả tán cây sáng rực.'],
    ['emote', 'mo', '❗'],
    ['mo', 'surprised', 'Cây no rồi! Cậu ơi, nó không đói nữa! Nó thả cô ấy ra kìa!'],
    ['cam', [3.6, -35.2], 1.8],
    ['nar', 'Giữa vòng rễ, mi mắt bà Diệp khẽ động. Bà sắp tỉnh, nếu có ai gọi.'],
    ['mo', 'Cậu... Mơ để cậu chọn nha. Mơ sao cũng được. Thiệt đó.'],
    ['choice', [
      { t: 'Gọi bà Diệp dậy.', set: 'end_wake', go: 'wake' },
      { t: 'Để bà ngủ tiếp. Mơ ở lại với mình.', set: 'end_dream', go: 'dream' },
      { t: '“Cả làng ơi, cùng gọi nào! Ai nhớ mình từng mơ gì thì gọi!”', if: 'all_given', set: 'end_all', go: 'all' },
    ]],
    // ---------- kết 1: Thức giấc ----------
    ['label', 'wake'],
    ['you', 'Bà Diệp ơi. Tiệm mở cửa lại rồi. Dậy thôi bà.'],
    ['place', 'diep', 3.9, -35.6, 'ba_tu'],
    ['nar', 'Bà Diệp mở mắt.'],
    ['diep', 'surprised', '...Tư? Sao tóc bà bạc hết rồi?'],
    ['ba_tu', 'cry', 'Tại bà ngủ nướng đó. Ba mươi năm.'],
    ['nar', 'Bà Tư quàng lên vai bạn mình chiếc khăn len. Hàng mũi đầu sờn hơn cả, nhưng lần này đã có hàng mũi cuối.'],
    ['mo', 'happy', 'Cô ấy dậy rồi. Vậy là Mơ về nhà ha.'],
    ['mo', 'Cậu đừng khóc. Mơ có đi đâu đâu. Mơ ở trong cô ấy. Với lại ở trong cái tiệm nữa. Tiệm là Mơ mà.'],
    ['emote', 'mo', '🎵'],
    ['hide', 'mo'],
    ['nar', 'Cô bé cười, rồi tan ra thành một đàn đom đóm, bay một vòng quanh bà Diệp, quanh bạn, rồi lẫn vào mưa sao.'],
    ['diep', 'Cháu là người giữ tiệm giùm bà? ...Cảm ơn cháu. Tiệm là của cháu rồi. Bà chỉ xin một chỗ ngồi uống trà bên hiên thôi.'],
    ['go', 'fin'],
    // ---------- kết 2: Mơ tiếp ----------
    ['label', 'dream'],
    ['you', 'sad', '...Bà cứ ngủ đi ạ. Hoa trên đảo, cháu lo.'],
    ['nar', 'Mi mắt bà Diệp yên trở lại. Trên môi bà có một nụ cười, như người đang mơ một giấc rất đẹp.'],
    ['ba_tu', 'sad', 'Vậy cũng được, Diệp ạ. Bà cứ mơ. Tư lên thăm bà mỗi ngày.'],
    ['mo', 'shy', 'Cậu giữ Mơ lại hả. ...Hì.'],
    ['mo', 'happy', 'Vậy Mơ trông hoa tiếp nha. Mà cậu phải nhớ cô ấy giùm cả làng đó. Nhớ thiệt kỹ.'],
    ['nar', 'Cây Mộng nở suốt đêm ấy. Dưới gốc, một người vẫn mơ. Trước hiên tiệm, giấc mơ của bà vẫn đi chúc từng chậu hoa ngủ ngon.'],
    ['go', 'fin'],
    // ---------- kết ẩn: Cả làng cùng mơ ----------
    ['label', 'all'],
    ['nar', 'Ông Ba gọi trước, giọng khàn. Rồi cô Ngân, thầy Duy, cô Mai. Mỗi người gọi bằng cái tên mà họ vừa nhớ lại.'],
    ['ong_ba', 'Cô Diệp! Thuyền tôi đóng xong rồi, cô dậy mà coi!'],
    ['co_ngan', 'cry', 'Cô ơi, con vẽ lại rồi nè!'],
    ['nar', 'Cái cây không cần giữ ai nữa. Đêm nay nó no bằng những giấc mơ được cho đi, chứ không phải bị đem đổi.'],
    ['place', 'diep', 3.9, -35.6, 'ba_tu'],
    ['diep', 'think', 'Ồn quá... Cả làng làm gì trên đồi thế này?'],
    ['ba_tu', 'cry', 'Đi đón bà chứ làm gì.'],
    ['nar', 'Bà Tư quàng lên vai bạn mình chiếc khăn len, cuối cùng cũng đã đan xong.'],
    ['mo', 'surprised', 'Ơ. Mơ... vẫn còn nè?'],
    ['diep', 'happy', 'Còn chứ. Giấc mơ thành thật rồi thì đâu có mất. Nó chỉ lớn lên thôi.'],
    ['nar', 'Bà Diệp nhìn thẳng vào Mơ, rồi chìa tay ra. Lần này, ngón tay bé xíu không đi xuyên qua nữa.'],
    ['emote', 'mo', '🎵'],
    ['mo', 'happy', 'Móc ngoéo được rồi! Cậu ơi, móc ngoéo được rồi!'],
    ['nar', 'Sáng hôm sau, trước hiên tiệm có thêm một ngọn đèn nhỏ, sáng cả ngày lẫn đêm. Và ngoài bến, con thuyền của ông Ba lần đầu chạm nước.'],
    ['label', 'fin'],
    ['fx', 'dark', true],
    ['title', 'Hết', 'Giấc mơ của tiệm hoa'],
    ['end'],
  ] },

  // ================================================================ TRAO LẠI HOA MỘNG
  give_ba: { title: 'Trao lại: Hoa Buồm Trắng', lines: [
    ['meet', 'ong_ba'],
    ['you', 'Ông Ba. Nó nở rồi ông ạ.'],
    ['emote', 'ong_ba', '❗'],
    ['ong_ba', 'surprised', '...Trắng như buồm.'],
    ['ong_ba', 'cry', 'Bà ấy vẽ hải trình bằng phấn. Đảo Mây, rồi mũi Én, rồi vòng xuống phía nam... Ông nhớ rồi. Ông nhớ hết rồi.'],
    ['ong_ba', 'Còn có một cô chủ tiệm hoa hay sang xem ông đóng thuyền, lần nào cũng dúi cho bà ấy một bó cúc. Cô ấy tên... Diệp. Phải, cô Diệp.'],
    ['give', 'ba'],
    ['ong_ba', 'happy', 'Mai ông bào lại mạn thuyền. Bà ấy không còn đi được, nhưng con thuyền thì phải xuống nước. Ông nợ bà ấy.'],
    ['end'],
  ] },
  give_duy: { title: 'Trao lại: Hoa Sao Rơi', lines: [
    ['meet', 'anh_duy'],
    ['you', 'Thầy Duy, cái chậu cắm bút của thầy nở đúng đêm sao băng.'],
    ['anh_duy', 'surprised', 'Đúng đêm sao băng? ...Khoan. Mình từng tính được ngày sao băng quay lại. Mình viết kín cả cái bảng ở tiệm hoa.'],
    ['anh_duy', 'think', 'Cô Diệp đứng xem, bảo: “Thầy giáo tương lai đây rồi.” Mà hồi đó mình muốn làm nhà thiên văn cơ.'],
    ['give', 'duy'],
    ['anh_duy', 'happy', 'Dạy học cũng hay. Nhưng tối nay mình sẽ vác kính lên mái trường. Ba mươi năm rồi mình chưa đếm sao.'],
    ['end'],
  ] },
  give_ngan: { title: 'Trao lại: Hoa Bảy Sắc', lines: [
    ['meet', 'co_ngan'],
    ['you', 'Cô Ngân, cháu mang trả cô cái này.'],
    ['co_ngan', 'cry', 'Bảy màu. Đúng hộp chì của cô.'],
    ['co_ngan', 'Cô Diệp treo tranh của cô ngay cạnh quầy, khách nào vào cũng khoe: “Họa sĩ của tiệm đấy.”'],
    ['give', 'ngan'],
    ['co_ngan', 'shy', 'Tay cô cứng rồi, chắc vẽ xấu lắm. Nhưng mai cháu ghé quán nhé. Sẽ có một cái khung không còn trống.'],
    ['end'],
  ] },
  give_tu: { title: 'Trao lại: Hoa Tuyết Đầu Mùa', lines: [
    ['meet', 'ba_tu'],
    ['you', 'Bà Tư, nụ của bà nở rồi. Đúng đêm tuyết đầu mùa.'],
    ['ba_tu', 'surprised', 'Tuyết đầu mùa...'],
    ['ba_tu', 'Diệp hẹn với bà: bao giờ đảo có tuyết thì hai đứa ra cầu tàu ngồi, khỏi nói gì hết.'],
    ['ba_tu', 'cry', 'Diệp thì bà chưa bao giờ quên. Nhưng bà quên mất là chính mình cũng từng có một giấc mơ.'],
    ['give', 'tu'],
    ['ba_tu', 'happy', 'Cảm ơn con. Bà để nó cạnh khung cửa, chờ Diệp về ngắm chung.'],
    ['end'],
  ] },
  give_su: { title: 'Trao lại: Hoa Nối Mầm', lines: [
    ['meet', 'be_su'],
    ['place', 'me_su', 8.3, 32.9, 'be_su'],
    ['be_su', 'happy', 'Mẹ ơi! Chậu của mẹ nở rồi!'],
    ['me_su', 'surprised', '...Nối Mầm. Cô Diệp gọi nó là hoa Nối Mầm. Cô bảo ai có tay trồng thì hoa này mới nở.'],
    ['me_su', 'Mẹ nhớ rồi Su ạ. Mẹ từng muốn giữ cái tiệm ấy cho cô. Giờ có người giữ rồi, lại còn giữ khéo hơn mẹ.'],
    ['give', 'su'],
    ['be_su', 'surprised', 'Chị ơi, mẹ ngồi dậy được kìa!'],
    ['me_su', 'happy', 'Hôm nay mẹ thấy đói. Su nấu cháo đi, mẹ ăn thử một bát.'],
    ['end'],
  ] },
};

// ---- Câu dân làng nói thêm khi cốt truyện đã tới đâu đó (if: dấu / mã cảnh đã xem; viết '!x' = chưa) ----
export const STORY_LINES = {
  ong_ba: [
    { if: 'c1_ask_ba', lines: ['Cái quầy đó... ông cứ nghĩ mãi. Ba chục năm. Đóng cho ai ấy nhỉ?', 'Đêm qua ông nằm mơ thấy tiếng ai cười bên cái quầy gỗ. Tỉnh dậy thì quên sạch.'] },
  ],
  co_ngan: [
    { if: 'c1_ngan_draw', lines: ['Hôm qua cô đứng nhìn mấy cái khung trống cả buổi. Tại cháu đó nha!'] },
    { if: 'c1_ask_ngan&!c1_ngan_draw', lines: ['Dạo này cô hay ngửi thấy mùi hoa nhài. Mà quán cô có trồng nhài đâu.'] },
  ],
  anh_duy: [
    { if: 'c1_duy_team', lines: ['Mình soi cuốn sổ làng dưới đủ loại đèn rồi. Chỗ trống vẫn trống. Bài này khó thật!'] },
    { if: 'c1_ask_duy&!c1_duy_team', lines: ['Cái khoảng trắng trong sổ làng... mình vẫn chưa quên được nó.'] },
  ],
  ba_tu: [
    { if: 'c1_ask_tu', lines: ['Tiệm hoa dạo này sáng đèn, bà nhìn mà mừng.', 'Con cứ chăm hoa cho tốt. Chuyện cũ... rồi sẽ có lúc bà kể.'] },
  ],
  co_mai: [
    { if: 'c2_told_mai', lines: ['Mình chép chữ “Diệp” vào sổ thơ rồi. Sáng nào mở ra cũng thấy lạ, mà không nỡ xóa.'] },
    { if: 'c2_hid_mai', lines: ['Hôm nọ bạn đưa mình xấp giấy trắng... Mình cứ thấy như vừa đánh rơi cái gì.'] },
  ],
};

// Câu nói thêm của chương 3–7 (được ưu tiên xét cùng với STORY_LINES ở trên)
export const STORY_LINES_B = {
  ong_ba: [
    { if: 'gave_ba', lines: ['Mạn thuyền bào xong rồi cháu ạ. Bà ấy mà thấy chắc lại chê ông làm chậm.', 'Cô Diệp ngày xưa hay dúi cho bà nhà ông bó cúc. Giờ ông mới nhớ ra để mà cảm ơn.'] },
    { if: 'c3_boat&!gave_ba', lines: ['Cái nụ đó... ở chỗ cháu nó có khá hơn không?'] },
  ],
  anh_duy: [
    { if: 'gave_duy', lines: ['Tối qua mình đếm được bốn mươi hai sao băng. Sai số cộng trừ hai!', 'Mình tính dạy tụi nhỏ một buổi về sao. Ngồi trên mái trường luôn.'] },
  ],
  co_ngan: [
    { if: 'gave_ngan', lines: ['Cô vẽ lại bến thuyền rồi đấy. Xấu, nhưng mà là cô vẽ.', 'Hôm nay có khách hỏi mua tranh. Cô bảo không bán, tranh đầu tiên phải treo.'] },
  ],
  ba_tu: [
    { if: 'end_wake|end_all', lines: ['Diệp nó ngồi bên hiên tiệm con suốt. Bà mang trà sang, hai bà già ngồi đến tối.'] },
    { if: 'gave_tu', lines: ['Bông hoa trắng bà để cạnh cửa. Sáng nào mở cửa cũng thấy như có tuyết.'] },
    { if: 'c4_tu&!gave_tu', lines: ['Con gọi tên Diệp một tiếng nữa cho bà nghe đi.'] },
  ],
  be_su: [
    { if: 'gave_su', lines: ['Mẹ Su ăn hết bát cháo rồi chị ơi! Hết sạch luôn!', 'Mẹ bảo khỏe lên mẹ sẽ sang tiệm chị xin phụ ươm hạt đó.'] },
    { if: 'c5_su&!gave_su', lines: ['Chị nhớ tưới chậu của mẹ nha. Đừng quên bữa nào đó.'] },
  ],
};

// ---- Mơ nói gì khi bạn chạm vào ban đêm (lúc không có cảnh truyện) ----
export const MO_LINES = [
  'Bé cúc góc kia hôm nay lớn thêm một đốt đó. Mơ đo rồi!',
  'Cậu về trễ ghê. Mơ chúc hết lượt hoa ngủ ngon rồi nè.',
  'Mơ thích mùi đất sau khi cậu tưới. Thơm như... như cái gì đó Mơ quên rồi.',
  'Ban đêm hoa cũng nằm mơ đó. Mơ nghe thấy mà.',
  'Đom đóm rủ Mơ đi chơi, mà Mơ phải trông tiệm.',
  'Cậu nhớ ngủ sớm nha. Người lớn hay quên ngủ lắm.',
];
