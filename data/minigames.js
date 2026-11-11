// =============================================================
//  DÂN LÀNG NHỜ VIỆC & MINI GAME (GĐ12)
//  Mỗi ngày game, mỗi người có thể nhờ bạn 1 việc (xác suất dailyChance). Nhận lời => chơi mini game mô phỏng việc đó.
//  Kết quả 0–3 ⭐ => điểm tình thân + tiền công theo bảng reward. Mỗi người mỗi ngày chỉ nhờ 1 lần.
// =============================================================

export const FAVOR_RULES = {
  dailyChance: 0.55,          // xác suất mỗi người có việc nhờ trong ngày (lần đầu gặp thì chắc chắn có)
  // theo số sao: [0⭐, 1⭐, 2⭐, 3⭐]
  fp: [6, 25, 40, 60],        // điểm tình thân
  coins: [0, 20, 40, 70],     // tiền công
  xp: [1, 3, 5, 8],
  // (GĐ17) độ khó theo số tim với người nhờ: Dễ / Vừa / Khó — khó hơn thì thưởng nhiều hơn
  diffMult: [1, 1.3, 1.6],    // nhân điểm tình thân & tiền công
};

export const DIFFICULTY = {
  names: ['Dễ', 'Vừa', 'Khó'],
  icons: ['🌱', '🌿', '🌳'],
  heartsFor: [0, 4, 7],       // đạt từ bao nhiêu ❤️ với người nhờ thì lên mức này
};

// Combo & hiệu ứng (GĐ17)
export const MG_FX = {
  comboWindow: 2.5,           // làm đúng liên tiếp trong 2,5 giây thì tính combo
};

// Việc nhờ của từng người. game: needle | hammer | fishing | pour | math | rhyme | memory
export const FAVORS = {
  // (GĐ22) Cồn Lặng
  chu_luoi: [
    { id: 'luoi_hammer', game: 'hammer', title: 'Đóng lại ván cầu tàu', icon: '🔨',
      ask: 'Ván cầu tàu long hết đinh. Tay tao run, đóng trật. Mày đóng.',
      thanks: 'Được. Chắc đó.', fail: 'Đưa búa đây. Coi mà học.' },
  ],
  nhum: [
    { id: 'nhum_math', game: 'math', title: 'Tính tiền quầy cá', icon: '🧮',
      ask: 'Chị ơi cháu cộng sổ quầy cá hoài không ra. Ông mà biết cháu tính sai là ông không cho trông quầy nữa. Chị tính giùm cháu nha?',
      thanks: 'Khớp rồi! Chị tính lẹ như máy luôn!', fail: 'Hic, vẫn lệch... thôi để cháu đếm lại từng con.' },
  ],
  // (GĐ21) Mũi Én
  ong_hai: [
    { id: 'hai_fish', game: 'fishing', title: 'Câu bữa tối cho Ông Hải', icon: '🎣',
      ask: 'Chân ông hôm nay không xuống bến nổi. Cháu câu giúp ông mấy con cá, tối ông còn có sức leo đèn.',
      thanks: 'Tay sát cá đấy! Tối nay đèn Mũi Én sáng nhờ cháu.', fail: 'Biển hôm nay khó chiều. Thôi, ông ăn cá khô cũng được.' },
  ],
  trieu: [
    { id: 'trieu_pour', game: 'pour', title: 'San sương sang hũ', icon: '🫙',
      ask: 'Chị ơi, cháu phải san sương từ hũ nhỏ sang hũ lớn mà tay cháu run, đổ ra ngoài hoài. Chị rót giúp cháu nha?',
      thanks: 'Không rớt giọt nào! Chị rót đẹp như đo vậy đó!', fail: 'Tràn mất rồi... không sao, mai sương lại đậu.' },
  ],
  ba_sao: [
    { id: 'sao_memory', game: 'memory', title: 'Xếp lại hoa khô', icon: '💐',
      ask: 'Gió thổi tung cả sạp, hoa khô lẫn hết vào nhau. Cô tìm từng cặp giống nhau xếp lại giùm tôi.',
      thanks: 'Hừm. Xếp cũng gọn đấy. Lần sau tôi lại nhờ.', fail: 'Thôi để tôi tự xếp, cô làm rối thêm.' },
  ],
  ba_tu: [
    { id: 'needle', game: 'needle', title: 'Xỏ kim giúp bà', icon: '🪡',
      ask: 'Mắt bà dạo này kém quá, xỏ mãi không lọt cái kim. Con xỏ giúp bà mấy cây kim nhé?',
      thanks: 'Ôi giỏi quá! Mắt tinh như con thì bà đan được cả trăm cái khăn.', fail: 'Khó nhỉ con... thôi để mai bà nhờ lại, không sao đâu.' },
  ],
  ong_ba: [
    { id: 'fishing', game: 'fishing', title: 'Câu cá cùng Ông Ba', icon: '🎣',
      ask: 'Hôm nay tay ông mỏi. Cháu cầm cần câu giúp ông vài con cá về nấu canh.',
      thanks: 'Hừm... được đấy. Cháu có khiếu câu cá đấy.', fail: 'Cá nó khôn hơn cháu rồi. Mai thử lại.' },
    { id: 'hammer', game: 'hammer', title: 'Đóng đinh hàng rào', icon: '🔨',
      ask: 'Hàng rào xưởng bị gió làm lung lay. Cháu đóng giúp ông mấy cây đinh. Đóng cho thẳng!',
      thanks: 'Thẳng tắp. Không tệ chút nào.', fail: 'Đinh cong hết rồi! Để mai ông dạy lại.' },
  ],
  co_ngan: [
    { id: 'pour', game: 'pour', title: 'Pha cà phê muối', icon: '☕',
      ask: 'Quán đông quá cháu ơi! Cháu pha giúp cô một ly cà phê muối: rót cà phê đến vạch dưới, rồi kem muối đến vạch trên nhé.',
      thanks: 'Chuẩn vị quán Mây! Cháu làm phụ quán cho cô luôn đi.', fail: 'Tràn ly rồi kìa, haha! Không sao, cô pha lại.' },
  ],
  anh_duy: [
    { id: 'math', game: 'math', title: 'Chấm bài toán', icon: '🧮',
      ask: 'Chồng bài kiểm tra cao quá! Bạn giải giúp mình mấy bài toán về hoa để mình đối chiếu đáp án với?',
      thanks: 'Đúng hết luôn! Bạn mà đi dạy chắc học trò mê lắm.', fail: 'Sai vài câu rồi... không sao, toán khó mà!' },
  ],
  co_mai: [
    { id: 'rhyme', game: 'rhyme', title: 'Ghép vần thơ', icon: '📝',
      ask: 'Mình đang soạn bài thơ lục bát cho học trò mà bí chữ quá. Bạn chọn giúp mình chữ đúng vần nhé?',
      thanks: 'Hay quá! Bạn có tâm hồn thi sĩ ghê.', fail: 'Hơi lệch vần một chút... mai mình nhờ bạn tiếp nhé!' },
    { id: 'arrange', game: 'arrange', title: 'Cắm hoa cho lớp học', icon: '💐',
      ask: 'Mai lớp mình có giờ thăm lớp! Bạn cắm giúp mình bình hoa giống hệt mẫu này nhé — nhớ kỹ vị trí từng bông đó!',
      thanks: 'Y hệt mẫu luôn! Cả lớp sẽ trầm trồ cho xem.', fail: 'Hơi khác mẫu một chút... không sao, mình sửa lại được!' },
  ],
  be_su: [
    { id: 'memory', game: 'memory', title: 'Chơi lật thẻ hoa', icon: '🃏',
      ask: 'Chị ơi, chơi lật thẻ hoa với Su đi! Tìm cho đủ các cặp hoa giống nhau nha!',
      thanks: 'Chị giỏi quá! Su phục chị luôn!', fail: 'Hết giờ rồi chị ơi! Mai mình chơi lại nha!' },
    { id: 'butterfly', game: 'butterfly', title: 'Bắt bướm cùng Su', icon: '🦋',
      ask: 'Chị ơi, bướm bay đầy vườn kìa! Bắt giúp Su thật nhiều bướm nha — nhưng đừng chạm vào ong, ong đốt đau lắm!',
      thanks: 'Oa, nhiều bướm quá! Chị là nhà bắt bướm số một!', fail: 'Bướm bay mất hết rồi... mai mình bắt lại nha chị!' },
  ],
};

// Số liệu từng mini game (chỉnh độ khó ở đây)
export const MINIGAMES = {
  // (0.16) dễ hơn: kim chạy chậm hơn, tăng tốc ít hơn, lỗ kim to hơn, thêm 1 lượt
  needle: { need: 3, tries: 6, speed: 1.45, accel: 1.12, eye: 32, help: 'Chạm màn hình khi lỗ kim nằm ngay dưới sợi chỉ. Cần xỏ 3 lần (tối đa 5 lượt).' },
  hammer: { need: 6, tries: 9, speed: 2.6, accel: 1.08, zone: 0.16, help: 'Chạm khi kim lực nằm trong vùng xanh. Mỗi cây đinh cần 2 cú đóng chuẩn.' },
  fishing: { rounds: 3, waitMin: 1.2, waitMax: 3.4, window: [0.85, 0.7, 0.58], help: 'Đợi phao chìm xuống và hiện ❗ rồi chạm thật nhanh. Chạm sớm cá sẽ sợ chạy mất!' },
  pour: { layers: [{ name: 'cà phê', color: '#6b4a3a', to: 52 }, { name: 'kem muối', color: '#f3e1c2', to: 86 }], rate: 30, accel: 18, help: 'Giữ ngón tay trên màn hình để rót, thả ra khi chạm vạch. Rót quá 100% là tràn ly!' },
  math: { count: 5, seconds: 9, help: 'Chọn đáp án đúng trước khi hết giờ.' },
  rhyme: { count: 4, seconds: 11, help: 'Chọn chữ đúng vần lục bát (chữ thứ 6 câu 8 vần với chữ cuối câu 6).' },
  memory: { pairs: 6, seconds: 60, star3: 10, star2: 14, help: 'Lật 2 thẻ một lần, tìm đủ 6 cặp hoa giống nhau trước khi hết giờ.' },
  // --- GĐ17 ---
  arrange: { slots: 6, kinds: 3, peek: 99, seconds: 35, help: 'Nhìn bình hoa mẫu, chọn loài hoa ở dưới rồi chạm vào ô trong bình để cắm cho giống hệt. Mức khó hơn: mẫu sẽ bị che sau vài giây!' },
  butterfly: { seconds: 22, need: [5, 9, 13], max: 4, speed: 70, bee: 0.18, help: 'Chạm vào 🦋 bướm để bắt. Đừng chạm 🐝 ong (bị trừ điểm)! Bắt liên tiếp nhanh để được combo.' },
};

// (GĐ17) Độ khó theo mức Dễ/Vừa/Khó: trường số liệu → [Dễ, Vừa, Khó] (giá trị gán thẳng, không phải hệ số)
export const MG_LEVELS = {
  needle: { speed: [1.45, 1.7, 2.0], eye: [32, 28, 24] },
  hammer: { speed: [2.6, 3.0, 3.5], zone: [0.16, 0.14, 0.11] },
  fishing: { window: [[0.85, 0.7, 0.58], [0.75, 0.6, 0.5], [0.65, 0.52, 0.42]] },
  pour: { rate: [30, 36, 44] },
  math: { seconds: [9, 8, 6.5] },
  rhyme: { seconds: [11, 9.5, 8] },
  memory: { seconds: [60, 52, 45] },
  arrange: { slots: [6, 9, 9], kinds: [3, 4, 5], peek: [99, 6, 4] },
  butterfly: { speed: [70, 90, 115], bee: [0.18, 0.25, 0.32] },
};

// Câu thơ lục bát cho mini game "Ghép vần thơ": [câu 6, câu 8 có chỗ trống ___, đáp án đúng, 2 đáp án sai]
export const RHYMES = [
  ['Sáng nay nắng đẹp sân nhà', 'Em ra tưới nước cho ___ thêm tươi', 'hoa', ['cây', 'cỏ']],
  ['Gió chiều thổi nhẹ bên hiên', 'Mẹ ngồi khâu áo dịu ___ nụ cười', 'hiền', ['dàng', 'ngọt']],
  ['Tiệm hoa nho nhỏ bên đồi', 'Sớm mai em đón mặt ___ đỏ au', 'trời', ['trăng', 'mây']],
  ['Bé Su chăm chỉ học bài', 'Mai sau lớn lớn tương ___ sáng ngời', 'lai', ['đương', 'tư']],
  ['Đêm về sao sáng đầy trời', 'Ông Ba ngồi kể chuyện ___ ngày xưa', 'đời', ['ma', 'cổ']],
  ['Quán Mây thơm ngát cà phê', 'Ai đi xa nhớ đường ___ quán này', 'về', ['đi', 'qua']],
  ['Bà Tư đan chiếc khăn len', 'Tặng cho cháu nhỏ màu ___ dịu dàng', 'sen', ['đỏ', 'xanh']],
  ['Mưa rơi tí tách hiên nhà', 'Vườn hoa uống nước nở ___ thật xinh', 'ra', ['xong', 'hết']],
];
