// =============================================================
//  KẾT THÂN & CỐT TRUYỆN DÂN LÀNG (GĐ12)
//  - Mỗi người có ❤️ Tình thân 0–10 tim (100 điểm = 1 tim).
//  - Mỗi ngày game: trò chuyện 1 lần + tặng quà 1 lần cho mỗi người.
//  - Sự kiện tim (events): mở khi đủ tim, kể 1 câu chuyện nhiều cảnh, mỗi lựa chọn cộng/trừ điểm khác nhau.
//    Lựa chọn có thể "đánh dấu" (set) để các sự kiện sau rẽ nhánh (if: 'tên' hoặc '!tên').
//
//  Cách viết lựa chọn:  { t: 'câu bạn nói', fp: điểm (+/-), r: 'người kia đáp lại', set: 'dấu', next: số cảnh tiếp }
//    - không có next => kết thúc sự kiện sau câu đáp.
//  Quà thích/ghét: 'rose' (cả loài), 'rose:red' (đúng màu), 'tone:pastel' (tông màu), 'meaning:love' (ý nghĩa).
//    Ưu tiên: đúng màu > cả loài > ý nghĩa > tông màu.
// =============================================================

export const FRIEND = {
  pointsPerHeart: 100,
  maxHearts: 10,
  gift: { love: 80, like: 45, neutral: 18, dislike: -25, hate: -50 }, // điểm khi tặng hoa
  quality: { 1: 0.8, 2: 1, 3: 1.25 },  // hoa càng nhiều sao càng được quý
  birthdayMult: 2,                      // tặng đúng sinh nhật: điểm × 2 (điểm trừ không nhân)
  regularHeadStart: 40,                 // khách quen: mỗi chương truyện ở tiệm đã xong được tặng sẵn bấy nhiêu điểm
  tiers: [[0, 'Người lạ'], [1, 'Mới quen'], [3, 'Quen biết'], [5, 'Bạn bè'], [7, 'Bạn thân'], [9, 'Tri kỷ']],
};

export const REACTION = {
  love: { icon: '😍', name: 'Rất thích' }, like: { icon: '🙂', name: 'Thích' }, neutral: { icon: '😐', name: 'Bình thường' },
  dislike: { icon: '😕', name: 'Không thích' }, hate: { icon: '😣', name: 'Ghét' },
};

export const BONDS = {
  // ---------------------------------------------------------------- CỒN LẶNG (GĐ22)
  chu_luoi: {
    birthday: { season: 'dong', day: 4 },
    gifts: { love: ['saltdaisy', 'daisy:white', 'lily:white'], like: ['tone:natural', 'meaning:longing', 'sealavender'], dislike: ['tone:warm'], hate: ['meaning:congrats'] },
    giftLines: {
      love: '...Trắng. (Ông cầm bông hoa rất lâu.) Để đó. Chiều tao mang ra bến.',
      like: 'Ờ. Cắm vô cái vỏ ốc trên bàn kia.',
      neutral: 'Ừ.',
      dislike: 'Chói. Ở đây không ai mặc màu đó.',
      hate: 'Mừng cái gì. Cầm về.',
    },
    rewards: {
      3: { msg: 'Chú Lưới ném cho bạn một túi mồi “câu dở thì phải có mồi ngon”. (Tính ra tiền.)', coins: 600 },
      5: { msg: 'Chú Lưới chỉ cho bạn chỗ ông giấu tiền bán cá ba chục năm chưa tiêu, bảo cầm lấy một nắm.', coins: 2000 },
      7: { msg: 'Chú Lưới đưa bạn mớ hạt cúc muối mọc hoang sau chòi.', seeds: { 'saltdaisy:white': 6 }, coins: 1000 },
      10: { msg: 'Chú Lưới gọi bạn là “đứa nhỏ nhà tao”. Ông cho bạn hạt cúc muối xanh sóng ông nhặt ngoài rặng đá.', seeds: { 'saltdaisy:blue': 4 }, coins: 2500, xp: 100 },
    },
    talks: [
      { say: 'Mày câu kiểu đó thì tới mùa sau cũng chưa dính.', ch: [
        { t: 'Chú chỉ cháu với.', fp: 18, r: 'Thả lỏng cổ tay. Cá nó giật thì mày nhường. Nó mệt thì mày kéo. Vậy thôi.' },
        { t: 'Cháu câu được khối con rồi đó chú.', fp: 10, r: 'Cá cơm thì đừng có kể.' },
      ] },
      { say: 'Con Nhum nó nói nhiều. Mày đừng có chiều nó.', ch: [
        { t: 'Em ấy vui tính mà chú.', fp: 18, r: '...Ừ. Nhà này có mình nó biết cười.' },
        { t: 'Chú thương em ấy lắm, cháu thấy.', fp: 20, r: 'Ai nói mày. ...Biển cho thì tao giữ. Vậy thôi.' },
      ] },
      { say: 'Ngày rằm đừng ra bến.', ch: [
        { t: 'Sao vậy chú?', fp: 8, r: 'Nói đừng là đừng.' },
        { t: 'Dạ. Cháu ở trong chòi phụ Nhum vá lưới.', fp: 18, r: 'Ờ. Được.' },
      ] },
    ],
    events: [],
  },
  // ============ (GĐ23) Đảo Ngàn Hương ============
  ba_nhai: {
    birthday: { season: 'xuan', day: 3 },
    gifts: { love: ['lavender', 'rose:white', 'meaning:longing'], like: ['tone:pastel', 'peony', 'daisy'], dislike: ['marigold'], hate: ['rose:black'] },
    giftLines: {
      love: 'Mùi này... bà biết mùi này. Hồi xưa có người cũng hay mang sang cho bà. Cảm ơn cháu.',
      like: 'Đẹp quá. Để bà ướp vào trà cho cháu.',
      neutral: 'Cảm ơn cháu. Cháu tên gì nhỉ?',
      dislike: 'Hăng quá, bà nhức đầu mất.',
      hate: 'Màu đen... đám tang. Cháu cất đi giùm bà.',
    },
    rewards: {
      3: { msg: 'Bà Nhài dúi vào tay bạn một gói trà nhài bà tự ướp từ mùa trước. “Cháu uống cho ngủ ngon.”', coins: 600, items: { fertilizer: 6 } },
      5: { msg: 'Bà Nhài gọi đúng tên bạn suốt một buổi chiều. Sen đứng ở cửa nhìn, rồi quay đi lau mắt.', coins: 1500, xp: 60 },
      7: { msg: 'Bà Nhài tặng bạn chiếc lọ thủy tinh xanh bà giữ từ thời con gái. “Cháu giữ giùm bà. Bà hay làm rơi đồ lắm.”', coins: 2500 },
      10: { msg: 'Bà Nhài cài lên áo bạn một bông nhài. “Cháu là người nhà rồi. Người nhà thì không cần nhớ tên.”', coins: 4000, xp: 150 },
    },
    talks: [
      { say: 'Cháu có ngửi thấy không? Gió đổi hướng rồi. Gió tây bắc là gió mang thư.', ch: [
        { t: 'Thư của ai vậy bà?', fp: 18, r: 'Của... một người bạn. Bà nhớ cái mùi, mà không nhớ cái mặt. Lạ ghê.' },
        { t: 'Cháu chỉ thấy mùi hoa nhài.', fp: 12, r: 'Ừ, thì đó. Hoa nhài là thư đó cháu.' },
      ] },
      { say: 'Bà làm hương sáu chục năm. Cháu biết cái khó nhất là gì không?', ch: [
        { t: 'Là chọn đúng hoa ạ?', fp: 10, r: 'Không. Hoa thì dễ.' },
        { t: 'Là nhớ mùi hương ạ?', fp: 20, r: 'Không. Khó nhất là biết lúc nào nên đậy nắp lại. Để lâu quá, hương bay mất.' },
      ] },
      { say: 'Con bé đứng quầy dữ quá ha. Mà nó dễ thương. Nó là con nhà ai vậy cháu?', ch: [
        { t: 'Là Sen, cháu gái bà đó.', fp: 15, r: 'Cháu bà hả? ...Ừ. Ừ, bà biết mà. Bà chỉ hỏi thử cháu thôi.' },
        { t: 'Bà hỏi Sen thử đi bà.', fp: 10, r: 'Thôi. Hỏi nhiều người ta buồn.' },
      ] },
    ],
    events: [],
  },
  sen: {
    birthday: { season: 'thu', day: 6 },
    gifts: { love: ['sunflower', 'tulip:yellow', 'meaning:hope'], like: ['tone:warm', 'cosmos', 'carnation'], dislike: ['lily'], hate: ['rose:black'] },
    giftLines: {
      love: 'Hướng dương... Hồi nhỏ bà hay cắm hoa này trên bàn học của em. ...Cảm ơn chị.',
      like: 'Cũng đẹp. Em cắm ở quầy.',
      neutral: 'Ừm. Cảm ơn.',
      dislike: 'Hoa ly hả. Bệnh viện toàn hoa ly. Em không thích.',
      hate: 'Chị đùa hả?',
    },
    rewards: {
      3: { msg: 'Sen nói “cảm ơn” mà không cau mày. Rồi đưa bạn một hũ mứt tự nấu “làm dư, chị cầm đi”.', coins: 800 },
      5: { msg: 'Sen kể bạn nghe chuyện ở thành phố: căn phòng trọ, ca làm đêm, và cuộc điện thoại báo bà đi lạc lần đầu.', coins: 1600, xp: 60 },
      7: { msg: 'Sen viết tên bạn lên tấm bảng “Người làm của tiệm”, ngay dưới tên em. “Đừng nghĩ nhiều. Ghi cho đủ người thôi.”', coins: 2500 },
      10: { msg: 'Sen ôm bạn một cái, rất nhanh, rồi bỏ chạy vào trong. Trên quầy để lại một gói quà: chai nước hoa nhài đầu tiên em tự cất.', coins: 4000, xp: 150 },
    },
    talks: [
      { say: 'Chị hỏi thật đi. Chị qua đây giúp vì thương bà, hay vì tò mò?', ch: [
        { t: 'Vì bà nhớ tên một người mà cả đảo bên kia đã quên.', fp: 20, r: '...Vậy thì chị cũng như em thôi. Ở lại vì một cái tên.' },
        { t: 'Vì chị thích mùi hương ở đây.', fp: 10, r: 'Thích thì làm cho đàng hoàng. Đừng làm cho vui.' },
      ] },
      { say: 'Hồi em mười tuổi, bà dạy em phân biệt bốn mươi mùi hoa. Giờ bà không phân biệt được em với khách.', ch: [
        { t: 'Nhưng bà vẫn nhớ mùi hương. Biết đâu bà nhớ em qua mùi.', fp: 22, r: 'Em... chưa nghĩ tới chuyện đó.' },
        { t: 'Chị xin lỗi. Chắc em mệt lắm.', fp: 15, r: 'Mệt thì ngủ một giấc là hết. Cái này thì không hết.' },
      ] },
      { say: 'Kệ trà hết rồi. Chị có búp trà không?', ch: [
        { t: 'Để chị lên đồi hái.', fp: 15, r: 'Ừ. Nhớ hái búp non thôi, chị Trà mà thấy lá già là chửi đó.' },
        { t: 'Em nghỉ chút đi, để chị trông quầy.', fp: 20, r: 'Em không cần nghỉ. ...Thôi, năm phút. Năm phút thôi.' },
      ] },
    ],
    events: [],
  },
  ong_que: {
    birthday: { season: 'dong', day: 2 },
    gifts: { love: ['daisy:white', 'peony', 'meaning:love'], like: ['sunflower', 'tone:warm', 'marigold'], dislike: ['tulip'], hate: ['rose:black'] },
    giftLines: {
      love: '...Mẫu đơn. Ngày xưa có người bảo mẫu đơn là hoa cưới. Cảm ơn cô.',
      like: 'Ong thích hoa này. Tôi cũng vậy.',
      neutral: 'Ừ.',
      dislike: 'Hoa này ong không đậu. Tôi không biết để làm gì.',
      hate: 'Cất đi.',
    },
    rewards: {
      3: { msg: 'Ông Quế đưa bạn hũ mật ong đầu vụ, không nói gì thêm.', coins: 700, items: { fertilizer: 6 } },
      5: { msg: 'Ông Quế chỉ cho bạn cách nghe tiếng ong để biết tổ nào sắp chia đàn.', coins: 1500, xp: 60 },
      7: { msg: 'Ông Quế đẽo tặng bạn một cái muỗng gỗ quét mật. Cán muỗng khắc một bông nhài rất nhỏ.', coins: 2500 },
      10: { msg: 'Ông Quế đưa bạn chìa khóa lán ong. “Lỡ tôi có đi đâu thì cô cho ong ăn giùm.”', coins: 4000, xp: 150 },
    },
    talks: [
      { say: 'Ong nó chỉ sống bốn mươi ngày. Mà cả đời nó đi hút mật cho một cái tổ nó không kịp thấy đầy.', ch: [
        { t: 'Vậy nó có buồn không ông?', fp: 18, r: 'Không. Nó đâu biết. Chỉ người mới biết mà vẫn làm.' },
        { t: 'Nghe giống chuyện của ông.', fp: 12, r: '...Cô nói nhiều quá.' },
      ] },
      { say: 'Bà ấy... dạo này có khỏe không?', ch: [
        { t: 'Bà khỏe. Hôm qua bà còn hỏi đường ra gốc đa.', fp: 22, r: 'Gốc đa... Ừ. Ừ, bà ấy thích chỗ đó.' },
        { t: 'Sao ông không tự sang hỏi?', fp: 8, r: 'Bốn mươi năm rồi. Sang thì nói câu gì trước?' },
      ] },
      { say: 'Con Mật nó nhét giấy vô tổ ong hoài. Ong khó chịu lắm, mà tôi không nỡ lấy ra.', ch: [
        { t: 'Ông giữ giùm bé nhé.', fp: 20, r: 'Tôi giữ hết. Có cả hộp.' },
        { t: 'Ong không khó chịu đâu, ong biết đó là thư.', fp: 15, r: 'Cô nói giống con nhỏ.' },
      ] },
    ],
    events: [],
  },
  chi_tra: {
    birthday: { season: 'ha', day: 4 },
    gifts: { love: ['hydrangea', 'meaning:gratitude', 'cosmos:pink'], like: ['tone:cool', 'daisy', 'lavender'], dislike: ['orchid'], hate: ['rose:black'] },
    giftLines: {
      love: 'Trời đất ơi đẹp quá! Chị cắm trên bàn thờ ba con Mật nha em.',
      like: 'Dễ thương ghê. Cảm ơn em!',
      neutral: 'Ừa, cảm ơn em nha.',
      dislike: 'Lan hả. Sang quá, chị không biết chưng sao cho hợp.',
      hate: 'Ối, màu này xui lắm em ơi.',
    },
    rewards: {
      3: { msg: 'Chị Trà dúi cho bạn một bao búp trà loại một. “Đừng nói con Sen, nó bắt chị tính tiền.”', coins: 600 },
      5: { msg: 'Chị Trà dạy bạn bài hát hái trà của làng. Bé Mật hát theo sai lời, cả ba cười nghiêng ngả.', coins: 1400, xp: 60 },
      7: { msg: 'Chị Trà kể chuyện chồng chị: đi biển một mùa gió, không về. “Chị không khóc nữa. Còn con Mật mà.”', coins: 2500 },
      10: { msg: 'Chị Trà nhận bạn làm em kết nghĩa, có ăn chè đàng hoàng.', coins: 4000, xp: 150 },
    },
    talks: [
      { say: 'Con Sen nó gồng ghê lắm em. Mười bảy tuổi mà gánh cả tiệm lẫn bà.', ch: [
        { t: 'Mình phụ được gì thì phụ chị ha.', fp: 20, r: 'Ừ. Nó không nhờ đâu, mình cứ làm thôi.' },
        { t: 'Sao không ai giúp Sen hết vậy chị?', fp: 12, r: 'Có chứ. Mà nó không chịu. Giống bà nó y chang.' },
      ] },
      { say: 'Hồi nhỏ chị hay sang tiệm bà Nhài ăn chực. Bà làm mứt gừng ngon nhất đảo.', ch: [
        { t: 'Hôm nào mình làm lại cho bà ăn đi chị.', fp: 20, r: 'Ý hay! Bà không nhớ công thức đâu, mà chị nhớ cái vị.' },
        { t: 'Giờ bà còn làm không chị?', fp: 10, r: 'Bà quên đường ra bếp rồi em.' },
      ] },
      { say: 'Con Mật nó cứ hỏi ba nó ở đâu. Chị nói ba đi làm xa. Em thấy chị nói vậy có sai không?', ch: [
        { t: 'Không sai. Đợi bé lớn thêm chút nữa.', fp: 18, r: 'Ừ. Lớn thêm chút nữa.' },
        { t: 'Bé biết hết rồi đó chị. Bé viết thư gửi ong mà.', fp: 15, r: 'Trời... vậy mà chị tưởng nó chơi.' },
      ] },
    ],
    events: [],
  },
  be_mat: {
    birthday: { season: 'xuan', day: 6 },
    gifts: { love: ['sunflower', 'marigold', 'meaning:joy'], like: ['tone:warm', 'tulip', 'daisy:yellow'], dislike: ['hydrangea'], hate: ['rose:black'] },
    giftLines: {
      love: 'Màu vàng như mật! Em cho ong coi nha chị!',
      like: 'Đẹp ghê! Em cắm vô ly nước.',
      neutral: 'Em cảm ơn chị!',
      dislike: 'Hoa này ong không thích. Em cũng không thích.',
      hate: 'Ghê quá à!',
    },
    rewards: {
      3: { msg: 'Bé Mật tặng bạn một con ong làm bằng hạt cà phê sơn vàng.', coins: 500 },
      5: { msg: 'Bé Mật dắt bạn đi xem “nhà ong bí mật” trong bụi tre, và bắt bạn ngoéo tay không kể ai.', coins: 1200, xp: 50 },
      7: { msg: 'Bé Mật viết một lá thư gửi ong cho bạn: “Ong ơi nhờ ong chở chị này đi chơi.”', coins: 2000 },
      10: { msg: 'Bé Mật gọi bạn là “chị Hai”. Từ giờ phần chè của bé chia đôi.', coins: 3500, xp: 120 },
    },
    talks: [
      { say: 'Chị ơi, ong bay tới trời mất mấy ngày?', ch: [
        { t: 'Chắc một ngày thôi, ong bay nhanh lắm.', fp: 15, r: 'Vậy mai ba em đọc được thư rồi!' },
        { t: 'Chị không biết. Em hỏi ông Quế thử?', fp: 12, r: 'Ông Quế bảo ong bay bằng trái tim. Em không hiểu.' },
      ] },
      { say: 'Hôm nay em đếm được một trăm con ong. Rồi em đếm lại được chín mươi chín.', ch: [
        { t: 'Chắc một con đi giao thư.', fp: 20, r: 'Đúng rồi! Chị thông minh ghê!' },
        { t: 'Đếm ong khó lắm đó.', fp: 10, r: 'Không khó. Tại tụi nó không chịu đứng yên.' },
      ] },
      { say: 'Bà Nhài hôm qua gọi em là Sen. Em có giống chị Sen không?', ch: [
        { t: 'Hồi nhỏ chắc chị Sen giống em lắm.', fp: 18, r: 'Hihi. Vậy em cho bà gọi.' },
        { t: 'Bà nhớ nhầm thôi em.', fp: 12, r: 'Bà nhớ nhầm hoài. Mà bà cười hiền lắm.' },
      ] },
    ],
    events: [],
  },
  nhum: {
    birthday: { season: 'ha', day: 5 },
    gifts: { love: ['hydrangea:blue', 'daisy:blue', 'saltdaisy:blue'], like: ['tone:cool', 'meaning:hope', 'cosmos'], dislike: ['lavender'], hate: ['rose:black'] },
    giftLines: {
      love: 'Màu xanh! Chị ơi biển thiệt nó màu này hả? Cháu cất dưới gối nha!',
      like: 'Thơm ghê. Ở đây chỉ có mùi cá với mùi sương thôi à.',
      neutral: 'Cháu cảm ơn chị.',
      dislike: 'Mùi này giống thuốc xoa lưng của ông quá...',
      hate: 'Đen thui như đáy đầm. Cháu sợ.',
    },
    rewards: {
      3: { msg: 'Nhum dúi cho bạn mớ phân cá nó tự ủ: “bón hoa tốt lắm, mà hơi hôi”.', items: { fertilizer: 10 } },
      5: { msg: 'Nhum chia cho bạn tiền lời quầy cá tuần này.', coins: 1500 },
      7: { msg: 'Nhum tặng bạn hạt muống biển nó nhặt được trong bụng một con cá.', seeds: { 'beachglory:lilac': 3 }, coins: 800 },
      10: { msg: 'Nhum gọi bạn là chị ruột. Nó tặng bạn nguyên hũ tiền để dành mua thuyền, bảo “chị giữ giùm, cháu sợ xài mất”.', coins: 3000, xp: 100 },
    },
    talks: [
      { say: 'Chị ơi, bên ngoài sương người ta có đông không?', ch: [
        { t: 'Đông lắm. Mai mốt chị dắt em sang chơi.', fp: 20, r: 'Thiệt hả! Cháu phải xin ông đã. Mà chắc ông không cho đâu...' },
        { t: 'Cũng vừa vừa thôi.', fp: 10, r: 'Vừa vừa là mấy người? Hơn hai là đông rồi đó chị.' },
      ] },
      { say: 'Sổ cá của cháu ghi được bốn chục loài rồi. Mà cháu chưa câu được con nào bự hết.', ch: [
        { t: 'Để chị câu con bự cho em đo.', fp: 18, r: 'Hứa nha! Cháu có sẵn thước dây nè.' },
        { t: 'Em giỏi vậy rồi còn gì.', fp: 15, r: 'Hì. Ông không khen đâu, mà ông có lén coi sổ cháu.' },
      ] },
      { say: 'Con cá gỗ này cháu đeo từ nhỏ. Chị thấy nó giống con gì?', ch: [
        { t: 'Giống một con cá đang bơi về nhà.', fp: 20, r: 'Cháu cũng nghĩ vậy. Nó cứ quay đầu về phía bến hoài.' },
        { t: 'Cá chép?', fp: 8, r: 'Không phải! Biển làm gì có cá chép chị.' },
      ] },
    ],
    events: [],
  },

  // ---------------------------------------------------------------- MŨI ÉN (GĐ21)
  ong_hai: {
    birthday: { season: 'thu', day: 3 },
    gifts: { love: ['beachglory', 'sealavender:dusk'], like: ['sealavender', 'meaning:longing', 'tone:cool'], dislike: ['sunflower'], hate: ['meaning:farewell'] },
    giftLines: {
      love: 'Muống biển... Con bé Én hồi nhỏ hay kết thành vòng đội đầu. Cảm ơn cháu, ông để nó cạnh cây đèn.',
      like: 'Thơm đấy. Lâu rồi ông mới được cầm một bông hoa còn mềm.',
      neutral: 'Ừ, ông nhận. Cảm ơn cháu.',
      dislike: 'Vàng chói quá, mắt ông quen ánh đèn mờ rồi.',
      hate: 'Hoa tiễn biệt à... Ông chưa tiễn ai cả. Cháu cất đi.',
    },
    rewards: {
      3: { msg: 'Ông Hải cho bạn mớ cá khô ông tự phơi, đổi được ít tiền.', coins: 300 },
      5: { msg: 'Ông Hải tặng bạn hạt muống biển ông giữ trong hộp thiếc ba mươi năm.', seeds: { 'beachglory:pink': 4 } },
      7: { msg: 'Ông Hải dúi cho bạn một túi tiền lẻ: "Lương gác đèn, ông có tiêu gì đâu."', coins: 1200 },
      10: { msg: 'Ông Hải coi bạn như cháu trong nhà. Ông tặng bạn hạt muống biển tím nhạt hiếm.', seeds: { 'beachglory:lilac': 3 }, coins: 1500, xp: 80 },
    },
    talks: [
      { say: 'Cháu có biết vì sao hải đăng xây cao thế không?', ch: [
        { t: 'Để thuyền ở xa cũng thấy ạ.', fp: 18, r: 'Phải. Càng xa càng cần thấy. Người đi lâu nhất là người cần đèn nhất.' },
        { t: 'Để ông ngắm biển cho đẹp?', fp: 8, r: 'Hà hà. Cũng đẹp thật. Nhưng ông ngắm ba chục năm rồi, thuộc cả từng con sóng.' },
      ] },
      { say: 'Hồi đảo còn mưa, đồi kia tím hết cả. Thuyền buôn hoa đậu kín bến.', ch: [
        { t: 'Rồi đồi sẽ tím lại, ông ạ.', fp: 20, r: 'Cháu nói chắc nịch như con bé Én nhà ông. Nghe mà mát ruột.' },
        { t: 'Sao mọi người không rời đảo ạ?', fp: 5, r: 'Đi gần hết rồi đấy chứ. Còn ông thì phải ở lại, đèn không tự thắp được.' },
      ] },
      { say: 'Tối nay sương dày. Cháu ngủ lại đảo thì đóng kín cửa kẻo ẩm.', ch: [
        { t: 'Cháu lên trông đèn giúp ông một lúc nhé?', fp: 20, r: 'Được. Cháu ngồi ghế này. Đừng chạm vào bấc, còn lại muốn nhìn gì thì nhìn.' },
        { t: 'Vâng, cháu cảm ơn ông.', fp: 12, r: 'Ừ. Ngủ ngon.' },
      ] },
    ],
    events: [],
  },
  trieu: {
    birthday: { season: 'xuan', day: 6 },
    gifts: { love: ['saltdaisy', 'hydrangea:blue'], like: ['tone:cool', 'meaning:hope', 'daisy'], dislike: ['carnation'], hate: ['rose:black'] },
    giftLines: {
      love: 'Hoa tươi! Cánh nó mát lạnh chị ơi! Cháu vẽ nó vào sổ mưa được không?',
      like: 'Đẹp ghê. Cháu cắm vào cái hũ đẹp nhất nha.',
      neutral: 'Cháu cảm ơn chị.',
      dislike: 'Ơ... nó giống hoa khô của bà Sáo quá. Cháu thấy hoa khô nhiều rồi.',
      hate: 'Hoa đen thui! Cháu sợ lắm, chị cất đi.',
    },
    rewards: {
      3: { msg: 'Triều tặng bạn mấy hũ nước sương lọc kỹ — tưới gì cũng tốt.', items: { fertilizer: 8 } },
      5: { msg: 'Triều chia cho bạn hạt cúc muối cậu nhặt được ngoài bãi.', seeds: { 'saltdaisy:white': 5 } },
      7: { msg: 'Triều gom tiền bán hũ sương, nằng nặc đưa bạn "tiền công dạy trồng hoa".', coins: 900 },
      10: { msg: 'Triều tặng bạn hạt cúc muối xanh sóng — thứ quý nhất cậu có.', seeds: { 'saltdaisy:blue': 3 }, coins: 1200, xp: 80 },
    },
    talks: [
      { say: 'Chị ơi, mưa thật thì rơi từ trên xuống hả? Không phải đậu từ từ như sương?', ch: [
        { t: 'Rơi rào rào luôn. Ướt hết trong nháy mắt.', fp: 18, r: 'Trong nháy mắt?! Vậy ba trăm cái hũ của cháu đầy trong một buổi mất!' },
        { t: 'Ừ, mà có khi còn rơi cả ngày.', fp: 15, r: 'Cả ngày... Cháu sẽ đứng ngoài trời cả ngày luôn.' },
      ] },
      { say: 'Sổ mưa của ông nội cháu dày ba cuốn. Cháu viết sang cuốn thứ tư rồi.', ch: [
        { t: 'Em chăm quá. Ông chắc tự hào lắm.', fp: 18, r: 'Ông bảo ngày nào còn người ghi sổ, ngày đó mưa còn biết đường về.' },
        { t: 'Ngày nào cũng ghi "không mưa" thì ghi làm gì?', fp: -8, r: 'Thì... thì phải có người chờ chứ chị.' },
      ] },
      { say: 'Cháu đang tính xem nếu có mưa thì ruộng bậc thang cần bao nhiêu nước.', ch: [
        { t: 'Để chị chỉ em cách xem đất đủ ẩm chưa.', fp: 20, r: 'Thật ạ? Cháu ghi vào sổ ngay! Trang riêng luôn!' },
        { t: 'Em tính giỏi thật đấy.', fp: 12, r: 'Hì. Thầy giáo cuối cùng rời đảo năm cháu lên tám, cháu tự học đó.' },
      ] },
    ],
    events: [],
  },
  ba_sao: {
    birthday: { season: 'ha', day: 2 },
    gifts: { love: ['sealavender', 'lavender'], like: ['tone:pastel', 'meaning:gratitude', 'peony'], dislike: ['cosmos'], hate: ['meaning:jealousy'] },
    giftLines: {
      love: 'Oải hương... còn tươi. (Bà đưa lên mũi rất lâu.) Hừm. Bụi vào mắt thôi, đừng có nhìn.',
      like: 'Cũng được đấy. Để tôi treo ngược lên phơi... à mà thôi, bông này để cắm.',
      neutral: 'Ừ. Để đấy.',
      dislike: 'Hoa dại ngoài bờ ấy mà, tôi phơi cả bao rồi.',
      hate: 'Mang đi! Hoa gì mà nhìn đã thấy bực.',
    },
    rewards: {
      3: { msg: 'Bà Sáo dúi cho bạn một bó hoa khô "bán ế", kèm ít giấy gói.', papers: { kraft: 3 }, coins: 200 },
      5: { msg: 'Bà Sáo cho bạn túi hạt oải hương biển bà cất từ thời còn con gái.', seeds: { 'sealavender:violet': 6 } },
      7: { msg: 'Bà Sáo chia cho bạn tiền lời bán hoa khô cho khách Đảo Mây.', coins: 1000 },
      10: { msg: 'Bà Sáo cằn nhằn một hồi rồi tặng bạn hạt oải hương màu hoàng hôn, giống mẹ bà để lại.', seeds: { 'sealavender:dusk': 3 }, coins: 1500, xp: 80 },
    },
    talks: [
      { say: 'Cô nhìn gì? Chưa thấy ai bán hoa khô bao giờ à?', ch: [
        { t: 'Cháu thấy bà bó khéo quá.', fp: 18, r: 'Hừm. Biết nhìn đấy. Bó hoa khô khó hơn hoa tươi, sai một nhành là gãy.' },
        { t: 'Sao bà không bán hoa tươi ạ?', fp: 3, r: 'Cô hỏi ông trời ấy. Ba chục năm nay tôi cũng muốn hỏi.' },
      ] },
      { say: 'Mẹ tôi bảo oải hương Mũi Én ngày xưa thơm sang tận đất liền.', ch: [
        { t: 'Cháu sẽ trồng lại cho bà ngửi.', fp: 20, r: 'Nói thì dễ. ...Mà cô trồng đi. Tôi già rồi, chờ được.' },
        { t: 'Hoa khô cũng còn thơm mà bà.', fp: 12, r: 'Thơm kiểu của thứ đã qua. Khác chứ.' },
      ] },
      { say: 'Thằng Triều lại để hũ sương chắn lối sạp tôi. Cô bảo nó giùm.', ch: [
        { t: 'Để cháu dời giúp bà.', fp: 18, r: 'Ừ. Nhẹ tay thôi, vỡ cái nào nó khóc cái đó.' },
        { t: 'Bà thương nó lắm mà.', fp: 15, r: 'Ai bảo! ...Thì đảo còn mỗi nó là trẻ con. Không thương nó thì thương ai.' },
      ] },
    ],
    events: [],
  },

  // ---------------------------------------------------------------- BÀ TƯ
  ba_tu: {
    birthday: { season: 'dong', day: 5 },
    gifts: { love: ['tulip:purple', 'lavender', 'carnation'], like: ['daisy', 'hydrangea:white', 'tone:pastel'], dislike: ['sunflower'], hate: ['meaning:farewell'] },
    giftLines: {
      love: 'Trời ơi, đúng loại hoa ông nhà bà hay hái tặng bà ngày xưa... Cảm ơn con nhiều lắm.',
      like: 'Xinh quá! Bà cắm ngay vào cái lọ sứ trên bàn.',
      neutral: 'Cảm ơn con, bà nhận nhé.',
      dislike: 'Màu này chói mắt bà quá con ạ... nhưng bà vẫn cảm ơn con.',
      hate: 'Hoa này... làm bà nhớ ngày tiễn ông. Thôi con cất đi giùm bà.',
    },
    rewards: {
      3: { msg: 'Bà Tư đan tặng bạn đôi găng tay làm vườn, kèm ít phân bón bà ủ.', items: { fertilizer: 5 } },
      5: { msg: 'Bà Tư cho bạn hạt giống oải hương ông trồng năm xưa.', seeds: { 'lavender:pink': 2 }, coins: 150 },
      7: { msg: 'Bà Tư tặng bạn chậu hoa bà chăm suốt mấy năm.', decor: { pot: 1 }, coins: 250 },
      10: { msg: 'Bà Tư coi bạn như cháu ruột, tặng bạn chiếc ghế gỗ ông nhà bà tự đóng.', decor: { bench: 1 }, coins: 500, xp: 60 },
    },
    talks: [
      { say: 'Con này, bà hỏi thật: con trồng hoa có thấy mệt không?', ch: [
        { t: 'Mệt mà vui lắm bà ạ!', fp: 15, r: 'Phải thế chứ. Làm việc mình thích thì mệt cũng thành vui.' },
        { t: 'Hơi mệt, nhưng nhìn hoa nở là quên hết.', fp: 18, r: 'Hồi xưa ông nhà bà cũng nói y như thế khi dạy học trò.' },
        { t: 'Mệt muốn bỏ luôn!', fp: -8, r: 'Ơ kìa... đừng nản sớm thế con.' },
      ] },
      { say: 'Hôm nay bà đan được nửa cái khăn rồi. Con thích màu gì?', ch: [
        { t: 'Màu tím như hoa oải hương ạ.', fp: 18, r: 'Đúng ý bà! Bà cũng mê màu tím lắm.' },
        { t: 'Màu đỏ thật rực rỡ!', fp: 5, r: 'Đỏ cũng đẹp, mà bà già rồi, thích màu dịu hơn.' },
        { t: 'Con không thích khăn len.', fp: -10, r: 'Thế à... thôi bà đan cho đứa khác vậy.' },
      ] },
      { say: 'Mấy đứa cháu ở thành phố lâu lắm chưa gọi về cho bà.', ch: [
        { t: 'Chắc tụi nó bận học thôi bà. Có con ở đây với bà mà!', fp: 20, r: 'Con nói phải. Có con ghé chơi bà vui hẳn.' },
        { t: 'Bà gọi cho tụi nó trước đi!', fp: 10, r: 'Ừ nhỉ, sao bà không nghĩ ra. Tối nay bà gọi.' },
        { t: 'Ai cũng bận mà bà.', fp: -5, r: 'Ừ... ai cũng bận cả.' },
      ] },
      { say: 'Con có biết ngày xưa làng mình chưa có điện không?', ch: [
        { t: 'Thật ạ? Bà kể con nghe với!', fp: 18, r: 'Tối tối cả xóm thắp đèn dầu ngồi kể chuyện ma, vui lắm!' },
        { t: 'Chắc buồn lắm bà nhỉ.', fp: 8, r: 'Buồn đâu con, người với người gần nhau hơn bây giờ.' },
      ] },
      { say: 'Lưng bà hôm nay hơi mỏi...', ch: [
        { t: 'Để con xoa bóp cho bà nhé.', fp: 20, r: 'Ôi tay con khéo quá, đỡ hẳn rồi!' },
        { t: 'Bà nhớ nghỉ ngơi nhiều vào.', fp: 12, r: 'Ừ, bà nghe con.' },
        { t: 'Già rồi mà bà.', fp: -12, r: 'Con nói thế bà buồn đấy.' },
      ] },
      { say: 'Trà gừng bà mới pha, con uống một chén không?', ch: [
        { t: 'Dạ con xin! Thơm quá.', fp: 15, r: 'Uống cho ấm bụng, rồi về làm vườn tiếp nhé.' },
        { t: 'Con không uống được gừng ạ.', fp: 3, r: 'Không sao, lần sau bà pha trà hoa cúc cho con.' },
      ] },
    ],
    events: [
      { id: 'tu_knit', need: 2, title: 'Bài học đan len', scenes: [
        { say: 'Lại đây bà dạy con đan len. Cầm kim thế này, quấn sợi thế này... Ối, con làm rối hết cuộn len rồi!', ch: [
          { t: 'Con xin lỗi bà, để con gỡ lại từ đầu.', fp: 30, r: 'Không sao. Ngày xưa bà cũng làm rối cả chục cuộn mới biết đan đấy.', next: 1 },
          { t: 'Khó quá, con bỏ thôi!', fp: -15, r: 'Mới thế đã bỏ à? Thôi được, hôm khác mình học tiếp.' },
        ] },
        { say: 'Đây, con thử đan lại từng mũi một. Chậm thôi, không ai giục đâu.', ch: [
          { t: 'Từ từ... được một hàng rồi bà ơi!', fp: 35, r: 'Giỏi lắm! Kiên nhẫn là được hết. Trồng hoa cũng thế con nhỉ.' },
          { t: 'Bà đan giúp con nốt nhé.', fp: 10, r: 'Bà đan cho, nhưng lần sau con phải tự làm đấy.' },
        ] },
      ] },
      { id: 'tu_album', need: 4, title: 'Cuốn album cũ', scenes: [
        { say: 'Bà tìm thấy cuốn album cũ. Đây là ông nhà bà hồi còn dạy học, đẹp trai không con?', ch: [
          { t: 'Ông trông hiền quá bà ạ. Bà kể con nghe về ông đi.', fp: 30, r: 'Ông hay mang hoa tulip tím về cho bà mỗi chiều thứ bảy...', next: 1 },
          { t: 'Ảnh mờ quá con không thấy rõ.', fp: 0, r: 'Ừ, ảnh cũ mà... Để bà kể con nghe vậy.', next: 1 },
        ] },
        { say: 'Ông mất năm năm rồi. Có hôm bà vẫn quen tay pha hai chén trà...', ch: [
          { t: '(Nắm tay bà) Ông vẫn luôn ở bên bà mà.', fp: 40, r: 'Cảm ơn con... Có con ở đây, bà thấy lòng ấm lại.' },
          { t: 'Bà đừng buồn nữa, chuyện qua rồi.', fp: 5, r: 'Ừ, bà biết. Chỉ là... nhớ thôi con ạ.' },
        ] },
      ] },
      { id: 'tu_letter', need: 6, title: 'Lá thư của con trai', scenes: [
        { say: 'Con trai bà gửi thư, muốn đón bà lên thành phố ở cùng. Bà nên đi hay ở lại hả con?', ch: [
          { t: 'Bà lên ở với gia đình đi, có con cháu chăm sóc vẫn hơn.', fp: 25, set: 'tu_go', r: 'Con nói phải... Bà già rồi, ở gần con cháu cho chúng yên tâm.', next: 1 },
          { t: 'Bà ở lại đi, làng mình cần bà lắm!', fp: 25, set: 'tu_stay', r: 'Bà cũng thương hòn đảo này lắm. Để bà nghĩ thêm...', next: 1 },
          { t: 'Việc của bà, con không biết đâu.', fp: -20, r: 'Ừ... bà tự nghĩ vậy.' },
        ] },
        { say: 'Dù sao thì bà cũng mừng vì có con để hỏi han. Hồi trẻ bà chẳng có ai mà tâm sự.', ch: [
          { t: 'Bà có chuyện gì cứ kể con nghe nhé.', fp: 30, r: 'Ừ, bà hứa. Con cũng vậy nhé.' },
        ] },
      ] },
      { id: 'tu_garden', need: 8, title: 'Khu vườn kỷ niệm', scenes: [
        { say: 'Bà muốn trồng một khóm hoa sau nhà, để nhớ ông. Con giúp bà chọn loài hoa nhé?', ch: [
          { t: 'Tulip tím, loài hoa ông hay tặng bà.', fp: 40, r: 'Con nhớ cả chuyện đó à... Bà cảm động quá.', next: 1 },
          { t: 'Hướng dương cho rực rỡ!', fp: 5, r: 'Cũng đẹp, mà bà muốn loài hoa có kỷ niệm hơn con ạ.', next: 1 },
        ] },
        { say: '(Hai bà cháu cùng xới đất, gieo hạt. Gió biển thổi nhẹ.) Con biết không, trồng hoa là trồng hy vọng đấy.', ch: [
          { t: 'Năm sau hoa nở, con với bà lại ngắm nhé.', fp: 45, r: '{tu_go?Dù bà ở thành phố, Tết nào bà cũng về ngắm khóm hoa này với con.|Ừ, năm nào bà cháu mình cũng ngồi đây ngắm hoa.}' },
        ] },
      ] },
    ],
  },

  // ---------------------------------------------------------------- ANH DUY
  anh_duy: {
    birthday: { season: 'ha', day: 3 },
    gifts: { love: ['sunflower', 'peony'], like: ['tulip', 'rose:yellow', 'tone:warm'], dislike: ['lavender'], hate: ['meaning:jealousy'] },
    giftLines: {
      love: 'Hướng dương! Luôn hướng về mặt trời, giống như mình luôn... à không có gì! Cảm ơn bạn nha!',
      like: 'Đẹp quá, mình để trên bàn giáo viên cho lớp học tươi hơn.',
      neutral: 'Ồ, cảm ơn bạn nhé!',
      dislike: 'Hắt xì! Xin lỗi, mình bị dị ứng phấn hoa oải hương... hắt xì!',
      hate: 'Hoa vàng ghen tuông à? Bạn trêu mình phải không...',
    },
    rewards: {
      3: { msg: 'Anh Duy tặng bạn cuốn sổ ghi chép mẹo trồng hoa do học trò vẽ, kèm ít tiền thưởng.', coins: 120, items: { medicine: 3 } },
      5: { msg: 'Anh Duy cho bạn hạt hướng dương cam mà học trò gieo trong vườn trường.', seeds: { 'sunflower:orange': 3 } },
      7: { msg: 'Anh Duy đóng tặng bạn một cái hòm thư xinh để nhận thư của dân làng.', decor: { mailbox: 1 }, coins: 200 },
      10: { msg: 'Anh Duy coi bạn là người bạn thân nhất trên đảo. Thầy tặng bạn chiếc đèn lồng học trò làm.', decor: { lantern: 2 }, coins: 400, xp: 60 },
    },
    talks: [
      { say: 'Đố bạn: một luống hoa có 3 hàng, mỗi hàng 4 bông. Hái đi 5 bông còn bao nhiêu?', ch: [
        { t: '7 bông!', fp: 18, r: 'Chính xác! Bạn mà đi dạy toán chắc học trò mê lắm.' },
        { t: '12 bông.', fp: 0, r: 'Hì, bạn quên hái rồi kìa!' },
        { t: 'Mình ghét toán lắm...', fp: -6, r: 'Ơ... toán vui mà! Thôi được rồi.' },
      ] },
      { say: 'Hôm nay có học trò tặng mình bức tranh vẽ cô Mai... à, vẽ hoa! Vẽ hoa thôi!', ch: [
        { t: '(Cười) Vẽ cô Mai đúng không?', fp: 12, r: 'Suỵt! Bạn nói nhỏ thôi... đúng là vẽ cô Mai thật.' },
        { t: 'Chắc bức tranh đẹp lắm.', fp: 10, r: 'Đẹp lắm, mình dán ngay trên bàn.' },
      ] },
      { say: 'Bạn nghĩ đàn ông tặng hoa có kỳ không?', ch: [
        { t: 'Không kỳ chút nào, tặng hoa là tinh tế lắm!', fp: 20, r: 'Vậy à... vậy mình yên tâm rồi.' },
        { t: 'Hơi kỳ đấy.', fp: -10, r: 'Thế à... chắc mình không tặng nữa.' },
      ] },
      { say: 'Đạp xe vòng quanh đảo buổi sáng sướng lắm. Bạn có hay đi dạo không?', ch: [
        { t: 'Có chứ, hôm nào mình đi cùng nhé!', fp: 18, r: 'Hẹn bạn sáng chủ nhật!' },
        { t: 'Mình bận chăm vườn suốt.', fp: 6, r: 'Nhớ nghỉ ngơi nữa nha bạn.' },
      ] },
      { say: 'Học trò lớp mình nghịch quá, hôm nay đứa nào cũng lấm lem bùn đất.', ch: [
        { t: 'Trẻ con nghịch mới khỏe đó thầy!', fp: 15, r: 'Ừ ha, nhìn tụi nó cười là mình hết giận.' },
        { t: 'Phạt tụi nó đi!', fp: -5, r: 'Mình không thích phạt học trò đâu...' },
      ] },
      { say: 'Mình đang đọc một cuốn sách về các loài hoa. Bạn biết hoa hướng dương quay theo mặt trời không?', ch: [
        { t: 'Biết chứ, khi còn non nó quay theo nắng.', fp: 18, r: 'Bạn giỏi quá! Đúng là chủ tiệm hoa có khác.' },
        { t: 'Thật á? Hay quá!', fp: 12, r: 'Thiên nhiên kỳ diệu ghê ha.' },
      ] },
    ],
    events: [
      { id: 'duy_flower', need: 2, title: 'Câu hỏi của thầy Duy', scenes: [
        { say: 'Bạn ơi... mình hỏi nhỏ: bạn có biết cô Mai thích hoa gì không?', ch: [
          { t: 'Hình như cô ấy thích cúc trắng và cẩm tú cầu.', fp: 35, set: 'duy_knows', r: 'Cúc trắng... cẩm tú cầu... mình ghi lại ngay! Cảm ơn bạn nhiều!' },
          { t: 'Chắc là hoa hồng đỏ!', fp: 10, r: 'Hồng đỏ à... cũng được, nhưng mình hơi ngại.' },
          { t: 'Hỏi cô ấy đi, hỏi mình làm gì.', fp: -10, r: 'Mình... mình không dám hỏi.' },
        ] },
      ] },
      { id: 'duy_poem', need: 4, title: 'Bài thơ vụng về', scenes: [
        { say: 'Mình thử viết một bài thơ... "Hoa cúc màu trắng, mắt em màu đen, tim anh đập loạn, như phương trình bậc hai"... Bạn thấy sao?', ch: [
          { t: 'Thật lòng thì hơi buồn cười, nhưng rất đáng yêu!', fp: 35, r: 'Haha, bạn nói thật làm mình yên tâm. Đáng yêu là được rồi!', next: 1 },
          { t: 'Hay tuyệt! Đúng là thi sĩ!', fp: 10, r: 'Thật không đó? Mình thấy bạn đang nhịn cười...', next: 1 },
          { t: 'Dở tệ.', fp: -20, r: '...Mình biết mà. Thôi bỏ đi.' },
        ] },
        { say: 'Hay mình nhờ chính cô Mai sửa thơ cho mình nhỉ? Cô ấy dạy văn mà...', ch: [
          { t: 'Ý hay! Vừa học thơ vừa được nói chuyện với cô ấy.', fp: 30, set: 'duy_poem_mai', r: 'Bạn thông minh thật! Mai mình mang bài thơ sang lớp cô ấy.' },
          { t: 'Thôi, ngại lắm.', fp: 5, r: 'Ừ... chắc mình tự sửa vậy.' },
        ] },
      ] },
      { id: 'duy_plan', need: 6, title: 'Kế hoạch tỏ tình', scenes: [
        { say: 'Mình quyết định rồi: mình sẽ nói với cô Mai! Nhưng nói thế nào bây giờ...', ch: [
          { t: 'Cứ thật lòng, tặng cô ấy một bó hoa và nói thẳng.', fp: 30, set: 'duy_brave', r: 'Thật lòng... ừ, mình sẽ thật lòng!', next: 1 },
          { t: 'Viết thư tay rồi nhờ Bé Su đưa giúp.', fp: 20, set: 'duy_letter', r: 'Thư tay! Vừa lãng mạn vừa đỡ run. Hay đấy!', next: 1 },
          { t: 'Đợi thêm vài năm nữa đi.', fp: -15, r: 'Vài năm?! Mình... mình sợ lỡ mất.' },
        ] },
        { say: 'Bạn sẽ giúp mình chuẩn bị bó hoa chứ? Mình tin tay nghề của bạn nhất.', ch: [
          { t: 'Tất nhiên! Mình sẽ gói bó cúc trắng đẹp nhất.', fp: 35, r: 'Cảm ơn bạn! Có bạn ở bên mình đỡ run hẳn.' },
        ] },
      ] },
      { id: 'duy_retry', need: 7, title: 'Lấy hết can đảm', if: '!duy_brave&!duy_letter', scenes: [
        { say: 'Mình nghĩ lại rồi... đợi vài năm thì lâu quá. Bạn giúp mình nghĩ cách nói với cô Mai nhé?', ch: [
          { t: 'Tặng một bó cúc trắng và nói thật lòng.', fp: 30, set: 'duy_brave', r: 'Được! Lần này mình sẽ không chùn bước nữa!' },
          { t: 'Viết thư tay, nhờ Bé Su đưa giúp.', fp: 25, set: 'duy_letter', r: 'Thư tay... ừ, mình viết ngay tối nay!' },
        ] },
      ] },
      { id: 'duy_answer', need: 8, title: 'Câu trả lời', if: 'duy_brave|duy_letter', scenes: [
        { say: '{duy_brave?Hôm qua mình cầm bó hoa đứng trước cổng nhà cô Mai, run như cầy sấy... rồi mình nói hết!|Bé Su đưa thư giúp mình rồi. Tối qua cô Mai nhắn lại...}', ch: [
          { t: 'Rồi sao, rồi sao? Cô ấy nói gì?', fp: 25, r: 'Cô ấy... cô ấy nói "Em đợi câu này lâu lắm rồi". Mình hạnh phúc quá bạn ơi!', set: 'duy_mai', next: 1 },
        ] },
        { say: 'Tất cả là nhờ bạn đấy. Cuối tuần này mình với Mai hẹn đi cà phê ở quán Mây. Bạn đi cùng không?', ch: [
          { t: 'Thôi, để hai người hẹn hò riêng đi!', fp: 40, r: 'Haha, bạn tâm lý thật. Mình nợ bạn một ly cà phê to đấy!' },
          { t: 'Có chứ, mình làm "bóng đèn" cho!', fp: 25, r: 'Haha, đèn sáng quá thì Mai ngại mất. Đùa thôi, đi chung cho vui!' },
        ] },
      ] },
    ],
  },

  // ---------------------------------------------------------------- CÔ MAI
  co_mai: {
    birthday: { season: 'xuan', day: 6 },
    gifts: { love: ['daisy:white', 'hydrangea', 'lily'], like: ['lavender', 'tone:pastel', 'meaning:purity'], dislike: ['rose:red'], hate: ['meaning:farewell'] },
    giftLines: {
      love: 'Ôi, đúng loài hoa mình thích nhất! Bạn tinh ý ghê, làm mình muốn làm thơ tặng bạn luôn.',
      like: 'Dịu dàng quá, mình để bên cửa sổ lớp học.',
      neutral: 'Cảm ơn bạn nhé!',
      dislike: 'Hoa hồng đỏ... mình chỉ nhận loài này từ người mình thương thôi. Bạn cất đi nhé, hì.',
      hate: 'Hoa này buồn quá... mình không nhận đâu.',
    },
    rewards: {
      3: { msg: 'Cô Mai chép tặng bạn một bài thơ về hoa, kèm ít giấy gói đẹp.', papers: { lace: 2 }, coins: 100 },
      5: { msg: 'Cô Mai cho bạn hạt cúc trắng từ vườn nhà.', seeds: { 'daisy:white': 3 } },
      7: { msg: 'Cô Mai tặng bạn chậu hoa giấy nhỏ chiết từ giàn hoa trước nhà.', decor: { pot: 1 }, coins: 200 },
      10: { msg: 'Cô Mai viết hẳn một bài thơ về tiệm hoa của bạn, dán ở lớp học. Cô tặng bạn cổng hoa hồng.', decor: { arch: 1 }, coins: 400, xp: 60 },
    },
    talks: [
      { say: 'Bạn có thích đọc thơ không?', ch: [
        { t: 'Thích lắm, nhất là thơ về hoa.', fp: 18, r: 'Hợp nhau ghê! Hôm nào mình chép tặng bạn vài bài.' },
        { t: 'Mình thích truyện tranh hơn.', fp: 6, r: 'Truyện tranh cũng hay mà, mình cũng đọc đó!' },
        { t: 'Thơ chán lắm.', fp: -10, r: 'Ừm... chắc bạn chưa gặp bài thơ hợp với mình.' },
      ] },
      { say: 'Hôm nay học trò hỏi mình: "Cô ơi, hoa có biết buồn không?" Bạn trả lời sao?', ch: [
        { t: 'Hoa không nói nhưng héo khi bị bỏ quên, đó là buồn đấy.', fp: 20, r: 'Hay quá! Mai mình kể lại cho học trò nghe.' },
        { t: 'Hoa là cây, sao biết buồn được.', fp: 2, r: 'Ừ đúng là vậy... nhưng mình thích nghĩ hoa có cảm xúc hơn.' },
      ] },
      { say: 'Mấy hôm nay thầy Duy cứ đi ngang lớp mình hoài... không biết có chuyện gì.', ch: [
        { t: 'Chắc thầy có chuyện muốn nói với cô đấy.', fp: 15, r: 'Chuyện gì nhỉ... (đỏ mặt) Thôi, mình đi chấm bài đây.' },
        { t: 'Chắc thầy đi lạc thôi.', fp: 5, r: 'Đi lạc mỗi ngày à? Hì.' },
      ] },
      { say: 'Giàn hoa giấy nhà mình năm nay nở đẹp hơn mọi năm, bạn thấy không?', ch: [
        { t: 'Đẹp lắm! Đi ngang qua ai cũng ngước nhìn.', fp: 18, r: 'Nghe bạn khen vui ghê, chuyên gia hoa mà!' },
        { t: 'Mình chưa để ý.', fp: 0, r: 'Lần sau đi ngang bạn nhìn thử nhé!' },
      ] },
      { say: 'Mình đang chấm bài văn tả cảnh. Có em tả tiệm hoa của bạn đó!', ch: [
        { t: 'Thật á? Em ấy viết gì vậy?', fp: 18, r: '"Tiệm hoa thơm như kẹo, chị chủ tiệm cười như hoa hướng dương." Dễ thương chưa!' },
        { t: 'Cho em ấy 10 điểm đi!', fp: 12, r: 'Haha, mình cho 9 thôi, còn sai chính tả.' },
      ] },
      { say: 'Trời hôm nay đẹp quá, mình muốn ra biển ngồi làm thơ.', ch: [
        { t: 'Đi đi, làm xong đọc mình nghe với.', fp: 15, r: 'Nhất định rồi!' },
        { t: 'Làm thơ mấy chục câu luôn đi!', fp: 8, r: 'Mười câu thôi, nhiều quá chất lượng giảm, hì.' },
      ] },
    ],
    events: [
      { id: 'mai_poem', need: 2, title: 'Bài thơ đầu tiên', scenes: [
        { say: 'Mình vừa viết xong một bài thơ về biển. Bạn nghe thử rồi nói thật cảm nhận nhé?', ch: [
          { t: 'Hay lắm, nhưng câu cuối hơi vội một chút.', fp: 35, r: 'Bạn nói đúng! Mình cũng thấy câu cuối chưa ổn. Cảm ơn bạn đã thành thật.' },
          { t: 'Hay tuyệt vời, không chê vào đâu được!', fp: 10, r: 'Cảm ơn bạn... nhưng mình mong được góp ý hơn là được khen.' },
          { t: 'Mình không hiểu lắm...', fp: 0, r: 'Không sao, thơ mỗi người cảm một kiểu mà.' },
        ] },
      ] },
      { id: 'mai_class', need: 4, title: 'Lớp học trồng hoa', scenes: [
        { say: 'Mình muốn dạy học trò một buổi trồng hoa. Bạn làm "cô giáo khách mời" được không?', ch: [
          { t: 'Được chứ! Mình sẽ dạy tụi nhỏ gieo hạt cúc.', fp: 30, r: 'Tuyệt quá! Học trò chắc mừng lắm.', next: 1 },
          { t: 'Mình bận lắm...', fp: -10, r: 'Vậy à... thôi để dịp khác.' },
        ] },
        { say: '(Bọn trẻ vây quanh bạn, đứa nào cũng lấm lem đất.) Bé Su giơ tay: "Chị ơi, bao giờ hạt mới nảy mầm ạ?"', ch: [
          { t: 'Chăm tưới mỗi ngày, ba hôm nữa là mầm nhú lên!', fp: 35, r: 'Mai cười: "Học trò nhớ bạn mãi cho xem. Cảm ơn bạn nhiều lắm!"' },
          { t: 'Lâu lắm, đợi đi.', fp: 5, r: 'Bé Su xị mặt. Mai vội nói thêm: "Ba hôm thôi con, kiên nhẫn nhé!"' },
        ] },
      ] },
      { id: 'mai_heart', need: 6, title: 'Lòng cô giáo', scenes: [
        { say: '{duy_poem_mai?Thầy Duy nhờ mình sửa thơ... thơ thầy dở lắm, mà mình lại thấy vui. Mình bị làm sao vậy?|Dạo này thầy Duy hay ghé lớp mình... Mình cứ thấy hồi hộp. Mình bị làm sao vậy?}', ch: [
          { t: 'Hình như cô... thích thầy Duy rồi đó!', fp: 30, set: 'mai_aware', r: 'Thích... (mặt đỏ như hồng đỏ) Bạn đừng nói ai nhé!', next: 1 },
          { t: 'Chắc cô bị cảm thôi.', fp: 5, r: 'Cảm... ừ chắc vậy. (Cô Mai không tin lắm.)', next: 1 },
        ] },
        { say: 'Nếu... nếu thầy ấy cũng nghĩ giống mình thì tốt biết mấy.', ch: [
          { t: 'Biết đâu thầy ấy cũng đang lo y như cô đấy.', fp: 35, r: 'Thật không? Vậy thì... mình sẽ chờ xem.' },
          { t: 'Cô nói trước đi!', fp: 20, r: 'Mình á?! Mình... mình không dám đâu.' },
        ] },
      ] },
      { id: 'mai_end', need: 8, title: 'Bài thơ cho tiệm hoa', scenes: [
        { say: '{duy_mai?Thầy Duy và mình... chính thức là một đôi rồi. Mình biết bạn đã giúp đỡ cả hai. Cảm ơn bạn nhiều lắm!|Mình viết một bài thơ tặng bạn và tiệm hoa. Bạn có muốn nghe không?}', ch: [
          { t: '{duy_mai?Chúc hai người thật hạnh phúc!|Mình muốn nghe lắm!}', fp: 40, r: '"Tiệm nhỏ bên đồi gió, ngày ngày hoa nở tươi. Người trồng hoa nhỏ bé, gieo cả nụ cười người." Bài này tặng bạn!' },
        ] },
      ] },
    ],
  },

  // ---------------------------------------------------------------- BÉ SU
  be_su: {
    birthday: { season: 'thu', day: 2 },
    gifts: { love: ['tulip', 'daisy:pink', 'cosmos'], like: ['sunflower', 'tone:warm', 'meaning:joy'], dislike: ['rose'], hate: ['meaning:farewell'] },
    giftLines: {
      love: 'Oaaa! Hoa đẹp quá chị ơi! Su đem về cắm cạnh giường mẹ!',
      like: 'Cảm ơn chị! Su thích lắm luôn!',
      neutral: 'Cảm ơn chị ạ!',
      dislike: 'Á, gai đâm tay Su rồi... Su sợ hoa hồng lắm.',
      hate: 'Hoa này đen thui... Su sợ...',
    },
    rewards: {
      3: { msg: 'Bé Su vẽ tặng bạn bức tranh tiệm hoa, mặt sau còn dán 1 viên kẹo.', coins: 80, items: { fertilizer: 3 } },
      5: { msg: 'Bé Su đem tặng bạn hạt tulip vàng mà Su gieo trong lớp học.', seeds: { 'tulip:yellow': 3 } },
      7: { msg: 'Bé Su và bố làm tặng bạn một tượng thỏ bằng đất nặn (bố Su nung giúp).', decor: { bunny: 1 } },
      10: { msg: 'Bé Su nói lớn lên sẽ mở tiệm hoa giống chị. Su tặng bạn quả bóng bay to nhất.', decor: { balloon: 1 }, xp: 60 },
    },
    talks: [
      { say: 'Chị ơi, chị có biết mẹ Su thích hoa gì không?', ch: [
        { t: 'Su hỏi mẹ thử đi, rồi chị gói cho.', fp: 18, r: 'Dạ! Tối nay Su gọi điện hỏi mẹ!' },
        { t: 'Chắc là tulip, ai cũng thích tulip.', fp: 12, r: 'Su cũng thích tulip nhất!' },
      ] },
      { say: 'Hôm nay Su được điểm 10 môn toán nè chị!', ch: [
        { t: 'Giỏi quá! Đập tay với chị cái nào!', fp: 20, r: '(Đập tay) Bốp! Hihi!' },
        { t: 'Ừ, tốt.', fp: 2, r: '...Dạ.' },
        { t: 'Mới 10 thôi à?', fp: -12, r: 'Điểm 10 là cao nhất rồi mà chị...' },
      ] },
      { say: 'Chị ơi, sao hoa hướng dương lại to vậy?', ch: [
        { t: 'Vì nó uống nhiều nắng như Su uống sữa đó!', fp: 18, r: 'Vậy Su uống sữa nhiều cũng cao như hướng dương hả chị?' },
        { t: 'Vì giống nó vậy.', fp: 3, r: 'Dạ...' },
      ] },
      { say: 'Su để dành được 20 nghìn rồi nè! Đủ mua một bông hoa chưa chị?', ch: [
        { t: 'Đủ chứ! Với Su chị bán giá đặc biệt.', fp: 20, r: 'Yeah! Chị là nhất!' },
        { t: 'Chưa đủ đâu em.', fp: -5, r: 'Vậy Su để dành thêm nữa...' },
      ] },
      { say: 'Tối qua Su mơ thấy mẹ khỏe lại, dắt Su đi biển.', ch: [
        { t: 'Mẹ Su sẽ sớm khỏe thôi, chị tin vậy.', fp: 20, r: 'Dạ! Su cũng tin!' },
        { t: 'Mơ thì chỉ là mơ thôi.', fp: -15, r: '(Bé Su cúi mặt)...' },
      ] },
      { say: 'Chị chơi trốn tìm với Su không? Su đếm nha: một, hai...', ch: [
        { t: 'Chơi! Chị đi trốn đây!', fp: 15, r: 'Ba... bốn... chị trốn kỹ vào nha!' },
        { t: 'Chị bận chút, lát chơi nhé.', fp: 5, r: 'Dạ, chị nhớ đó nha!' },
      ] },
    ],
    events: [
      { id: 'su_draw', need: 2, title: 'Bức tranh của Su', scenes: [
        { say: 'Chị ơi, Su vẽ tiệm hoa của chị nè! Đây là chị, đây là hoa, còn đây là... con mèo!', ch: [
          { t: 'Đẹp quá! Chị dán lên quầy hoa nhé!', fp: 35, r: 'Thật hả chị? Su vui quá đi!' },
          { t: 'Tiệm chị đâu có mèo.', fp: 5, r: 'Thì... Su thích mèo mà. Hay chị nuôi một con đi!' },
        ] },
      ] },
      { id: 'su_seed', need: 4, title: 'Hạt giống cho mẹ', scenes: [
        { say: 'Chị dạy Su trồng một cây hoa được không? Su muốn tự trồng tặng mẹ khi mẹ về.', ch: [
          { t: 'Được chứ! Đầu tiên mình xới đất cho tơi nhé.', fp: 30, r: 'Dạ! (Bé Su hì hục xới đất) Vậy được chưa chị?', next: 1 },
        ] },
        { say: 'Rồi giờ gieo hạt nè... Su gieo sâu quá có sao không chị?', ch: [
          { t: 'Gieo nông thôi, lấp chút đất là đủ.', fp: 30, r: 'Dạ! Su sẽ tưới mỗi ngày, chờ hoa nở tặng mẹ!' },
          { t: 'Kệ, sao cũng được.', fp: -10, r: 'Su sợ hạt không lên...' },
        ] },
      ] },
      { id: 'su_piggy', need: 6, title: 'Con heo đất', scenes: [
        { say: '(Bé Su ngồi khóc bên xích đu) Chị ơi... con heo đất của Su bị vỡ, tiền rơi mất hết rồi...', ch: [
          { t: 'Đừng khóc, chị với Su cùng đi tìm nhé.', fp: 35, r: '(Hai chị em tìm được gần hết) Còn thiếu một ít... nhưng Su hết buồn rồi!', next: 1 },
          { t: 'Chị cho Su tiền mua heo đất mới.', fp: 20, r: 'Cảm ơn chị... nhưng Su muốn tự để dành cơ.', next: 1 },
        ] },
        { say: 'Chị ơi, sao lúc buồn có người ở bên lại thấy đỡ buồn vậy?', ch: [
          { t: 'Vì nỗi buồn chia đôi thì nhỏ lại đó Su.', fp: 40, r: 'Vậy lúc chị buồn, Su sẽ ở bên chị nha!' },
        ] },
      ] },
      { id: 'su_show', need: 8, title: 'Buổi biểu diễn', scenes: [
        { say: 'Chị ơi! Mai trường Su có văn nghệ, Su hát bài "Hoa nở". Mẹ Su được về xem đó! Chị đến xem nha?', ch: [
          { t: 'Nhất định chị sẽ đến, còn mang hoa tặng Su nữa!', fp: 40, r: 'Yeahhh! Su sẽ hát hay nhất luôn!', next: 1 },
        ] },
        { say: '(Buổi biểu diễn kết thúc, mẹ Su ôm Su thật chặt.) Mẹ Su: "Cảm ơn cháu đã chăm sóc bé Su những ngày cô nằm viện."', ch: [
          { t: 'Su ngoan lắm cô ạ, cháu chỉ giúp chút thôi.', fp: 45, r: 'Bé Su cười toe: "Chị là chị gái của Su mà!"' },
        ] },
      ] },
    ],
  },

  // ---------------------------------------------------------------- CÔ NGÂN
  co_ngan: {
    birthday: { season: 'ha', day: 6 },
    gifts: { love: ['tone:natural', 'daisy'], like: ['lavender', 'sunflower', 'hydrangea:mint'], dislike: ['hydrangea:pink', 'rose:red', 'orchid'], hate: ['meaning:jealousy'] },
    giftLines: {
      love: 'Mộc mạc mà đẹp, đúng gu của cô! Cô cắm ngay vào chai thủy tinh trên quầy.',
      like: 'Xinh ghê, quán cô lại thêm sắc màu rồi.',
      neutral: 'Cảm ơn cháu nhé!',
      dislike: 'Cầu kỳ quá cháu ơi, quán cô thích kiểu đơn giản hơn.',
      hate: 'Màu vàng ghen tuông... thôi cô không nhận đâu, xui lắm.',
    },
    rewards: {
      3: { msg: 'Cô Ngân mời bạn ly cà phê muối "thần thánh" và gửi ít tiền cảm ơn vì đã cắm hoa cho quán.', coins: 150 },
      5: { msg: 'Cô Ngân cho bạn hạt cúc xanh mà mẹ cô gửi ra từ quê.', seeds: { 'daisy:blue': 3 } },
      7: { msg: 'Cô Ngân tặng bạn bộ bàn trà cũ của quán, vẫn còn đẹp lắm.', decor: { teaset: 1 } },
      10: { msg: 'Cô Ngân đặt tên một món mới là "Cà phê Tiệm Hoa" để cảm ơn bạn, kèm quà lớn.', coins: 600, xp: 60, items: { fertilizer: 10 } },
    },
    talks: [
      { say: 'Cà phê sáng nay cô rang hơi kỹ, cháu thử xem có đắng quá không?', ch: [
        { t: 'Đậm đà, vừa miệng lắm cô!', fp: 15, r: 'Vậy là chuẩn vị quê cô rồi!' },
        { t: 'Hơi đắng thật cô ạ.', fp: 12, r: 'Cảm ơn cháu nói thật, mẻ sau cô rang nhẹ tay hơn.' },
        { t: 'Cháu không uống cà phê.', fp: 2, r: 'Vậy cô pha trà sữa cho cháu nhé!' },
      ] },
      { say: 'Cháu có biết cà phê muối là đặc sản xứ nào không?', ch: [
        { t: 'Huế ạ!', fp: 18, r: 'Giỏi! Ngày xưa cô học pha ở một quán nhỏ trên phố cổ.' },
        { t: 'Sài Gòn?', fp: 5, r: 'Sai rồi, Huế cơ! Nhưng Sài Gòn giờ cũng đâu đâu cũng bán.' },
      ] },
      { say: 'Mưa nhiều quá, khách vào trú mưa đông mà gọi nước ít.', ch: [
        { t: 'Cô làm thêm bánh nóng bán kèm xem!', fp: 18, r: 'Ý hay đấy! Mai cô nướng thử mẻ bánh chuối.' },
        { t: 'Mưa thì chịu thôi cô.', fp: 3, r: 'Ừ, trời cho sao chịu vậy.' },
      ] },
      { say: 'Hoa trên quầy héo rồi, cháu chỉ cô cách giữ hoa tươi lâu không?', ch: [
        { t: 'Cắt xéo cành và thay nước mỗi ngày cô ạ.', fp: 20, r: 'À ra vậy! Cô cứ để nguyên nước cả tuần.' },
        { t: 'Mua hoa mới ở tiệm cháu đi!', fp: 8, r: 'Haha, cháu buôn bán giỏi thật!' },
      ] },
      { say: 'Nhiều lúc cô nhớ quê, nhớ tiếng mẹ gọi cơm chiều...', ch: [
        { t: 'Cô kể cháu nghe về quê cô đi.', fp: 20, r: 'Quê cô có dòng sông nhỏ, chiều nào bọn trẻ cũng nhảy ùm xuống tắm...' },
        { t: 'Cô về quê chơi vài hôm đi.', fp: 12, r: 'Ừ, Tết này cô sẽ về.' },
      ] },
      { say: 'Cô định đổi biển hiệu quán. "Mây" hay "Gió biển" đẹp hơn cháu?', ch: [
        { t: '"Mây" ạ, nghe nhẹ nhàng mà dễ nhớ.', fp: 18, r: 'Cô cũng thương cái tên Mây nhất. Giữ nguyên vậy!' },
        { t: '"Gió biển" cho hợp chỗ.', fp: 8, r: 'Cũng hay... để cô nghĩ thêm.' },
      ] },
    ],
    events: [
      { id: 'ngan_drink', need: 2, title: 'Món nước mới', scenes: [
        { say: 'Cô vừa chế món mới: trà hoa oải hương mật ong. Cháu đặt tên giúp cô nhé?', ch: [
          { t: '"Chiều tím" ạ!', fp: 35, r: '"Chiều tím"... nghe nên thơ quá! Cô ghi lên bảng ngay.' },
          { t: '"Trà số 7".', fp: 5, r: 'Hơi... khô khan nhỉ. Để cô nghĩ thêm.' },
        ] },
      ] },
      { id: 'ngan_home', need: 4, title: 'Nỗi nhớ quê', scenes: [
        { say: 'Hôm nay giỗ mẹ cô... cô không về được. Quán vẫn phải mở cửa.', ch: [
          { t: 'Cháu đóng quán giúp cô một hôm, cô thắp nén nhang cho mẹ nhé.', fp: 40, r: 'Cháu... cảm ơn cháu. Cô sẽ bày một mâm cơm nhỏ, coi như mẹ con cô gặp nhau.', next: 1 },
          { t: 'Cô cố lên, mẹ cô hiểu mà.', fp: 20, r: 'Ừ... mẹ cô lúc nào cũng hiểu cho cô.', next: 1 },
        ] },
        { say: 'Mẹ cô hay cắm hoa cúc trên bàn thờ. Cháu có hoa cúc không?', ch: [
          { t: 'Để cháu mang cho cô bó cúc đẹp nhất.', fp: 30, r: 'Cảm ơn cháu... Có cháu, cô thấy đảo này như quê hương thứ hai.' },
        ] },
      ] },
      { id: 'ngan_storm', need: 6, title: 'Sau cơn bão', scenes: [
        { say: 'Trận bão vừa rồi làm tốc mái hiên quán... sửa tốn kém quá, cô tính đóng cửa luôn.', ch: [
          { t: 'Đừng cô! Để cháu nhờ Ông Ba sửa giúp.', fp: 35, set: 'ngan_saved', r: 'Ông Ba á? Ông khó tính lắm... nhưng thôi, cô thử nhờ xem.', next: 1 },
          { t: 'Đóng quán thì buồn lắm cô ạ.', fp: 10, r: 'Cô cũng buồn lắm chứ...', next: 1 },
        ] },
        { say: '{ngan_saved?(Ông Ba càu nhàu cả buổi nhưng sửa mái hiên chắc chắn hơn cả cũ.) Ông ấy còn không lấy tiền!|Cô quyết định rồi: cô sẽ cố thêm một mùa nữa.}', ch: [
          { t: 'Cả làng đều quý quán Mây của cô mà!', fp: 35, r: 'Cô hiểu rồi. Quán Mây sẽ mở mãi, cho tới khi cô già như Bà Tư!' },
        ] },
      ] },
      { id: 'ngan_recipe', need: 8, title: 'Công thức bí mật', scenes: [
        { say: 'Công thức cà phê muối của cô chưa truyền cho ai. Cô muốn dạy cháu, cháu có muốn học không?', ch: [
          { t: 'Cháu muốn lắm! Cháu hứa giữ bí mật.', fp: 45, r: 'Bí quyết là... một nhúm muối hồng và thật nhiều tình cảm. Haha, thật đấy!' },
          { t: 'Cháu chỉ biết trồng hoa thôi cô ạ.', fp: 15, r: 'Không sao, vậy cô pha cho cháu uống cả đời!' },
        ] },
      ] },
    ],
  },

  // ---------------------------------------------------------------- ÔNG BA
  ong_ba: {
    birthday: { season: 'dong', day: 2 },
    gifts: { love: ['sunflower', 'marigold'], like: ['tone:natural', 'hydrangea:blue', 'meaning:health'], dislike: ['tulip', 'tone:pastel'], hate: ['rose:black', 'meaning:jealousy'] },
    giftLines: {
      love: 'Hừm... hướng dương. Bà nhà tôi ngày xưa trồng đầy sân. (Ông quay đi, mắt hơi đỏ.) Cảm ơn cháu.',
      like: 'Được, được. Để tôi cắm vào cái bình gỗ tôi đẽo.',
      neutral: 'Ờ, cảm ơn.',
      dislike: 'Hoa tây cầu kỳ, ông già này không hợp đâu.',
      hate: 'Mang cái thứ này đi chỗ khác!',
    },
    rewards: {
      3: { msg: 'Ông Ba lặng lẽ sửa lại hàng rào nông trại cho bạn, còn để lại ít tiền "khỏi cảm ơn".', coins: 150, items: { cover: 2 } },
      5: { msg: 'Ông Ba cho bạn hạt hướng dương đỏ, giống bà nhà ông trồng.', seeds: { 'sunflower:red': 2 } },
      7: { msg: 'Ông Ba đẽo tặng bạn một nhà chim bằng gỗ thông.', decor: { birdhouse: 1 } },
      10: { msg: 'Ông Ba nói bạn như cháu nội. Ông đóng tặng bạn chiếc xích đu chắc nhất đảo.', decor: { swing: 1 }, coins: 300, xp: 60 },
    },
    talks: [
      { say: 'Hừm. Cái quầy hoa ông đóng cho cháu vẫn chắc chứ?', ch: [
        { t: 'Chắc lắm ông ạ, khách nào cũng khen!', fp: 18, r: 'Hừm... đương nhiên. Gỗ ông chọn kỹ mà.' },
        { t: 'Hơi lung lay một chân ông ơi.', fp: 12, r: 'Lung lay?! Mai ông sang sửa. Không ai được chê đồ ông làm.' },
      ] },
      { say: 'Sáng nay câu được con cá to bằng bắp tay.', ch: [
        { t: 'Ông câu giỏi quá! Có bí quyết gì không ạ?', fp: 18, r: 'Bí quyết là ngồi im. Bọn trẻ bây giờ không ngồi im nổi năm phút.' },
        { t: 'Chắc nó tự cắn câu thôi.', fp: -8, r: 'Hừ! Cháu thử câu xem có được con nào không.' },
      ] },
      { say: 'Làm mộc cũng như trồng hoa: phải hiểu thớ gỗ, như hiểu tính cây.', ch: [
        { t: 'Ông nói hay quá, cháu sẽ nhớ.', fp: 18, r: 'Nhớ thì làm cho tốt vào.' },
        { t: 'Cháu chẳng hiểu gì cả.', fp: 0, r: 'Hừm, làm lâu rồi sẽ hiểu.' },
      ] },
      { say: 'Bọn trẻ trong làng cứ chạy qua xưởng ông làm ồn.', ch: [
        { t: 'Chắc tụi nhỏ thích xem ông làm đồ gỗ đó!', fp: 18, r: '...Thật à? Hừm, vậy mai ông đẽo cho mỗi đứa một con chim gỗ.' },
        { t: 'Ông đuổi tụi nó đi.', fp: -5, r: 'Đuổi rồi, mà chúng nó vẫn quay lại.' },
      ] },
      { say: 'Đầu gối ông hôm nay đau, chắc sắp mưa.', ch: [
        { t: 'Cháu nhắc ông che mái xưởng nhé.', fp: 15, r: 'Ừ, cháu cũng nhớ che bạt cho ruộng hoa.' },
        { t: 'Ông dự báo thời tiết giỏi hơn đài!', fp: 12, r: 'Hừ, cái chân này chưa sai bao giờ.' },
      ] },
      { say: 'Cháu có biết vì sao ông thích hướng dương không?', ch: [
        { t: 'Vì nó mạnh mẽ giống ông ạ?', fp: 15, r: 'Hừm... một phần thôi.' },
        { t: 'Cháu không biết, ông kể cháu nghe đi.', fp: 18, r: 'Để hôm khác... (ông nhìn ra biển, im lặng).' },
      ] },
    ],
    events: [
      { id: 'ba_fence', need: 2, title: 'Hàng rào xiêu vẹo', scenes: [
        { say: 'Hàng rào nông trại cháu xiêu vẹo quá! Ai làm vậy? Gió to là sập.', ch: [
          { t: 'Cháu tự làm ạ... ông chỉ cháu làm lại cho chắc nhé?', fp: 35, r: 'Hừm, biết nhận sai là tốt. Cầm búa đây, ông dạy.', next: 1 },
          { t: 'Kệ cháu chứ ông!', fp: -20, r: 'Hừ! Đến lúc sập đừng gọi ông.' },
        ] },
        { say: '(Hai ông cháu đóng lại từng cọc rào.) Đóng đinh phải thẳng tay, đừng run.', ch: [
          { t: 'Cháu làm được rồi ông ơi!', fp: 30, r: 'Ừ... không tệ. Không tệ chút nào.' },
        ] },
      ] },
      { id: 'ba_fish', need: 4, title: 'Buổi câu cá', scenes: [
        { say: 'Sáng mai năm giờ ra cầu tàu. Ông dạy cháu câu. Đến trễ thì thôi.', ch: [
          { t: 'Cháu sẽ đến đúng giờ ạ!', fp: 25, r: '(Năm giờ sáng, bạn đã đứng chờ.) Hừm... đúng giờ đấy.', next: 1 },
        ] },
        { say: 'Ngồi im. Đừng nói. Cá nghe tiếng là chạy... (Hai mươi phút trôi qua, phao chưa động.)', ch: [
          { t: '(Vẫn ngồi im lặng chờ)', fp: 40, r: '(Phao giật mạnh!) Kéo! Kéo đi! ...Con cá đầu tiên của cháu đấy. Giỏi.' },
          { t: 'Chán quá ông ơi, về thôi!', fp: -10, r: 'Đấy, bọn trẻ bây giờ là thế.' },
        ] },
      ] },
      { id: 'ba_boat', need: 6, title: 'Chiếc thuyền gỗ', scenes: [
        { say: 'Cháu thấy chiếc thuyền gỗ úp dưới gốc cây không? Ông với bà nhà đóng nó hồi mới cưới.', ch: [
          { t: 'Ông kể cháu nghe về bà đi.', fp: 30, r: 'Bà ấy trồng hướng dương khắp sân. Mỗi lần ông đi biển về, bà đứng giữa vườn hoa vẫy tay...', next: 1 },
          { t: 'Sao ông không sửa lại cho đi biển ạ?', fp: 10, r: 'Sửa làm gì... không còn ai đứng vẫy tay nữa.', next: 1 },
        ] },
        { say: 'Bà mất mười năm rồi. Từ đó ông chỉ ngồi xưởng đẽo gỗ, ít nói với ai...', ch: [
          { t: 'Ông còn có cả làng, có cháu nữa mà.', fp: 40, r: '(Ông Ba im lặng rất lâu) ...Ừ. Ông còn có cháu.' },
          { t: 'Chắc bà vẫn dõi theo ông.', fp: 30, r: 'Hừm... có lẽ vậy.' },
        ] },
      ] },
      { id: 'ba_gift', need: 8, title: 'Món quà của người thợ mộc', scenes: [
        { say: 'Này. Ông sửa lại chiếc thuyền rồi. Chủ nhật cháu ra biển cùng ông không?', ch: [
          { t: 'Cháu đi! Cháu sẽ mang theo một bó hướng dương.', fp: 45, r: 'Hướng dương... (ông cười, lần đầu tiên bạn thấy ông cười) Được. Mang theo đi.' },
          { t: 'Cháu sợ say sóng lắm...', fp: 15, r: 'Hừm, sóng hôm đó êm. Ông chèo chậm.' },
        ] },
      ] },
    ],
  },
};
