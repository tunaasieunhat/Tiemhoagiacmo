// =============================================================
//  KHÁCH QUEN — mỗi người có câu chuyện 5 chương (5 ❤️)
// =============================================================
//  Mỗi chương: khách đến với 1 yêu cầu (request). Làm khách hài lòng (từ 65 điểm)
//  => thêm 1 ❤️, mở chương tiếp theo và nhận quà (reward).
//  Không đạt thì khách vẫn quay lại lần sau với cùng chương (không mất uy tín).
//
//  request: giống khách thường. type 'bouquet' có thể kèm:
//    meaning (ý nghĩa mong muốn — xem MEANINGS trong data/variants.js), tone, occasionText, min, max
//  reward: { coins, xp, items: {fertilizer, cover, medicine}, papers, ribbons, seeds: {"rose:red": 2}, reveal: ["rose:red"] }
//    reveal = cho biết ý nghĩa của các màu hoa đó trong Sổ tay
// =============================================================

export const REGULAR_RULES = {
  chanceInsteadOfNormal: 0.35, // khi có khách mới, xác suất là khách quen (nếu có người đang muốn ghé)
  daysBetweenVisits: 1,        // sau mỗi lần ghé, ít nhất bao nhiêu ngày mới quay lại
  patienceMult: 1.8,           // khách quen kiên nhẫn hơn
  successScore: 65,            // điểm tối thiểu để tính là hài lòng
};

export const REGULARS = {
  ba_tu: {
    name: 'Bà Tư', self: 'bà', minLevel: 1,
    look: { skin: '#f8cfae', hair: '#e6e6e6', outfit: '#c8b4f0', hat: null, bun: true },
    bio: 'Cụ bà hiền hậu sống một mình ở cuối đảo, ngày nào cũng ngồi đan len trước hiên.',
    chapters: [
      {
        intro: 'Ngày xưa ông nhà bà là thầy giáo, ai trong làng cũng quý. Con gói giúp bà một bó nhỏ thật trang nhã để cạnh ảnh ông nhé.',
        request: { type: 'bouquet', min: 3, max: 5, tone: 'cool', meaning: 'respect', occasionText: 'để cạnh ảnh ông' },
        thanks: 'Đẹp quá con ạ... Ông mà thấy chắc lại cười hiền như hồi trước. Tulip tím mang nghĩa kính trọng và thủy chung, đúng là hoa dành cho ông.',
        reward: { coins: 150, reveal: ['tulip:purple'], items: { fertilizer: 3 } },
      },
      {
        intro: 'Mai là sinh nhật bà mà mấy đứa cháu ở thành phố không về được. Bà tự mua hoa tặng mình cho vui, con chọn giúp bà màu tươi tắn nhé!',
        request: { type: 'bouquet', min: 3, max: 6, tone: 'pastel', meaning: 'joy', occasionText: 'mừng sinh nhật của bà' },
        thanks: 'Ôi bà vui quá! Mấy đứa cháu gọi điện về chúc mừng, bà khoe bó hoa luôn đó. Bà cho con mấy hạt cúc hồng bà để dành nhé.',
        reward: { coins: 200, seeds: { 'daisy:pink': 3 }, reveal: ['daisy:pink'] },
      },
      {
        intro: 'Tuần trước bà ốm, cô hàng xóm sang nấu cháo chăm bà suốt mấy ngày. Bà muốn tặng cô ấy bó hoa cảm ơn.',
        request: { type: 'bouquet', min: 4, max: 6, tone: 'warm', meaning: 'gratitude', occasionText: 'cảm ơn cô hàng xóm tốt bụng' },
        thanks: 'Cô ấy cảm động lắm, còn hẹn bà chủ nhật sang học đan len. Có hàng xóm tốt thật là phúc. Con giữ ít hạt hồng đỏ này mà trồng.',
        reward: { coins: 250, seeds: { 'rose:red': 3 }, reveal: ['rose:pink', 'hydrangea:blue'] },
      },
      {
        intro: 'Hôm nay là kỷ niệm 50 năm ngày cưới của ông bà. Năm đó ông cầm bó hoa run run đứng trước cổng nhà bà... Con làm giúp bà một bó thật đẹp nhé.',
        request: { type: 'bouquet', min: 5, max: 7, tone: 'warm', meaning: 'loyalty', occasionText: 'kỷ niệm 50 năm ngày cưới' },
        thanks: 'Năm mươi năm rồi mà bà vẫn nhớ như in. Cảm ơn con đã giúp bà sống lại ngày hôm ấy. Đây là hạt giống quý ông để lại, bà nghĩ con sẽ chăm nó tốt.',
        reward: { coins: 400, seeds: { 'rose:blue': 1 }, reveal: ['lavender:purple', 'sunflower:red'] },
      },
      {
        intro: 'Con trai bà muốn đón bà lên thành phố ở cùng. Bà vui mà cũng buồn vì phải xa hòn đảo này, xa tiệm hoa của con...',
        request: { type: 'bouquet', min: 5, max: 9, tone: 'pastel', meaning: 'friendship', occasionText: 'tặng những người bạn trên đảo' },
        thanks: 'Bà sẽ nhớ con lắm. Nhớ giữ tiệm hoa thật đẹp nhé, Tết bà về sẽ ghé! Bà để lại cho con cái khăn tay bà thêu và chút quà.',
        reward: { coins: 1000, xp: 80, items: { fertilizer: 10 }, reveal: ['daisy:white', 'tulip:black'] },
      },
    ],
  },

  anh_duy: {
    name: 'Anh Duy', self: 'anh', minLevel: 2,
    look: { skin: '#f8cfae', hair: '#2f2a2a', outfit: '#9fd6f0', hat: null },
    bio: 'Thầy giáo dạy toán mới chuyển về đảo, rất hay đỏ mặt mỗi khi nhắc tới cô Mai dạy văn.',
    chapters: [
      {
        intro: 'Ờm... anh muốn tặng hoa cho một người... nhưng chưa dám nói gì cả. Bó nhỏ thôi, nhẹ nhàng, đừng lộ quá em nhé.',
        request: { type: 'bouquet', min: 3, max: 4, tone: 'pastel', meaning: 'friendship', occasionText: 'tặng một người đặc biệt' },
        thanks: 'Cô ấy... cô ấy cười với anh! Còn hỏi anh mua hoa ở đâu nữa. Cúc họa mi trắng nghĩa là tình bạn trong sáng đúng không em?',
        reward: { coins: 150, reveal: ['daisy:white'] },
      },
      {
        intro: 'Anh quyết định rồi! Anh sẽ nói thật lòng mình với cô Mai. Em làm giúp anh bó hoa nói thay anh chữ "yêu" nhé.',
        request: { type: 'bouquet', min: 3, max: 5, tone: 'warm', meaning: 'love', occasionText: 'tỏ tình với cô Mai' },
        thanks: 'Cô ấy đồng ý rồi!!! Anh vui quá trời. Hoa hồng đỏ quả là "linh nghiệm". Anh tặng em ít hạt tulip đỏ, nghe nói cũng mang nghĩa tình yêu đó.',
        reward: { coins: 300, seeds: { 'tulip:red': 3 }, reveal: ['rose:red', 'tulip:red'] },
      },
      {
        intro: 'Anh lỡ quên buổi hẹn vì mải chấm bài... Cô Mai giận anh rồi. Em giúp anh bó hoa xin lỗi được không?',
        request: { type: 'bouquet', min: 4, max: 6, tone: 'cool', meaning: 'apology', occasionText: 'xin lỗi cô Mai' },
        thanks: 'Cô ấy hết giận rồi, còn bảo lần sau quên nữa là phạt anh rửa bát. Tulip trắng nghĩa là xin lỗi chân thành, em giỏi thật!',
        reward: { coins: 300, reveal: ['tulip:white', 'rose:yellow'], ribbons: { pink: 3 } },
      },
      {
        intro: 'Anh... anh định cầu hôn cô Mai vào cuối tuần này! Bó hoa phải thật hoành tráng và nói được rằng anh sẽ bên cô ấy cả đời.',
        request: { type: 'bouquet', min: 7, max: 9, tone: 'warm', meaning: 'loyalty', occasionText: 'cầu hôn cô Mai', minQuality: 2 },
        thanks: 'CÔ ẤY ĐỒNG Ý RỒI EM ƠI! Bọn anh sẽ cưới vào mùa thu. Em phải nhận làm hoa cưới cho bọn anh đấy nhé!',
        reward: { coins: 600, xp: 50, papers: { lace: 3 }, reveal: ['lavender:purple'] },
      },
      {
        intro: 'Ngày trọng đại tới rồi! Em làm giúp bọn anh hoa cưới nhé: vừa trong sáng, vừa ngập tràn yêu thương.',
        request: { type: 'bouquet', min: 9, max: 12, tone: 'pastel', meaning: 'love', occasionText: 'làm hoa cưới cho anh Duy và cô Mai', minQuality: 2 },
        thanks: 'Mọi người khen hoa cưới đẹp nhất đảo! Cô Mai bảo nhất định phải mời em làm khách danh dự. Cảm ơn em đã cùng anh đi hết chặng đường này.',
        reward: { coins: 1500, xp: 120, seeds: { 'hydrangea:white': 2 }, reveal: ['hydrangea:white', 'hydrangea:pink'] },
      },
    ],
  },

  be_su: {
    name: 'Bé Su', self: 'con', minLevel: 1,
    look: { skin: '#ffe0c7', hair: '#6b4433', outfit: '#ffd34e', hat: '#f6a6b9' },
    bio: 'Cô bé 8 tuổi, mẹ đang nằm viện. Su để dành tiền ăn sáng để mua hoa cho mẹ.',
    chapters: [
      {
        intro: 'Chị ơi, mẹ con đang nằm viện. Con muốn mang hoa hướng dương cho mẹ, vì mẹ bảo hướng dương lúc nào cũng nhìn về phía mặt trời.',
        request: { type: 'multi', flower: 'sunflower', count: 2, minQuality: 1 },
        thanks: 'Mẹ cười rồi chị ơi! Mẹ bảo hướng dương là hy vọng. Con sẽ đến nữa nha!',
        reward: { coins: 100, reveal: ['sunflower:yellow'], items: { medicine: 2 } },
      },
      {
        intro: 'Bác sĩ bảo mẹ cần nghỉ ngơi thật nhiều. Chị làm bó hoa chúc mẹ mau khỏe giúp con nha.',
        request: { type: 'bouquet', min: 3, max: 5, tone: 'warm', meaning: 'hope', occasionText: 'chúc mẹ mau khỏe, luôn hy vọng' },
        thanks: 'Mẹ đỡ hơn nhiều rồi! Cô y tá còn khen hoa đẹp. Con tặng chị mấy hạt oải hương trắng mà bà ngoại cho con, bà bảo nó mang nghĩa sức khỏe bình an.',
        reward: { coins: 150, seeds: { 'lavender:white': 2 }, reveal: ['lavender:white'] },
      },
      {
        intro: 'Cô y tá Hạnh chăm mẹ con rất chu đáo, còn kể chuyện cổ tích cho con nghe. Con muốn cảm ơn cô ấy!',
        request: { type: 'bouquet', min: 3, max: 5, tone: 'pastel', meaning: 'gratitude', occasionText: 'cảm ơn cô y tá Hạnh' },
        thanks: 'Cô Hạnh ôm con một cái thật chặt! Cô bảo cẩm tú cầu xanh nghĩa là biết ơn đó chị.',
        reward: { coins: 200, reveal: ['hydrangea:blue', 'daisy:blue'], papers: { pink: 3 } },
      },
      {
        intro: 'MẸ CON ĐƯỢC XUẤT VIỆN RỒI! Chị làm bó hoa thật vui thật rực rỡ để đón mẹ về nhà nha!',
        request: { type: 'bouquet', min: 4, max: 7, tone: 'warm', meaning: 'joy', occasionText: 'đón mẹ xuất viện' },
        thanks: 'Cả nhà con ai cũng vui! Mẹ bảo sẽ làm bánh tặng chị. Con thương chị nhất trên đời!',
        reward: { coins: 300, seeds: { 'sunflower:orange': 3 }, reveal: ['sunflower:orange'] },
      },
      {
        intro: 'Mẹ con mở tiệm bánh nhỏ cạnh trường rồi chị ơi! Chị làm hoa chúc mừng khai trương giúp con với.',
        request: { type: 'bouquet', min: 5, max: 8, tone: 'warm', meaning: 'congrats', occasionText: 'mừng tiệm bánh của mẹ khai trương' },
        thanks: 'Tiệm bánh đông khách lắm! Mẹ bảo từ nay mỗi sáng sẽ để phần chị một cái bánh. Chị là người bạn tốt nhất của con!',
        reward: { coins: 800, xp: 80, items: { fertilizer: 8, medicine: 5 }, reveal: ['hydrangea:white'] },
      },
    ],
  },

  co_ngan: {
    name: 'Cô Ngân', self: 'cô', minLevel: 3,
    look: { skin: '#e8b48f', hair: '#8a5a3b', outfit: '#d9b48a', hat: '#ffffff', bun: true },
    bio: 'Chủ quán cà phê "Mây" bên bờ biển, thích những gì mộc mạc, mang hương vị quê nhà.',
    chapters: [
      {
        intro: 'Quán cà phê của cô vừa mở. Cô cần mấy bó hoa nhỏ mộc mạc để trên bàn, nhìn vào là thấy vui.',
        request: { type: 'bouquet', min: 3, max: 5, tone: 'natural', meaning: 'joy', occasionText: 'để bàn quán cà phê' },
        thanks: 'Khách khen quán xinh hẳn lên! Cô sẽ ghé thường xuyên đấy, nhớ để phần cô hoa đẹp nhé.',
        reward: { coins: 300, papers: { cream: 5 }, ribbons: { white: 5 } },
      },
      {
        intro: 'Tối nay quán có buổi gặp mặt hội bạn cũ của cô, hai mươi năm rồi mới gặp lại. Cô muốn một bó thật ấm áp.',
        request: { type: 'bouquet', min: 4, max: 6, tone: 'natural', meaning: 'friendship', occasionText: 'cho buổi họp lớp' },
        thanks: 'Cả đám bạn cũ cứ chụp ảnh bó hoa mãi! Cảm ơn cháu nhiều nhé.',
        reward: { coins: 400, reveal: ['rose:yellow', 'tulip:yellow'] },
      },
      {
        intro: 'Quán cô sắp mở thêm chi nhánh thứ hai! Cô cần bó hoa thật sang để chúc mừng ngày khai trương.',
        request: { type: 'bouquet', min: 6, max: 9, tone: 'warm', meaning: 'congrats', occasionText: 'khai trương chi nhánh mới', minQuality: 2 },
        thanks: 'Khai trương suôn sẻ lắm! Cô gửi cháu chút hoa hồng để cảm ơn.',
        reward: { coins: 700, items: { cover: 3 }, reveal: ['sunflower:orange'] },
      },
      {
        intro: 'Dạo này cô nhớ quê quá... Ngày xưa quê cô có cánh đồng oải hương tím ngắt. Cháu làm cho cô một bó gợi nhớ quê nhà nhé.',
        request: { type: 'bouquet', min: 4, max: 7, tone: 'cool', meaning: 'longing', occasionText: 'gợi nhớ quê nhà' },
        thanks: 'Nhìn bó hoa mà cô rưng rưng... Cảm ơn cháu đã hiểu cô. Cô có ít hạt quý mang từ quê lên, cháu giữ lấy.',
        reward: { coins: 800, seeds: { 'lavender:pink': 1, 'hydrangea:purple': 2 }, reveal: ['lavender:pink'] },
      },
      {
        intro: 'Cô muốn ký hợp đồng lâu dài với tiệm của cháu: mỗi tuần hoa cho cả hai quán! Bó đầu tiên phải thật hoàn hảo nhé.',
        request: { type: 'bouquet', min: 8, max: 12, tone: 'natural', meaning: 'joy', occasionText: 'đơn hàng đầu tiên của hợp đồng', minQuality: 2 },
        thanks: 'Tuyệt vời! Từ giờ cháu là đối tác hoa chính thức của quán Mây. Cô tin tiệm hoa của cháu sẽ nổi tiếng khắp vùng!',
        reward: { coins: 2000, xp: 150, items: { fertilizer: 10 }, reveal: ['hydrangea:mint'] },
      },
    ],
  },
};
