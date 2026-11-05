// =============================================================
//  GHI CHÚ BẢN CẬP NHẬT — hiện cho người chơi khi có bản mới
//  Mỗi lần phát hành: tăng "version" trong package.json rồi thêm 1 mục lên ĐẦU danh sách.
// =============================================================
export const CHANGELOG = [
  {
    version: '0.18.0',
    notes: [
      '🏅 14 thành tựu, mỗi cái 3 huy chương 🥉🥈🥇 có thưởng (tiền, vé, mảnh) · đạt 🥈 mở DANH HIỆU — bạn bè thấy khi ghé thăm',
      '📅 Sự kiện tuần theo ngày thật (giờ VN): mỗi tuần 1 chủ đề (Tuần lễ Hoa Hồng, Nắng Vàng, Pastel...), tích điểm qua 5 mốc quà, về đích nhận đồ trang trí độc quyền',
      '🏪 Nâng quy mô tiệm 4 bậc: Tiệm nhỏ → Cửa hàng hoa → Tiệm hoa lớn → Chuỗi tiệm Giấc Mơ — tiệm to đẹp dần, khách trả cao hơn, có khách 👑 VIP',
      'Tất cả nằm trong bảng 📋 Nhiệm vụ (thẻ Sự kiện, Thành tựu) và Chợ › Nâng cấp',
    ],
  },
  {
    version: '0.17.0',
    notes: [
      '🥀 Độ tươi: hoa nở để quá 6 giờ không hái sẽ héo dần và mất sao · ✨ hái trong "giờ vàng" (2 giờ đầu) có 30% cơ hội +1⭐',
      '🐛 Bắt sâu: sâu bò lên luống lúc bạn đang chơi — chạm để bắt lấy tiền, bắt liên tiếp được combo, hiếm có 🐞 bọ rùa vàng tặng 🧩',
      '🟫 Độ màu đất & 🔄 luân canh: trồng mãi 1 loài đất bạc màu (lớn chậm, khó 3⭐); đổi loài thì lớn nhanh, hoa đẹp hơn; dọn cây héo ủ thành phân',
      '📦 Đơn hàng lớn có hạn chót (từ cấp 3): tiệc cưới, khai trương... thưởng lớn + có thể kèm 🎟️ · 🔥 combo thu hoạch nhanh · 🧬 2% rơi hạt đột biến màu lạ',
    ],
  },
  {
    version: '0.16.0',
    notes: [
      '⚖️ Cân bằng lại game: lên cấp chậm hơn ~3 lần, đồ trong Chợ đắt hơn (nâng cấp, đất, nhà kính, máy móc, trang trí, hạt giống)',
      '🍀 Vận May hiếm hơn thật sự: Gói Vàng 3% ra Cây Vận May, bảo hiểm 50 lần (trước 10); vé vàng chỉ khi xong đủ 3 nhiệm vụ tuần hoặc mỗi 5 cấp',
      '🏪 Khách đến thưa hơn một chút, hoa 3⭐ bán ×1,6 (trước ×1,8), bán sỉ 40% giá — chăm khách ở tiệm quan trọng hơn',
      '🪡 Mini game Xỏ kim dễ hơn: kim chạy chậm, lỗ kim to, thêm 1 lượt',
    ],
  },
  {
    version: '0.15.3',
    notes: [
      '📱 Các bảng trên điện thoại gọn hơn, hầu như không phải kéo: bảng rộng ra, món xếp nhiều cột',
      'Bảng có thẻ (Chợ, Sổ tay, Vận May, Kho đồ...): tên bảng và các thẻ nằm ở cột trái, nội dung bên phải',
      '💐 Gói bó hoa chia 2 cột: yêu cầu của khách bên trái, chọn hoa bên phải, nút Gói & giao luôn ở dưới',
      '🎒 Kho đồ chia thẻ Hoa / Hạt giống / Giấy gói / Vật phẩm · 📖 Sổ tay chọn từng loài hoa để xem · Cài đặt & Dự báo 2 cột',
    ],
  },
  {
    version: '0.15.2',
    notes: [
      '📱 Giao diện điện thoại gọn hơn: các nút bên trái nhỏ lại, xếp 2 cột dưới ví tiền',
      '☰ Nút thu gọn / mở cột nút bên trái (game nhớ lựa chọn); khi thu gọn mà có việc cần làm thì nút ☰ hiện chấm đỏ',
      'Thanh công cụ dưới cùng nhỏ và vừa khít các nút; thanh chọn hạt 1 hàng, vuốt ngang khi nhiều hạt',
    ],
  },
  {
    version: '0.15.1',
    notes: [
      '🔧 Sửa lỗi không chạm được Cô Ngân khi cô đang bán cà phê trước Quán Mây',
      'Chạm vào Quán Mây lúc Cô Ngân đang bán hàng: có nút 💬 Nói chuyện ngay',
      'Hai dân làng đứng sát nhau (tán gẫu ở giếng): chạm vào ai thì chọn đúng người đó',
    ],
  },
  {
    version: '0.15.0',
    notes: [
      '🍀 Vận May: mở 🎁 Gói Thường (cấp 2) và 🌟 Gói Vàng (cấp 4) bằng vé hoặc tiền trong game — có bảng tỉ lệ công khai đầy đủ',
      '🌈 5 Cây Vận May có hiệu ứng động: 💎 Hoa Pha Lê lấp lánh, ✨ Hoa Đom Đóm sáng về đêm, 🌈 Hoa Cầu Vồng đổi màu, 🔥 Hoa Lửa Ma lập lòe, ❄️ Hoa Tuyết rơi tuyết',
      '🛡️ Bảo hiểm: mở 10 Gói Vàng chắc chắn có Cây Vận May, 10 Gói Thường chắc chắn có quà Hiếm · 🧩 mảnh từ đồ trùng đổi được món mình muốn',
      '🎟️ Vé kiếm từ: quà mỗi ngày, lên cấp, nhiệm vụ ngày/tuần, giúp dân làng 3⭐ · 3 đồ trang trí độc quyền: cỏ bốn lá, mèo vẫy tay, đèn ngôi sao',
    ],
  },
  {
    version: '0.14.0',
    notes: [
      '🌱 6 loài hoa mới: 🌸 Sao nhái, 💮 Cẩm chướng, 🏵️ Cúc vạn thọ, 🪷 Hoa ly, 🌺 Mẫu đơn, 🪻 Lan hồ điệp (chỉ trồng trong 🏠 nhà kính) — kèm 24 màu mới để lai tạo',
      '🦠 3 bệnh mới: 🪲 Sâu đục nụ (hoa mất 1⭐), 🍂 Vàng lá (bón phân là khỏi), 🐌 Ốc sên (chỉ ngày mưa, 19:00 — che bạt là không bị)',
      '🌦️ 5 thời tiết mới: 🧊 Mưa đá, 🌬️ Gió lớn (gãy cây thân cao, thổi bay bạt), 🌫️ Sương mù, 🌈 Cầu vồng (thu hoạch có thể +1⭐), 🌠 Mưa sao băng (tặng hạt màu hiếm)',
      'Sửa lỗi tuyết và cánh hoa bay không hiện trên màn hình; hoa mới có mặt trong lễ hội Tết, 8/3, Mùa cưới, 20/10, Bí Ngô, 20/11',
    ],
  },
  {
    version: '0.13.0',
    notes: [
      '🗺️ Mua đất của dân làng: 4 mảnh đất quanh nông trại của Bà Tư, Ông Ba, Cô Ngân, thầy Duy — mỗi mảnh thêm 9 ô trồng hoa',
      'Chủ đất chỉ bán khi đủ thân; giá đổi mỗi ngày theo số tim và tâm trạng (vui, bình thường, khó tính, có hôm không muốn bán)',
      '💬 Trả giá mỗi ngày 1 lần: thành công bớt thêm 10%, hỏng thì chủ đất phật ý và hôm đó không bán',
      'Đồ trang trí lỡ đặt trên mảnh đất được trả về kho khi mua',
    ],
  },
  {
    version: '0.12.1',
    notes: [
      '🙏 Dân làng nhờ việc: thấy 🙏 trên đầu ai thì chạm vào để giúp — mỗi việc là 1 mini game',
      '7 mini game: 🪡 xỏ kim (Bà Tư), 🎣 câu cá & 🔨 đóng đinh (Ông Ba), ☕ pha cà phê muối (Cô Ngân), 🧮 chấm bài toán (Thầy Duy), 📝 ghép vần thơ (Cô Mai), 🃏 lật thẻ hoa (Bé Su)',
      'Làm càng giỏi (tối đa 3⭐) càng được nhiều tình thân và tiền công',
    ],
  },
  {
    version: '0.12.0',
    notes: [
      '💞 Kết thân với 6 dân làng: thanh tình thân 10 ❤️, trò chuyện và tặng hoa mỗi ngày',
      'Chọn câu trả lời khéo thì tăng tình thân, nói sai thì giảm; mỗi người có hoa thích / ghét riêng và ngày sinh nhật (quà × 2)',
      '✨ 24 sự kiện tình thân có lựa chọn rẽ nhánh — giúp thầy Duy tỏ tình với cô Mai, sửa quán cho cô Ngân, ra biển cùng Ông Ba...',
      'Quà khi đạt 3, 5, 7, 10 ❤️ (hạt quý, đồ trang trí); gõ cửa hỏi thăm khi chủ nhà ở nhà; Sổ tay có thêm tab Dân làng',
    ],
  },
  {
    version: '0.11.0',
    notes: [
      '🏘️ Làng Hoa: đảo mở rộng về phía nam với 6 ngôi nhà, trường làng, quảng trường có giếng, quán cà phê Mây và cầu tàu',
      'Dân làng sống theo giờ: tưới vườn, đi dạy, đi học, câu cá, uống cà phê, ra ngắm vườn hoa của bạn; tối bật đèn, khuya đi ngủ',
      'Chạm vào dân làng để nghe họ chào và xem đang làm gì; chạm vào nhà để xem chủ nhà có ở nhà không',
      'Nút 🏘️ để đi nhanh tới làng; đặt đồ trang trí được cả trong làng',
    ],
  },
  {
    version: '0.10.0',
    notes: [
      'Trang trí TỰ DO: đặt đồ ở bất kỳ đâu quanh nông trại, tiệm và chợ; kéo để dời, xoay, cất vào kho',
      '🎃 Lễ hội Bí Ngô: 8 món Halloween (đèn bí ngô, bù nhìn ma, nồi phù thủy, cột dơi bay, nhà bí ngô...) bán trong Mùa Thu',
      'Ngày cuối Mùa Thu là Lễ hội Bí Ngô: khách thích hoa hướng dương & oải hương, trả giá cao hơn',
      'Đồ đã đặt ở bản cũ được giữ nguyên chỗ',
    ],
  },
  {
    version: '0.9.7',
    notes: [
      'Sửa lỗi chạm không chính xác / chạm không phản hồi ở một số chỗ trên ruộng',
      'Chạm vào khe giữa các ô đất sẽ chọn ô gần nhất',
      'Thông báo "Hoa chưa nở" cho biết còn bao lâu nữa hoa nở',
    ],
  },
  {
    version: '0.9.6',
    notes: [
      'Bạt che và kính nhà kính trong mờ: phóng to để nhìn rõ hoa bên dưới',
      'Chạm vào ô đất trong lô có bạt che thì bạt mờ đi để xem cây',
    ],
  },
  {
    version: '0.9.5',
    notes: [
      'App Android chơi toàn màn hình: ẩn thanh trạng thái và thanh điều hướng (vuốt từ mép màn hình để hiện tạm)',
      'Nút trong game không bị "tai thỏ" / lỗ camera che khi cầm ngang',
    ],
  },
  {
    version: '0.9.4',
    notes: [
      'Intro DREAMER GAMES mới: trời đêm đầy sao chuyển sang bình minh, sao hóa cánh hoa rồi vào thẳng nông trại',
      'Intro hiện ngay khi mở game, không cần chạm để bắt đầu',
    ],
  },
  {
    version: '0.9.3',
    notes: [
      'Game chơi ở màn hình ngang',
      'App Android: có bản mới thì bắt buộc tải về để chơi tiếp (tiến độ vẫn giữ nguyên)',
    ],
  },
  {
    version: '0.9.2',
    notes: [
      'Có nhạc nền: 3 bài phát lần lượt, chỉnh âm lượng hoặc chuyển bài trong ⚙️ Cài đặt',
      'Hiệu ứng cánh hoa và tiếng "tách" khi chạm',
      'Video intro khi mở game (tắt được trong Cài đặt)',
    ],
  },
  {
    version: '0.9.1',
    notes: [
      'Mở tài khoản online: đăng ký / đăng nhập bằng email, lưu tiến độ lên mạng',
      'Chơi cùng bạn bè: thăm nông trại, tặng quà, tưới giúp, sổ lưu bút',
      'Bảng xếp hạng và cuộc thi hoa hằng tuần',
    ],
  },
  {
    version: '0.9.0',
    notes: [
      'Thông báo khi có bản cập nhật mới',
      'Cài game lên màn hình chính như ứng dụng, chơi được khi mất mạng',
      'Tự giảm đồ họa khi máy chạy chậm, thêm cài đặt chất lượng đồ họa',
      'Có bản ứng dụng Android (APK)',
    ],
  },
];
