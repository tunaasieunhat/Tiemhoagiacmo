// =============================================================
//  💌 KHÁCH TÂM SỰ & PHONG CÁCH TIỆM
//  Khách kể một câu chuyện → bạn chọn hoa theo Ý NGHĨA (Sổ tay › Ngôn ngữ hoa) → câu chuyện rẽ nhánh theo bó hoa bạn gói.
//  Vài ngày sau khách quay lại kể tiếp, cuối cùng gửi thư báo kết cục. Không có đáp án duy nhất.
//
//  Mỗi bước (step):
//   ask   : lời khách kể · tone: tông màu khách thích · min/max: số cành
//   paths : [{ m: [ý nghĩa], go: 'nhánh' }] — nhánh có NHIỀU CÀNH mang ý nghĩa đó nhất sẽ được chọn
//   fallback : nhánh khi bó hoa không mang ý nghĩa nào ở trên (hoặc gói quá ẩu, điểm < TALE_RULES.sloppy)
//   react : lời khách ngay khi nhận hoa (theo nhánh) · next: nhánh → bước tiếp theo | 'end:<kết>'
//  endings: { title, text, reward: { coins, xp, rep, style: { phong_cách: điểm } } }
// =============================================================

export const TALE_RULES = {
  chance: 0.18,        // khi tiệm sinh khách mới: tỉ lệ là khách tâm sự (nếu có truyện đang chờ)
  waitDays: 2,         // số ngày game khách quay lại kể tiếp
  minLevel: 4,         // cấp mở khách tâm sự
  sloppy: 40,          // điểm bó hoa dưới mức này = gói ẩu ⇒ đi nhánh fallback
  patienceMult: 2.2,   // khách tâm sự chờ lâu hơn khách thường
  priceMult: 1.4,      // trả giá cao hơn bó hoa thường
  letterDelayHours: 10, // giờ game sau bước cuối thì thư kết cục được gửi tới
};

export const TALES = {
  chi_lan: {
    name: 'Chị Lan', self: 'chị', level: 4,
    look: { skin: '#f8d5b8', hair: '#3b2a22', outfit: '#9fd6f0', hat: null, bun: true, top: 'aodai', trim: '#ffffff' },
    intro: 'Người con gái làng dệt lên phố làm việc đã 5 năm.',
    steps: {
      s1: {
        ask: 'Tôi cãi nhau với mẹ vì bỏ nghề dệt của nhà để lên phố. Đã ba năm không nói chuyện… Tuần sau là sinh nhật mẹ. Bạn gói giúp tôi một bó hoa để… để mở lời được không?',
        tone: 'pastel', min: 3, max: 5,
        paths: [{ m: ['apology'], go: 'xinloi' }, { m: ['gratitude', 'respect'], go: 'bieton' }, { m: ['love', 'longing'], go: 'thuong' }],
        fallback: 'vung',
        react: {
          xinloi: 'Hoa mang lời xin lỗi… đúng điều tôi không dám nói thành lời. Cảm ơn bạn.',
          bieton: 'Lời cảm ơn mẹ đã nuôi tôi khôn lớn… Có lẽ mẹ sẽ hiểu tôi chưa bao giờ quên.',
          thuong: 'Thương và nhớ… Mẹ tôi hay khóc lắm, chắc mẹ sẽ khóc mất.',
          vung: 'Ừm… đẹp, nhưng tôi không chắc mẹ hiểu tôi muốn nói gì. Thôi, tôi cứ thử.',
        },
        next: { xinloi: 's2a', bieton: 's2a', thuong: 's2b', vung: 'end:silent' },
      },
      s2a: {
        ask: 'Mẹ tha thứ cho tôi rồi! Mẹ còn rủ tôi về làng mở lớp dạy dệt cho bọn trẻ. Tôi đang phân vân lắm… Hôm nay là buổi học thử đầu tiên, bạn chọn giúp tôi một bó hoa nhé.',
        tone: 'natural', min: 5, max: 7,
        paths: [{ m: ['hope', 'joy'], go: 'o_lai' }, { m: ['longing', 'farewell'], go: 'ra_di' }],
        fallback: 'o_lai',
        react: {
          o_lai: 'Hy vọng… Ừ, bọn trẻ cười nhiều lắm. Có khi tôi ở lại thật.',
          ra_di: 'Hoa này… buồn quá. Chắc trong lòng tôi vẫn muốn về phố.',
        },
        next: { o_lai: 'end:stay', ra_di: 'end:city' },
      },
      s2b: {
        ask: 'Mẹ ôm tôi khóc cả buổi. Giờ tôi muốn tặng hoa cho các cô các bác ở xóm dệt cũ, những người đã chăm tôi hồi bé. Bạn gói bó to giúp tôi nhé!',
        tone: 'warm', min: 5, max: 7,
        paths: [{ m: ['friendship', 'gratitude'], go: 'xom' }, { m: ['joy', 'congrats'], go: 'vui' }],
        fallback: 'vui',
        react: {
          xom: 'Tình làng nghĩa xóm… đúng rồi, chính họ đã nuôi tôi lớn.',
          vui: 'Vui quá đi! Cả xóm sẽ có một bữa tiệc nhỏ.',
        },
        next: { xom: 'end:village', vui: 'end:village' },
      },
    },
    endings: {
      silent: { title: 'Lời chưa nói', text: 'Chị Lan gửi thư: “Mẹ nhận hoa, gật đầu, rồi lại im lặng. Có lẽ cần thêm thời gian. Cảm ơn tiệm đã giúp tôi bước bước đầu tiên.”', reward: { coins: 150, xp: 20 } },
      stay: { title: 'Khung cửi lại kêu', text: 'Chị Lan ở lại làng! Lớp dệt mỗi chiều đông kín trẻ con. Chị gửi tặng tiệm một chiếc khăn dệt hoa văn hoa hồng.', reward: { coins: 600, xp: 60, rep: 5, style: { gratitude: 30 } } },
      city: { title: 'Hai nơi để về', text: 'Chị Lan quay lại phố, nhưng tháng nào cũng về thăm mẹ — lần nào cũng ghé tiệm mua một bó hoa.', reward: { coins: 400, xp: 45, style: { farewell: 15, gratitude: 15 } } },
      village: { title: 'Xóm dệt ngày hội', text: 'Cả xóm dệt mở tiệc đón chị Lan về. Ai cũng hỏi “hoa ở tiệm nào đẹp thế?” — tiệm bạn bỗng nổi tiếng khắp làng.', reward: { coins: 700, xp: 70, rep: 8, style: { gratitude: 25, love: 10 } } },
    },
  },

  anh_khoa: {
    name: 'Anh Khoa', self: 'anh', level: 6,
    look: { skin: '#e8b48f', hair: '#2f2a2a', outfit: '#8fb0c8', hat: null, top: 'sweater', trim: '#ffffff', glasses: 'round' },
    intro: 'Anh thợ sửa đồng hồ ít nói, thầm thương cô giáo làng.',
    steps: {
      s1: {
        ask: 'Tôi… thích cô Hạnh dạy ở trường làng đã lâu. Mai là ngày Nhà giáo. Tôi muốn tặng cô bó hoa, nhưng không biết nên nói thật hay chỉ… chúc mừng thôi. Bạn chọn giúp tôi?',
        tone: 'warm', min: 3, max: 5,
        paths: [{ m: ['love'], go: 'thang' }, { m: ['respect', 'gratitude'], go: 'tu_tu' }, { m: ['longing'], go: 'nho' }],
        fallback: 'rot',
        react: {
          thang: 'Hoa tình yêu… Ừ. Đã đến lúc tôi phải can đảm.',
          tu_tu: 'Kính trọng trước đã. Phải rồi, cô ấy là cô giáo mà.',
          nho: 'Nhớ nhung… đúng là cảm giác của tôi mỗi chiều đi ngang trường.',
          rot: 'Hơi lạ… nhưng thôi, chắc cô ấy cũng không để ý ý nghĩa đâu nhỉ?',
        },
        next: { thang: 's2a', tu_tu: 's2b', nho: 'end:letter', rot: 'end:missed' },
      },
      s2a: {
        ask: 'Cô Hạnh nhận hoa, đỏ mặt, rồi nói “cho em thời gian”. Tôi nên tặng gì cho lần gặp tới để cô ấy thấy tôi nghiêm túc mà không vội vàng?',
        tone: 'pastel', min: 3, max: 5,
        paths: [{ m: ['loyalty', 'hope'], go: 'chung_thuy' }, { m: ['love'], go: 'doc' }],
        fallback: 'chung_thuy',
        react: {
          chung_thuy: 'Thủy chung, chờ đợi… Tôi sẽ chờ.',
          doc: 'Lại hoa tình yêu nữa… có vồ vập quá không nhỉ?',
        },
        next: { chung_thuy: 'end:together', doc: 'end:pushy' },
      },
      s2b: {
        ask: 'Cô Hạnh cảm ơn bó hoa, còn rủ tôi đi dạo ven biển nữa! Lần này tôi muốn nói thật lòng mình. Bạn gói giúp tôi bó đẹp nhất nhé.',
        tone: 'warm', min: 5, max: 7,
        paths: [{ m: ['love', 'loyalty'], go: 'noi_that' }, { m: ['friendship', 'joy'], go: 'ban' }],
        fallback: 'ban',
        react: {
          noi_that: 'Lần này tôi sẽ nói. Cảm ơn bạn đã ở bên tôi suốt chuyện này.',
          ban: 'Tình bạn… có lẽ tôi vẫn chưa đủ can đảm.',
        },
        next: { noi_that: 'end:together', ban: 'end:friends' },
      },
    },
    endings: {
      letter: { title: 'Lá thư trong ngăn kéo', text: 'Anh Khoa viết một lá thư dài kẹp cánh hoa khô, nhưng chưa bao giờ gửi. “Có những tình cảm giữ lại cũng đẹp”, anh nói.', reward: { coins: 200, xp: 25, style: { love: 10 } } },
      missed: { title: 'Lỡ một mùa hoa', text: 'Cô Hạnh nhận hoa, cảm ơn lịch sự. Anh Khoa vẫn sửa đồng hồ, vẫn đi ngang trường mỗi chiều…', reward: { coins: 120, xp: 15 } },
      together: { title: 'Đồng hồ chạy lại', text: 'Thư mời cưới! Anh Khoa và cô Hạnh mời tiệm bạn cắm hoa cho đám cưới nhỏ ven biển. “Không có tiệm, chắc anh vẫn chỉ đứng nhìn”.', reward: { coins: 1200, xp: 110, rep: 12, style: { wedding: 40, love: 25 } } },
      pushy: { title: 'Vội quá hóa xa', text: 'Cô Hạnh nhắn: “Anh tốt lắm, nhưng em chưa sẵn sàng.” Anh Khoa buồn mấy hôm rồi cười: “Lần sau tôi sẽ học cách chờ.”', reward: { coins: 250, xp: 30, style: { love: 10 } } },
      friends: { title: 'Người bạn ven biển', text: 'Họ thành bạn thân, chiều nào cũng đi dạo. Ai biết được sau này…', reward: { coins: 450, xp: 45, style: { love: 10, gratitude: 10 } } },
    },
  },

  ong_tam: {
    name: 'Ông Tám', self: 'ông', level: 8,
    look: { skin: '#e0a882', hair: '#d8d8d8', outfit: '#a6dd94', hat: '#c9a27e', hatKind: 'straw', top: 'tee', trim: '#ffffff' },
    intro: 'Ông lão chài lưới, bạn thân của ông Ba từ thuở nhỏ.',
    steps: {
      s1: {
        ask: 'Thằng bạn chài lưới với tôi năm mươi năm sắp theo con vào Nam ở hẳn. Hai thằng già không biết nói gì với nhau… Cháu gói giúp ông bó hoa tiễn nó.',
        tone: 'natural', min: 5, max: 7,
        paths: [{ m: ['friendship'], go: 'ban' }, { m: ['gratitude', 'respect'], go: 'tri_an' }, { m: ['farewell', 'longing'], go: 'chia_ly' }],
        fallback: 'vung',
        react: {
          ban: 'Tình bạn… Năm mươi năm, ừ, năm mươi năm.',
          tri_an: 'Cảm ơn nó đã kéo ông lên thuyền hôm bão năm ấy. Phải, ông nợ nó điều đó.',
          chia_ly: 'Hoa chia ly… Đúng là chia ly thật rồi, cháu nhỉ.',
          vung: 'Hoa đẹp đấy. Chắc nó cũng chẳng để ý đâu, hai lão già mà.',
        },
        next: { ban: 's2a', tri_an: 's2a', chia_ly: 's2b', vung: 'end:quiet' },
      },
      s2a: {
        ask: 'Nó gửi thư về rồi! Bảo trong Nam nóng lắm, nhớ gió biển ngoài này. Ông muốn gửi vào cho nó một bó hoa khô… à không, gửi hoa tươi kèm thuyền hàng. Cháu chọn nhé.',
        tone: 'cool', min: 3, max: 5,
        paths: [{ m: ['health', 'hope'], go: 'binh_an' }, { m: ['longing'], go: 'nho' }],
        fallback: 'binh_an',
        react: {
          binh_an: 'Mong nó khỏe. Già rồi, chỉ mong thế thôi.',
          nho: 'Nhớ… ừ, ông cũng nhớ nó.',
        },
        next: { binh_an: 'end:visit', nho: 'end:return' },
      },
      s2b: {
        ask: 'Từ hôm nó đi, ông ra cầu tàu ngồi một mình. Ông Ba bảo ông phải tìm việc gì vui vui mà làm. Cháu gói cho ông bó hoa… để ông tặng bọn trẻ học bơi ở bến.',
        tone: 'warm', min: 3, max: 5,
        paths: [{ m: ['joy', 'hope'], go: 'vui' }],
        fallback: 'vui',
        react: { vui: 'Bọn nhóc ồn ào lắm. Nhưng mà vui.' },
        next: { vui: 'end:teacher' },
      },
    },
    endings: {
      quiet: { title: 'Cái gật đầu', text: 'Hai ông già gật đầu với nhau ở bến tàu, không ai nói gì. Có những tình bạn không cần lời.', reward: { coins: 150, xp: 20, style: { farewell: 10 } } },
      visit: { title: 'Chuyến tàu Bắc – Nam', text: 'Ông Tám gửi thư: con trai ông bạn hứa Tết này đưa bố ra thăm. “Cháu nhớ để dành hoa đẹp nhất cho hai lão già nhé!”', reward: { coins: 650, xp: 60, rep: 6, style: { gratitude: 20, farewell: 15 } } },
      return: { title: 'Gió biển gọi về', text: 'Người bạn của ông Tám quyết định quay về đảo sống nốt tuổi già. Hai ông lại cùng ra khơi mỗi sáng.', reward: { coins: 900, xp: 80, rep: 8, style: { farewell: 20, love: 10 } } },
      teacher: { title: 'Thầy dạy bơi già', text: 'Ông Tám thành “thầy dạy bơi” của bọn trẻ ở bến. Chiều nào cũng có tiếng cười vang cả cầu tàu.', reward: { coins: 700, xp: 65, rep: 6, style: { gratitude: 15, farewell: 15 } } },
    },
  },

  co_thu: {
    name: 'Cô Thu', self: 'cô', level: 10,
    look: { skin: '#ffe0c7', hair: '#6b4433', outfit: '#ffd36e', hat: '#ffffff', hatKind: 'chef', top: 'apron', trim: '#fff3e0' },
    intro: 'Cô thợ làm bánh vừa mở tiệm bánh nhỏ đầu làng.',
    steps: {
      s1: {
        ask: 'Mai tiệm bánh của cô khai trương! Cô hồi hộp lắm, sợ không ai tới. Cháu cắm giúp cô một bó hoa thật to đặt trước cửa nhé.',
        tone: 'warm', min: 5, max: 7,
        paths: [{ m: ['congrats', 'joy'], go: 'vui' }, { m: ['hope'], go: 'hy_vong' }, { m: ['health', 'friendship'], go: 'am' }],
        fallback: 'vung',
        react: {
          vui: 'Rực rỡ quá! Nhìn là thấy muốn vào ăn bánh rồi.',
          hy_vong: 'Hy vọng… Ừ, cô cần nhất là điều đó.',
          am: 'Bình an, ấm áp… Giống mùi bánh mới ra lò ghê.',
          vung: 'Ơ… hoa này có hơi buồn không cháu? Thôi cũng được.',
        },
        next: { vui: 's2a', hy_vong: 's2a', am: 's2a', vung: 's2b' },
      },
      s2a: {
        ask: 'Ngày đầu đông khách lắm! Nhưng tuần này vắng hẳn… Cô định làm bánh hoa, bánh nhân mứt hoa của tiệm cháu. Cháu gói cho cô bó hoa trưng ở quầy, cho người ta tò mò ghé vào!',
        tone: 'pastel', min: 5, max: 7,
        paths: [{ m: ['joy', 'love'], go: 'banh_hoa' }, { m: ['hope', 'congrats'], go: 'co_gang' }],
        fallback: 'co_gang',
        react: {
          banh_hoa: 'Bánh hoa hồng, bánh oải hương… Cô thấy ý tưởng hay quá!',
          co_gang: 'Phải cố gắng thôi. Cảm ơn cháu đã tin cô.',
        },
        next: { banh_hoa: 'end:famous', co_gang: 'end:steady' },
      },
      s2b: {
        ask: 'Tiệm vắng quá cháu ạ… Cô đang nghĩ hay là đóng cửa, quay về làm thuê. Cháu gói cho cô bó hoa… cô cũng không biết để làm gì nữa.',
        tone: 'natural', min: 3, max: 5,
        paths: [{ m: ['hope', 'joy'], go: 'thu_lai' }, { m: ['farewell'], go: 'dong' }],
        fallback: 'thu_lai',
        react: {
          thu_lai: 'Hy vọng à… Ừ, thử thêm một mùa nữa xem sao.',
          dong: 'Ừ… chắc đến lúc phải buông rồi.',
        },
        next: { thu_lai: 'end:steady', dong: 'end:close' },
      },
    },
    endings: {
      famous: { title: 'Bánh hoa nổi tiếng', text: 'Bánh hoa của cô Thu nổi tiếng khắp quần đảo! Khách du lịch xếp hàng mua, ai cũng hỏi hoa lấy ở đâu. Cô gửi tiệm phần trăm lợi nhuận đầu tiên.', reward: { coins: 1500, xp: 120, rep: 12, style: { luxury: 25, wedding: 15 } } },
      steady: { title: 'Mùi bánh mỗi sáng', text: 'Tiệm bánh nhỏ đông dần, không nổi tiếng nhưng ấm áp. Sáng nào cô Thu cũng để dành cho bạn một chiếc bánh.', reward: { coins: 600, xp: 60, rep: 5, style: { gratitude: 20 } } },
      close: { title: 'Cánh cửa khép lại', text: 'Cô Thu đóng tiệm, về làm thuê ở thị trấn. Bó hoa cuối cùng cô mang theo, ép khô trong cuốn sổ công thức.', reward: { coins: 200, xp: 25, style: { farewell: 20 } } },
    },
  },
};

// =============================================================
//  🏷️ PHONG CÁCH TIỆM — bán bó hoa có ý nghĩa thuộc phong cách nào thì tiệm nổi tiếng về phong cách đó
//  meanings: ý nghĩa thuộc phong cách · luxury: tính theo bó hoa đẹp (điểm cao, hoa 3★) thay vì ý nghĩa
//  Chuyên sâu: tăng điểm phong cách này thì các phong cách khác giảm một ít (STYLE_RULES.focusDrain) — không thể giỏi hết.
// =============================================================
export const STYLES = {
  wedding: { name: 'Hoa cưới', icon: '💒', meanings: ['loyalty', 'purity', 'congrats'], desc: 'Đám cưới, đính hôn, kỷ niệm ngày cưới.' },
  love: { name: 'Hoa tình yêu', icon: '💗', meanings: ['love', 'longing'], desc: 'Tỏ tình, hẹn hò, nhớ nhung.' },
  gratitude: { name: 'Hoa tri ân', icon: '🙏', meanings: ['gratitude', 'respect', 'friendship', 'health'], desc: 'Cảm ơn thầy cô, cha mẹ, bạn bè.' },
  farewell: { name: 'Hoa tiễn biệt', icon: '🕊️', meanings: ['farewell', 'apology', 'hope'], desc: 'Tiễn đưa, tưởng nhớ, xin lỗi, an ủi.' },
  luxury: { name: 'Hoa sang trọng', icon: '💎', meanings: [], desc: 'Bó hoa tinh xảo, toàn hoa 3★, điểm thật cao.' },
};

export const STYLE_RULES = {
  levels: [0, 40, 120, 260, 480],   // điểm cần cho cấp 0–4
  levelNames: ['Mới nghe tên', 'Có tiếng', 'Nổi tiếng', 'Bậc thầy', 'Huyền thoại'],
  perBouquet: 6,         // điểm mỗi bó hoa đúng phong cách (× điểm bó hoa / 100 × 2)
  luxuryScore: 85,       // bó hoa điểm từ mức này + trung bình ≥ 2,6★ ⇒ tính cho Hoa sang trọng
  focusDrain: 0.12,      // phong cách khác mất 12% số điểm vừa cộng
  priceBonus: 0.06,      // mỗi cấp: bó hoa đúng phong cách giá +6%
  tipBonus: 0.04,        // mỗi cấp: tỉ lệ được bo +4%
  biasPerLevel: 0.07,    // mỗi cấp của phong cách MẠNH NHẤT: thêm 7% khách hỏi bó hoa phong cách đó
};
