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
  xp: [2, 6, 10, 15],
};

// Việc nhờ của từng người. game: needle | hammer | fishing | pour | math | rhyme | memory
export const FAVORS = {
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
  ],
  be_su: [
    { id: 'memory', game: 'memory', title: 'Chơi lật thẻ hoa', icon: '🃏',
      ask: 'Chị ơi, chơi lật thẻ hoa với Su đi! Tìm cho đủ các cặp hoa giống nhau nha!',
      thanks: 'Chị giỏi quá! Su phục chị luôn!', fail: 'Hết giờ rồi chị ơi! Mai mình chơi lại nha!' },
  ],
};

// Số liệu từng mini game (chỉnh độ khó ở đây)
export const MINIGAMES = {
  needle: { need: 3, tries: 5, speed: 2.2, accel: 1.28, eye: 22, help: 'Chạm màn hình khi lỗ kim nằm ngay dưới sợi chỉ. Cần xỏ 3 lần (tối đa 5 lượt).' },
  hammer: { need: 6, tries: 9, speed: 2.6, accel: 1.08, zone: 0.16, help: 'Chạm khi kim lực nằm trong vùng xanh. Mỗi cây đinh cần 2 cú đóng chuẩn.' },
  fishing: { rounds: 3, waitMin: 1.2, waitMax: 3.4, window: [0.85, 0.7, 0.58], help: 'Đợi phao chìm xuống và hiện ❗ rồi chạm thật nhanh. Chạm sớm cá sẽ sợ chạy mất!' },
  pour: { layers: [{ name: 'cà phê', color: '#6b4a3a', to: 52 }, { name: 'kem muối', color: '#f3e1c2', to: 86 }], rate: 30, accel: 18, help: 'Giữ ngón tay trên màn hình để rót, thả ra khi chạm vạch. Rót quá 100% là tràn ly!' },
  math: { count: 5, seconds: 9, help: 'Chọn đáp án đúng trước khi hết giờ.' },
  rhyme: { count: 4, seconds: 11, help: 'Chọn chữ đúng vần lục bát (chữ thứ 6 câu 8 vần với chữ cuối câu 6).' },
  memory: { pairs: 6, seconds: 60, star3: 10, star2: 14, help: 'Lật 2 thẻ một lần, tìm đủ 6 cặp hoa giống nhau trước khi hết giờ.' },
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
