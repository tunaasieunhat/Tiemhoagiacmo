// =============================================================
//  📜 CỐT TRUYỆN CHÍNH "GIẤC MƠ CỦA TIỆM HOA" (GĐ20A: chương 1–2)
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
//  Trong chữ: {name} = tên người chơi.
// =============================================================

// ---- Diễn viên: tên hiện trên khung thoại, giọng "bíp" (pitch: số càng lớn giọng càng cao), hình dáng ----
export const CAST = {
  you: { name: '{name}', pitch: 660 },
  mo: { name: 'Mơ', pitch: 1380, look: { skin: '#fff3ea', hair: '#6a4a3a', outfit: '#bdeee0', hat: null, bun: true }, spirit: true, color: '#7fd8c4' },
  diep: { name: 'Bà Diệp', pitch: 520, look: { skin: '#f8d4b8', hair: '#6a4a3a', outfit: '#9fd6c8', hat: '#f6e3a8', bun: true }, color: '#5fb8a2' },
  ba_tu: { pitch: 330 }, ong_ba: { pitch: 240 }, co_mai: { pitch: 640 }, anh_duy: { pitch: 420 }, co_ngan: { pitch: 560 }, be_su: { pitch: 1040 },
};

// ---- Số liệu chung ----
export const STORY_RULES = {
  autoDelay: 4,          // vào game bao nhiêu giây thì cảnh "tự chạy" bắt đầu
  typeSpeed: 34,         // số chữ hiện mỗi giây
  autoPlayPause: 1.6,    // chế độ Tự chạy: nghỉ bao nhiêu giây + thêm theo độ dài câu
  moSpot: [9.4, -3.5],   // chỗ Mơ hay lơ lửng (trước hiên tiệm) vào ban đêm
  storyLineChance: 0.6,  // tỉ lệ dân làng nói câu liên quan cốt truyện thay cho câu chào thường
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
];

// Các chương sẽ ra trong bản cập nhật sau (chỉ để hiện "sắp ra mắt" trong Sổ tay)
export const COMING_CHAPTERS = [
  { n: 3, title: 'Chiếc thuyền đóng dở' }, { n: 4, title: 'Chiếc khăn tháo ra đan lại' }, { n: 5, title: 'Dưới gốc Cây Mộng' },
  { n: 6, title: 'Trả lại giấc mơ' }, { n: 7, title: 'Đêm sao băng thứ hai' },
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
    ['nar', 'Chương 3 — “Chiếc thuyền đóng dở” — sẽ được kể tiếp trong bản cập nhật sau.'],
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

// ---- Mơ nói gì khi bạn chạm vào ban đêm (lúc không có cảnh truyện) ----
export const MO_LINES = [
  'Bé cúc góc kia hôm nay lớn thêm một đốt đó. Mơ đo rồi!',
  'Cậu về trễ ghê. Mơ chúc hết lượt hoa ngủ ngon rồi nè.',
  'Mơ thích mùi đất sau khi cậu tưới. Thơm như... như cái gì đó Mơ quên rồi.',
  'Ban đêm hoa cũng nằm mơ đó. Mơ nghe thấy mà.',
  'Đom đóm rủ Mơ đi chơi, mà Mơ phải trông tiệm.',
  'Cậu nhớ ngủ sớm nha. Người lớn hay quên ngủ lắm.',
];
