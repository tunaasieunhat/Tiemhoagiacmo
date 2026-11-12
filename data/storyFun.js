// =============================================================
//  🎡 MẠCH TRUYỆN NGẮN "NGƯỜI DỰNG ĐU QUAY" (GĐ26) — 3 chương, mở Khu Vui Chơi
//  Cú pháp như data/story.js. Bước đếm: count: { buds: 'booths' (lượt chơi quầy) | 'rides' (lượt đi trò chơi lớn) | 'snacks' (món ăn vặt đã bán), n }
//  Dấu: fun_open (mở Khu Vui Chơi) · fun_kha_stay | fun_kha_go (chú Kha ở lại / đi tiếp)
// =============================================================

export const FUN_CAST = {
  chu_kha: { name: 'Chú Kha', pitch: 300, look: { skin: '#e6b48c', hair: '#8a8a8a', outfit: '#c84a4a', hat: '#3b2a22', hatKind: 'beret', top: 'overall', trim: '#fff3e0' }, color: '#c84a4a' },
  kha_tre: { name: 'Kha (20 tuổi)', pitch: 420, look: { skin: '#e6b48c', hair: '#2a1f1c', outfit: '#c84a4a', hat: null, top: 'overall', trim: '#fff3e0' }, color: '#c84a4a' },
  be_lan: { name: 'Bé Lan', pitch: 1080, look: { skin: '#f8d4b8', hair: '#3b2a2a', outfit: '#ffd36e', hat: null, hairStyle: 'twin' }, color: '#e0a21a' },
};

export const FUN_ARC = { name: 'Người dựng đu quay', icon: '🎡', desc: 'Khu vui chơi bỏ dở ở mũi đông bắc, và người thợ già quay lại để làm cho xong.' };

const GATE = [14.6, 1.8, -16.4], WHEEL = [27.2, 1.8, -25.6], CENTER = [24, 1.8, -21];

export const FUN_CHAPTERS = [
  {
    id: 'f1', arc: 'fun', n: 1, title: 'Đu quay đứng yên', need: { level: 6 },
    intro: 'Ở mũi đông bắc có một vòng đu quay sơn hồng đứng yên đã nhiều năm. Hôm nay có tiếng búa gõ ở đó.',
    steps: [
      { goal: 'Hỏi Ông Ba về khu vui chơi bỏ dở', triggers: [{ scene: 'f1_ba', via: 'villager', who: 'ong_ba', label: 'Khu vui chơi bỏ dở' }] },
      { goal: 'Ra cổng Khu Vui Chơi (mũi đông bắc), chạm 🎡 để góp tiền sửa (3.000 💰)', triggers: [{ scene: 'f1_gate', via: 'spot', at: GATE, icon: '🎡', cost: 3000 }] },
    ],
    reward: { coins: 1500, xp: 160, luck: 1 },
    outro: 'Đu quay lại quay. Khu Vui Chơi chính thức mở cửa — 8 giờ sáng đến 10 giờ đêm.',
  },
  {
    id: 'f2', arc: 'fun', n: 2, title: 'Tiếng cười', need: { after: 'f1' },
    intro: 'Chú Kha nói một khu vui chơi chỉ thật sự sống khi có tiếng cười.',
    steps: [
      { goal: 'Chơi 3 lượt ở các quầy trò chơi (ném vòng, bắn bóng, câu vịt…)', triggers: [], count: { buds: 'booths', n: 3 } },
      { goal: 'Đi 1 trò chơi lớn (đu quay, ngựa gỗ, tàu lượn hoặc nhà gương)', triggers: [], count: { buds: 'rides', n: 1 } },
      { goal: 'Bán 3 món ở quầy ăn vặt (làm kẹo bông, kem… từ hoa)', triggers: [], count: { buds: 'snacks', n: 3 } },
      { goal: 'Gặp chú Kha ở chân đu quay, chạm 💬', triggers: [{ scene: 'f2_kha', via: 'spot', at: WHEEL, icon: '💬' }] },
    ],
    reward: { coins: 2500, xp: 220, luck: 1 },
    outro: 'Chú Kha nhờ bạn một việc cuối: thắp đèn cho đêm lễ hội.',
  },
  {
    id: 'f3', arc: 'fun', n: 3, title: 'Đêm đèn lồng', need: { after: 'f2' },
    intro: 'Tối nay Khu Vui Chơi thắp hết đèn. Chú Kha đứng ở giữa quảng trường, tay cầm một chiếc vé cũ.',
    steps: [
      { goal: 'Buổi tối, ra giữa Khu Vui Chơi, chạm 🏮', triggers: [{ scene: 'f3_night', via: 'spot', at: CENTER, icon: '🏮', night: true }] },
    ],
    reward: { coins: 3500, xp: 300, luck: 2, outfit: 'top_festival' },
    outro: 'Từ nay mỗi tối Thứ Bảy là Lễ hội Đảo Mây: đèn sáng gấp đôi, khách đông gấp đôi ở quầy ăn vặt.',
  },
];

export const FUN_SCENES = {
  f1_ba: { title: 'Khu vui chơi bỏ dở', lines: [
    ['fx', 'dark', true],
    ['title', 'Người dựng đu quay · Chương 1', 'Đu quay đứng yên'],
    ['meet', 'ong_ba'],
    ['fx', 'dark', false],
    ['you', 'Ông Ba ơi, cái đu quay hồng ở mũi đông bắc là của ai vậy ạ? Sáng nay cháu nghe có tiếng búa.'],
    ['ong_ba', 'surprised', 'Tiếng búa? Thằng Kha về rồi à?'],
    ['ong_ba', 'think', 'Ba mươi năm trước, có một anh thợ trẻ tên Kha đi theo gánh xiếc ghé đảo. Ảnh mê đảo mình quá, ở lại dựng khu vui chơi cho tụi nhỏ.'],
    ['ong_ba', 'sad', 'Dựng được đu quay với ngựa gỗ thì hết tiền. Gánh xiếc nhổ neo, ảnh đi theo. Đi mà không kịp chào ai.'],
    ['choice', [
      { t: 'Để cháu ra xem thử.', fp: { ong_ba: 10 }, go: 'a' },
      { t: 'Ông có giận chú ấy không?', fp: { ong_ba: 15 }, remember: 'ong_ba', go: 'b' },
    ]],
    ['label', 'b'],
    ['ong_ba', 'think', 'Giận gì. Tụi nhỏ hồi đó, đứa nào cũng được ngồi đu quay một lần trước khi nó đứng luôn. Một lần cũng là nhiều rồi.'],
    ['label', 'a'],
    ['ong_ba', 'Cháu ra đi. Nếu đúng là nó thì nói giùm ông: ông còn giữ cái vé số 1.'],
    ['nar', 'Kéo bản đồ về phía đông bắc, chạm 🎡 ở cổng Khu Vui Chơi.'],
    ['end'],
  ] },

  f1_gate: { title: 'Người thợ già', lines: [
    ['fx', 'dark', true],
    ['place', 'you', 12.6, -15.6, [14.4, -17.2]],
    ['place', 'chu_kha', 14.4, -17.4, 'you'],
    ['cam', [13.8, -16.6], 1.6],
    ['fx', 'dark', false],
    ['nar', 'Một ông chú tóc bạc, đội mũ nồi đỏ, đang leo thang lau từng bóng đèn trên cổng.'],
    ['chu_kha', 'surprised', 'Ô, khách! Xin lỗi nha, khu chưa mở. Ba mươi năm rồi chưa mở.'],
    ['you', 'Chú là chú Kha phải không ạ? Ông Ba nhờ cháu nói: ông còn giữ cái vé số 1.'],
    ['chu_kha', 'cry', '…Thằng Ba. Nó còn giữ hả.'],
    ['chu_kha', 'think', 'Chú về đây để làm cho xong. Đu quay thì còn tốt, chỉ thiếu cái mô-tơ với ít sơn. Ngựa gỗ cần thay trục. Mà chú… hết tiền rồi. Như hồi đó.'],
    ['choice', [
      { t: '(Góp 3.000 💰) Cháu góp. Mình làm cho xong nhé chú.', go: 'z', fp: { ong_ba: 10 } },
    ]],
    ['label', 'z'],
    ['set', 'fun_open'],
    ['nar', 'Ba ngày sau. Mô-tơ mới chạy êm. Ngựa gỗ được sơn lại. Chú Kha dựng thêm năm quầy trò chơi, một xe ăn vặt và một quầy đổi quà toàn gấu bông.'],
    ['chu_kha', 'happy', 'Xong! Cháu chơi thử đi. Mỗi quầy trò chơi trả Xu Vui 🪙, gom Xu Vui đổi quà ở quầy gấu bông.'],
    ['chu_kha', 'Còn xe ăn vặt thì cháu làm chủ luôn. Chú già rồi, nhìn hoa thì biết đẹp chứ không biết nấu.'],
    ['nar', '🎡 Khu Vui Chơi đã mở! Chạm vào đu quay, ngựa gỗ, tàu lượn, nhà gương để chơi · chạm các quầy để chơi mini game · 🍡 quầy ăn vặt: làm kẹo bông, kem, trà sữa… từ hoa để bán cho khách · 🎁 quầy quà: đổi Xu Vui lấy trang phục, trứng thú cưng.'],
    ['end'],
  ] },

  f2_kha: { title: 'Tiếng cười', lines: [
    ['fx', 'dark', true],
    ['title', 'Người dựng đu quay · Chương 2', 'Tiếng cười'],
    ['place', 'you', 25.4, -23.8, [28.6, -27.4]],
    ['place', 'chu_kha', 26.8, -24.6, 'you'],
    ['place', 'be_lan', 24.8, -25.2, [28.6, -27.4]],
    ['cam', [26.4, -25.2], 1.5],
    ['fx', 'dark', false],
    ['be_lan', 'happy', 'Chú ơi chú, con chơi đu quay ba lần rồi! Lần sau con lên trên cùng hét to nữa!'],
    ['chu_kha', 'happy', 'Ừ, hét to vào. Đu quay mà không có tiếng hét thì buồn lắm.'],
    ['chu_kha', 'think', 'Cháu nghe không? Ba mươi năm chú đi khắp nơi, dựng cả chục khu vui chơi to gấp mười. Mà chưa chỗ nào chú nghe tiếng cười giống ở đây.'],
    ['you', 'Sao chú không về sớm hơn ạ?'],
    ['chu_kha', 'sad', 'Vì ngại. Đi không chào ai, về thì lấy mặt mũi nào. Chú cứ nghĩ cả đảo quên chú rồi.'],
    ['choice', [
      { t: 'Ông Ba chưa bao giờ quên chú.', go: 'a' },
      { t: 'Giờ chú về rồi, ở lại luôn đi chú.', go: 'b', set: 'fun_ask_stay' },
    ]],
    ['label', 'a'],
    ['chu_kha', 'cry', 'Ừ. Cái vé số 1. Thằng Ba nó ngồi ghế đầu tiên, khóc vì sợ độ cao mà không chịu xuống.'],
    ['go', 'z'],
    ['label', 'b'],
    ['chu_kha', 'think', 'Ở lại… Để chú nghĩ. Gánh xiếc của chú còn đợi ở cảng lớn.'],
    ['label', 'z'],
    ['chu_kha', 'Tối nào đó cháu ra đây. Chú muốn thắp hết đèn một lần, cho đúng như cái hồi chú vẽ trên giấy.'],
    ['end'],
  ] },

  f3_night: { title: 'Đêm đèn lồng', lines: [
    ['fx', 'dark', true],
    ['title', 'Người dựng đu quay · Chương 3', 'Đêm đèn lồng'],
    ['place', 'you', 22.6, -18.8, [24, -21]],
    ['place', 'chu_kha', 24.2, -20.4, 'you'],
    ['place', 'ong_ba', 25.4, -19.4, 'chu_kha'],
    ['cam', [24, -20.4], 1.4],
    ['fx', 'dark', false],
    ['nar', 'Đêm. Từng dây đèn bật sáng, chạy vòng quanh khu như một dòng sông nhỏ. Đu quay sáng lên hồng và vàng.'],
    ['ong_ba', 'Kha.'],
    ['chu_kha', 'surprised', 'Ba…'],
    ['ong_ba', 'happy', 'Cái vé số 1. Mày nợ tao một vòng đu quay. Hồi đó tao khóc nên mày cho tao xuống giữa chừng.'],
    ['chu_kha', 'cry', 'Ừ. Lên đi. Lần này tao cho mày ngồi tới sáng.'],
    ['fx', 'sepia', true],
    ['hide', 'chu_kha'],
    ['place', 'kha_tre', 24.2, -20.4, [28.6, -27.4]],
    ['nar', 'Ba mươi năm trước. Anh thợ trẻ đứng đúng chỗ này, cầm bản vẽ khu vui chơi, nói với bọn nhỏ: “Rồi mai mốt chỗ này sẽ sáng đèn tới sáng!”'],
    ['kha_tre', 'happy', 'Có đu quay, có ngựa gỗ, có tàu lượn hình con ong! Tối thứ Bảy nào cũng là lễ hội!'],
    ['fx', 'sepia', false],
    ['hide', 'kha_tre'],
    ['place', 'chu_kha', 24.2, -20.4, 'you'],
    ['chu_kha', 'think', 'Hồi đó chú hứa “tối thứ Bảy nào cũng là lễ hội”. Giờ chú mới làm được.'],
    ['choice', [
      { t: 'Chú ở lại trông khu vui chơi nhé.', set: 'fun_kha_stay', go: 'stay' },
      { t: 'Chú đi tiếp với gánh xiếc đi. Khu này cháu trông giùm.', set: 'fun_kha_go', go: 'go' },
    ]],
    ['label', 'stay'],
    ['chu_kha', 'happy', 'Ừ. Chú già rồi, đi đủ rồi. Chú ở lại tra dầu cho đu quay, kể chuyện xiếc cho tụi nhỏ.'],
    ['go', 'z'],
    ['label', 'go'],
    ['chu_kha', 'happy', 'Cháu hiểu chú ghê. Chú đi một vòng nữa, mùa sau ghé. Tối thứ Bảy nhớ thắp đèn giùm chú.'],
    ['label', 'z'],
    ['nar', 'Chú Kha tặng bạn chiếc áo lễ hội Đảo Mây (vào 🎀 Phong cách để mặc). Từ nay mỗi tối Thứ Bảy (18–22h) là Lễ hội Đảo Mây!'],
    ['end'],
  ] },
};

export const FUN_LINES = {
  ong_ba: [{ if: 'fun_open&!f3_night', lines: ['Thằng Kha nó sơn lại đu quay rồi đó. Màu hồng y như hồi xưa.'] }, { if: 'f3_night', lines: ['Tối qua tao ngồi đu quay tới khuya. Lạnh mà vui.'] }],
  be_su: [{ if: 'fun_open', lines: ['Chị ơi, em ném vòng trúng chai vàng rồi! Được 2 điểm luôn!', 'Mẹ em không cho ăn kẹo bông nhiều. Mà kẹo bông hoa hồng thơm quá trời.'] }],
};
