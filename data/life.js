// =============================================================
//  👪 CON NGƯỜI & HỆ QUẢ
//  1) Quyết định làng: lựa chọn có giá phải trả, chọn rồi không đổi được, dân làng nhớ mãi.
//  2) Dân làng có cuộc sống riêng: các cặp quen biết – bạn – thân – thích – yêu – cưới – có con, hoặc giận nhau.
//     Bạn có thể LÀM MAI (tặng hoa thay một người) hoặc HÒA GIẢI — nhưng chọn sai hoa thì làm hỏng chuyện.
//  3) Học trò: nhận một đứa trẻ, dạy trồng hoa / cắm hoa / buôn bán. Lớn lên nó mở tiệm: thành ĐỐI TÁC hoặc ĐỐI THỦ.
// =============================================================

export const LIFE_RULES = {
  minLevel: 5,            // cấp mở Đời sống làng
  driftPerDay: 1.5,       // mỗi ngày: cặp đang tốt thì thân thêm, đang giận thì xa thêm
  eventChance: 0.35,      // mỗi ngày: tỉ lệ có 1 chuyện làng tự xảy ra
  newsKeep: 30,           // số tin làng giữ lại
  actGain: 22,            // làm mai / hòa giải thành công: cộng độ thân
  actFail: -18,           // thất bại: trừ độ thân (ngượng, giận)
  baseChance: 0.5,        // tỉ lệ thành công gốc
  heartBonus: 0.05,       // + mỗi tim trung bình của bạn với 2 người
  qualityBonus: 0.08,     // + mỗi sao của bông hoa trên 1★
  fpReward: 25,           // thành công: cả 2 người quý bạn hơn
};

// Mức quan hệ theo độ thân (−100..100). Cặp lãng mạn (romance: true) đi tiếp: thích → yêu → cưới → có con
export const BOND_STEPS = [
  { min: -100, id: 'gian', name: 'Đang giận nhau', icon: '💢' },
  { min: -20, id: 'la', name: 'Xa lạ', icon: '🙂' },
  { min: 15, id: 'ban', name: 'Bạn bè', icon: '🤝' },
  { min: 45, id: 'than', name: 'Bạn thân', icon: '💛' },
];
export const ROMANCE_STEPS = [
  { min: 25, id: 'thich', name: 'Thầm thích nhau', icon: '💓' },
  { min: 60, id: 'yeu', name: 'Đang yêu', icon: '💕' },
  { min: 90, id: 'cuoi', name: 'Đã cưới', icon: '💍', days: 3 },   // ở mức này ≥ 3 ngày mới cưới
  { min: 90, id: 'con', name: 'Có em bé', icon: '👶', days: 10 },   // cưới ≥ 10 ngày thì có em bé
];

// Các cặp: a, b = mã dân làng (data/village.js) · aff: độ thân ban đầu · romance: có thể yêu nhau · need: dấu cốt truyện để cặp xuất hiện
// baby: tên em bé (cặp lãng mạn) · meanings: ý nghĩa hoa hợp để làm mai / hòa giải
export const PAIRS = {
  duy_mai: { a: 'anh_duy', b: 'co_mai', aff: 30, romance: true, baby: 'bé Na', story: 'Hai thầy cô cùng dạy ở trường làng, ai cũng thấy họ hay nhìn nhau ở cổng trường.' },
  ngan_ba: { a: 'co_ngan', b: 'ong_ba', aff: 35, story: 'Ông Ba đóng hết bàn ghế cho quán cà phê Mây. Hai người hay cãi nhau vì… màu sơn.' },
  tu_ba: { a: 'ba_tu', b: 'ong_ba', aff: 55, story: 'Bạn già từ thời con nít, chiều nào cũng ngồi hiên nhà Bà Tư uống trà.' },
  mai_ngan: { a: 'co_mai', b: 'co_ngan', aff: 20, story: 'Cô Mai hay ngồi quán cô Ngân chấm bài, nhưng hai người ít nói chuyện.' },
  su_nhum: { a: 'be_su', b: 'nhum', aff: 0, need: 'co_open', story: 'Bé Su chưa từng gặp Nhum ở Cồn Lặng — hai đứa trẻ cùng tuổi, cùng thích cá.' },
  hai_trieu: { a: 'ong_hai', b: 'trieu', aff: -10, need: 'boat_ready', story: 'Ông Hải gác đèn và cậu Triều trẻ tuổi ở Mũi Én không ưa nhau từ hôm cậu làm vỡ kính đèn.' },
};
export const MATCH_MEANINGS = { romance: ['love', 'longing', 'loyalty'], friend: ['friendship', 'joy', 'gratitude'], mend: ['apology', 'friendship', 'hope'] };

// Chuyện làng tự xảy ra (theo ngày, ngẫu nhiên): pair · cond: 'ban'|'than'|'gian'|'thich'|'yeu'|'any' · delta · text
export const LIFE_EVENTS = [
  { pair: 'ngan_ba', cond: 'than', delta: -60, text: 'Cô Ngân và Ông Ba cãi nhau to ở quán vì cái bàn gỗ sơn sai màu. Hai người không nhìn mặt nhau!' },
  { pair: 'tu_ba', cond: 'than', delta: -35, text: 'Ông Ba quên sửa cái cổng cho Bà Tư như đã hứa. Bà giận, không mời ông uống trà nữa.' },
  { pair: 'duy_mai', cond: 'thich', delta: 10, text: 'Anh Duy giúp cô Mai bê chồng vở về nhà dưới mưa. Cả làng xì xào!' },
  { pair: 'duy_mai', cond: 'yeu', delta: 8, text: 'Người ta thấy anh Duy và cô Mai đi dạo ven biển lúc hoàng hôn.' },
  { pair: 'mai_ngan', cond: 'la', delta: 15, text: 'Cô Mai dạy cô Ngân viết thực đơn bằng thơ lục bát. Khách quán thích lắm!' },
  { pair: 'su_nhum', cond: 'ban', delta: 10, text: 'Bé Su và Nhum thi câu cá ở cầu tàu, Nhum thắng, Su phục lăn.' },
  { pair: 'hai_trieu', cond: 'la', delta: -25, text: 'Cậu Triều lại để thuyền chắn lối lên ngọn hải đăng. Ông Hải cằn nhằn cả buổi.' },
  { pair: 'ngan_ba', cond: 'ban', delta: 12, text: 'Ông Ba đóng tặng quán cô Ngân một cái kệ sách nhỏ. Cô Ngân pha cho ông ly cà phê muối "không tính tiền".' },
  { pair: 'mai_ngan', cond: 'ban', delta: 10, text: 'Cô Ngân mời cô Mai đọc thơ ở quán tối thứ Bảy. Khách vỗ tay rần rần!' },
  { pair: 'tu_ba', cond: 'ban', delta: 10, text: 'Bà Tư đan tặng Ông Ba một chiếc khăn len. Ông quàng suốt cả mùa đông.' },
  { pair: 'hai_trieu', cond: 'ban', delta: 15, text: 'Ông Hải dạy Triều cách đọc mây đoán bão. Hai ông cháu ngồi cùng nhau tới tối.' },
];

// =============================================================
//  ⚖️ QUYẾT ĐỊNH LÀNG — chọn A hoặc B, không chọn lại được
//  effects: coins · fp: { dân: điểm } · pair: { cặp: ±độ thân } · seeds: số hạt ngẫu nhiên · decor: { mã: số }
//           wholesale: { mult, days } (giá bán sỉ tạm thời) · perk: { key, mult } (ưu đãi vĩnh viễn: spawn | wholesale | tips)
//  memory: câu dân làng nhắc lại sau này
// =============================================================
export const DILEMMAS = {
  kho_hang: {
    title: 'Bãi đất sau trường làng', icon: '🏚️', level: 6, day: 4,
    text: 'Một thương lái muốn mua bãi đất trống sau trường làng để xây kho chứa hoa. Anh ta hứa trả hậu cho người đứng ra thuyết phục làng — và sẽ "nể mặt" tiệm bạn khi mua sỉ. Nhưng đó là chỗ bọn trẻ trồng vườn hoa của trường…',
    a: { label: 'Ủng hộ bán đất', effects: { coins: 4000, fp: { anh_duy: -45, co_mai: -45, be_su: -30 }, perk: { key: 'wholesale', mult: 1.06 } },
      result: 'Kho hàng mọc lên. Thương lái mua hoa của bạn giá tốt hơn hẳn. Bọn trẻ thôi không tới vườn trường nữa…',
      memory: { anh_duy: 'Vườn trường giờ là cái kho… Thôi, chuyện qua rồi.', be_su: 'Hồi xưa sau trường có vườn hoa đó, giờ hết rồi.' } },
    b: { label: 'Giữ vườn trường cho bọn trẻ', effects: { fp: { anh_duy: 40, co_mai: 40, be_su: 35 }, seeds: 6, wholesale: { mult: 0.92, days: 5 } },
      result: 'Thương lái bỏ đi, lẩm bẩm "rồi xem". Mấy hôm tới anh ta ép giá hoa sỉ của bạn. Nhưng bọn trẻ tặng bạn một gói hạt giống tự ươm.',
      memory: { anh_duy: 'Nhờ bạn mà vườn trường còn đó. Bọn nhỏ quý bạn lắm.', be_su: 'Chị là người giữ vườn trường đó! Su nhớ mãi!' } },
  },
  quan_mo_rong: {
    title: 'Hàng hoa giấy trước quán', icon: '☕', level: 8, day: 8,
    text: 'Cô Ngân muốn chặt hàng hoa giấy già trước quán cà phê Mây để mở rộng sân, đón thêm khách du lịch. Bà Tư phản đối: hàng hoa ấy do chồng bà trồng từ hồi trẻ. Cả hai đều nhờ bạn nói giúp…',
    a: { label: 'Ủng hộ cô Ngân mở rộng quán', effects: { fp: { co_ngan: 45, ba_tu: -40 }, pair: { ngan_ba: -10 }, perk: { key: 'spawn', mult: 1.06 } },
      result: 'Sân quán rộng thoáng, khách du lịch kéo về đông, ghé luôn tiệm hoa của bạn. Bà Tư thì buồn, không nói gì cả tuần.',
      memory: { ba_tu: 'Hàng hoa giấy của ông nhà bà… thôi, người trẻ phải làm ăn chứ.', co_ngan: 'Quán đông khách là nhờ bạn đó!' } },
    b: { label: 'Giữ hàng hoa giấy của Bà Tư', effects: { fp: { ba_tu: 45, co_ngan: -35 }, decor: { pot: 2 } },
      result: 'Hàng hoa giấy còn nguyên. Bà Tư ôm bạn, tặng hai chậu hoa giâm từ cành của hàng hoa ấy. Cô Ngân hơi giận, ít mời bạn cà phê hơn.',
      memory: { ba_tu: 'Mỗi lần hoa giấy nở là bà lại nhớ tới con.', co_ngan: 'Quán chật thì chật, thôi kệ… nhưng mà tiếc thật.' } },
  },
  xuong_moc: {
    title: 'Lời mời của xưởng mộc thành phố', icon: '🪚', level: 10, day: 12,
    text: 'Một xưởng mộc lớn mời Ông Ba vào thành phố làm thầy dạy nghề, lương cao gấp mười. Ông hỏi ý bạn — người ông tin nhất. Bà Tư thì lặng lẽ ngồi đan, không nói gì.',
    a: { label: 'Khuyên ông nhận lời (làm từ xa, gửi đồ về)', effects: { fp: { ong_ba: 35, ba_tu: -30 }, pair: { tu_ba: -40 }, coins: 1500, perk: { key: 'tips', mult: 1.05 } },
      result: 'Ông Ba nhận dạy nghề từ xa, cuối tuần mới về. Ông gửi biếu tiệm một bộ quầy gỗ mới — khách khen đẹp, bo nhiều hơn. Hiên nhà Bà Tư chiều nào cũng vắng.',
      memory: { ong_ba: 'Mấy đứa học trò thành phố khá lắm! Nhưng ông nhớ cái xưởng nhỏ này.', ba_tu: 'Chiều nào cũng pha hai chén trà, rồi uống một mình.' } },
    b: { label: 'Khuyên ông ở lại với làng', effects: { fp: { ba_tu: 40, ong_ba: 10 }, pair: { tu_ba: 30 }, decor: { bench: 1 } },
      result: 'Ông Ba từ chối, cười khà khà: "Già rồi, đi đâu nữa". Ông đóng tặng bạn một chiếc ghế gỗ. Chiều nay hiên nhà Bà Tư lại có hai chén trà.',
      memory: { ong_ba: 'Không đi là đúng. Ở đây có trà của Bà Tư, có hoa của cháu.', ba_tu: 'Cảm ơn con đã giữ ông bạn già của bà lại.' } },
  },
};

// =============================================================
//  🎓 HỌC TRÒ — nhận 1 đứa trẻ, mỗi ngày dạy 1 buổi (chơi 1 mini game, số sao = tiến bộ)
//  style: hien (dịu dàng: thân hơn, tiến bộ vừa) | nghiem (nghiêm khắc: tiến bộ nhanh, ít thân)
// =============================================================
export const APPRENTICE = {
  minLevel: 9,
  candidates: {
    be_su: { need: null, hearts: 2, desc: 'Hiếu động, thích bướm và màu sắc. Học cắm hoa nhanh.', talent: 'cam' },
    nhum: { need: 'co_open', hearts: 2, desc: 'Lanh lợi, quen buôn bán ở quầy cá. Tính nhẩm siêu nhanh.', talent: 'ban' },
    sen: { need: 'hg_shop', hearts: 2, desc: 'Dịu dàng, mê mùi hương. Chăm cây rất khéo.', talent: 'trong' },
  },
  subjects: {
    trong: { name: 'Trồng hoa', icon: '🌱', game: 'memory' },
    cam: { name: 'Cắm hoa', icon: '💐', game: 'arrange' },
    ban: { name: 'Buôn bán', icon: '💰', game: 'math' },
  },
  styles: {
    hien: { name: 'Dịu dàng', icon: '🤗', skill: 1, bond: 8 },
    nghiem: { name: 'Nghiêm khắc', icon: '📏', skill: 2, bond: -5 },
  },
  talentBonus: 1,         // môn sở trường: +1 tiến bộ mỗi buổi
  graduate: { skill: 40, lessons: 10 },   // đủ cả 2 thì ra nghề, mở tiệm riêng
  partnerBond: 50,        // thân từ mức này ⇒ thành ĐỐI TÁC, dưới ⇒ ĐỐI THỦ
  partner: { coinsPerDay: [80, 200], seedChance: 0.4, tipsMult: 1.05 },
  rival: { spawnMult: 0.92, challengeEvery: 3, winsToMakeUp: 3, prize: 400 },
};
