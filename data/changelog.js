// =============================================================
//  GHI CHÚ BẢN CẬP NHẬT — hiện cho người chơi khi có bản mới
//  Mỗi lần phát hành: tăng "version" trong package.json rồi thêm 1 mục lên ĐẦU danh sách.
// =============================================================
export const CHANGELOG = [
  {
    version: '0.25.2',
    notes: [
      '☁️ Thời tiết làm lại hoàn toàn trong thế giới 3D (không còn là lớp phủ màn hình): có mây bông thật trôi trên đảo, đổ bóng xuống đất',
      '🌧️ Mưa, tuyết, mưa đá rơi từ dưới đám mây — chỗ có mây mới có mưa, thấy từng cột mưa trôi qua đảo. Hạt rơi chạm đất thì bắn bọt nước đúng chỗ đó, rơi xuống biển thành vòng gợn sóng; tuyết nằm lại trên cỏ; mưa đá nảy lên. Nhà và cây phía trước che được hạt phía sau',
      '⚡ Bão: sét đánh xuống từ đúng đám mây bão, chớp chiếu sáng nhà cửa cây cối quanh đó',
      '🌸 Cánh hoa (xuân) và lá (thu) rụng từ chính các ngọn cây, chao lượn rồi nằm trên cỏ; gió lớn cuốn lá bay theo từng cơn',
      '🌫️ Sương mù / mưa có sương theo chiều sâu: chỗ xa mờ dần, chỗ gần vẫn rõ',
      '☁️ Mây bay ngang chỗ bạn đang nhìn sẽ tự mờ đi để vẫn thấy ruộng và tiệm',
    ],
  },
  {
    version: '0.25.1',
    notes: [
      '🌈 Cầu vồng giờ là cầu vồng thật bắc ngang đảo (một chân ở Khu vui chơi, một chân ở rừng tây nam): kéo bản đồ thì nó đứng yên tại chỗ, cây và nhà phía trước che được nó — không còn dính vào màn hình',
      '🌠 Sao băng rơi thật trên trời đảo thay vì vẽ đè lên màn hình',
    ],
  },
  {
    version: '0.25.0',
    notes: [
      '🏝️ ĐẢO CHÍNH MỚI: to gần gấp đôi, nhiều mũi đất uốn lượn, chia khu rõ ràng — Nông trại + Tiệm hoa + Nhà bạn ở giữa, Công viên phía tây, Khu vui chơi phía đông bắc (🚧 sắp khai trương), Khu mua bán phía đông có cầu tàu, Làng Hoa phía nam',
      '🌲 Rừng bao quanh đảo đổi theo mùa: xuân hoa anh đào hồng, hạ xanh rậm, thu cam đỏ, đông trụi lá phủ tuyết; gió lớn thì cây nghiêng ngả',
      '🏡 Nhà của bạn: chạm vào nhà để đổi màu tường, mái, cửa và gắn 14 vật phẩm (hộp thư, bồn hoa, đèn hiên, ống khói, hàng rào, cổng hoa, dây đèn, xích đu, mèo mướp…)',
      '🌳 Công viên có đài phun nước, chòi nghỉ, bồn hoa, ghế đá và rất nhiều chỗ trống để đặt đồ trang trí',
      '🌦️ Thời tiết chi tiết hơn: đất ướt sẫm màu và đọng vũng khi mưa, bọt nước bắn trên mặt đất, bóng mây trôi qua đảo, bão có chớp sáng + tia sét + tiếng sấm, mưa đá nằm lại trên cỏ, tuyết phủ trắng dần cả đảo rồi tan, sương mù bay từng làn, sương giá trắng mờ buổi sáng, nắng nóng có vệt nắng lung linh, tiếng mưa rì rào',
      '🎨 Đồ trang trí cũ được giữ nguyên chỗ; món nào vướng đường đi / công trình mới sẽ tự cất về kho để bạn đặt lại',
    ],
  },
  {
    version: '0.24.0',
    notes: [
      '🌸 VÙNG ĐẤT MỚI: Đảo Ngàn Hương — hòn đảo lớn nhất từ trước tới giờ, phía tây bắc Đảo Mây, nối bằng cây cầu gỗ. 8 vùng: Bến Hương, Đồng Hoa Sương, Đồi Trà bậc thang, Rừng Ong, Đầm Sen, Vườn Quế & Cam, Suối & Cây Đa Cổ, quảng trường chợ phiên. Mở khi xong chương 3 cốt truyện chính + cấp 12',
      '📖 Cốt truyện mới dài nhất "Hương để nhớ" (18 chương, 4 hồi theo 4 mùa, 3 kết thúc + 1 vĩ thanh): bà Nhài thợ ủ hương đang quên dần mọi thứ trừ mùi hương, cô cháu Sen, ông Quế nuôi ong và một đám cưới dang dở năm mươi năm',
      '🏪 Tiệm Hương Nhài: chế biến 12 món từ hoa — trà nhài, trà ướp sen, mứt hoa hồng, siro cam quế, nến oải hương, xà phòng vạn thọ, nước hoa nhài, hương cưới… Hoa ít sao, sắp héo vẫn dùng được. Hàng bày lên kệ, khách du lịch ghé mua dần (hoặc bán ngay cho Sen)',
      '🎮 14 mini game mới: hái búp trà, hái hoa sương sớm, hun khói lấy mật, quay mật, chèo thuyền hái sen, rung cây hứng cam, bóc vỏ quế, đoán hương, sao trà, nấu mứt, chưng cất, đổ khuôn, giã cối, pha hương 3 tầng. Chơi càng nhiều càng khó dần; chơi lại cho vui trong 📖 Sổ tay › Mini game',
      '📒 Sổ Hương 12 trang: làm món nào lần đầu thì mở một trang hồi ức về đời bà Nhài',
      '👥 5 người bạn mới: bà Nhài, Sen, ông Quế, chị Trà, bé Mật (trò chuyện, tặng hoa, nhờ việc bằng mini game mới, quà mốc tim)',
    ],
  },
  {
    version: '0.23.0',
    notes: [
      '🌫️ VÙNG ĐẤT MỚI: Cồn Lặng — làng chài phủ sương ở phía tây Đảo Mây, đi bộ qua bãi đá. Mở sau khi xong truyện Mũi Én + cấp 20 (chưa mở thì cả cồn chìm trong sương)',
      '📖 Cốt truyện mới "Người giữ sương" (6 chương, 2 kết thúc): chú Lưới ngày nào cũng quăng lưới xuống một vùng biển không có cá, những lá thư trong chai ký tên "K.", và thứ mà ông đã đem đổi lấy màn sương',
      '🎣 CÂU CÁ: quăng cần (trúng vạch vàng = quăng xa, cá to) → chờ phao chìm ❗ → giữ/thả để giữ dây trong vùng xanh. 7 chỗ câu (ao nông trại, cầu tàu làng, Mũi Én, Cồn Lặng, đầm, rặng đá lúc triều xuống, Biển sương ban đêm)',
      '🐟 40 loài cá 5 bậc (Thường → Huyền thoại), mỗi loài có giờ, thời tiết, mùa, chỗ câu và kiểu vùng vẫy riêng; có cá ✨ lấp lánh, rương, ngọc trai, đồ lạc và Sổ cá trong 📖 Sổ tay',
      '🏪 Quầy cá của bé Nhum: mua mồi bằng tiền (5 loại), mua cần/dây/phao; cá đem BÁN lấy tiền, ĐỔI hạt giống, hoặc Ủ thành phân bón',
      '👥 2 người bạn mới: chú Lưới và bé Nhum (trò chuyện, tặng hoa, nhờ việc, quà mốc tim); nhiệm vụ, thành tựu và sự kiện tuần có thêm phần câu cá; đồ trang trí Bể cá',
      '🛠️ Sửa lỗi KHÔNG LÀM ĐƯỢC NHIỆM VỤ CỐT TRUYỆN: chạm điểm sáng ✨ (vd nhặt thư trước nhà) bị nhà / dân làng "giành" mất — giờ điểm sáng cốt truyện luôn được ưu tiên, vùng chạm rộng hơn',
      '🧭 Sổ tay → Cốt truyện có nút "Chỉ đường" đưa camera tới đúng chỗ cần làm; bảng dân làng và bảng nhà có nút 📜 chiếu ngay cảnh truyện đang chờ',
    ],
  },
  {
    version: '0.22.1',
    notes: [
      '🎵 Nhạc riêng cho Mũi Én: "Saltwater and Petals" và "Petals at First Light" — chỉ phát khi bạn ở Mũi Én, về Đảo Mây thì nhạc cũ trở lại (chuyển nhạc nhẹ nhàng, nhỏ dần rồi đổi bài)',
    ],
  },
  {
    version: '0.22.0',
    notes: [
      '🌫️ VÙNG ĐẤT MỚI: Mũi Én — hòn đảo phía đông ba mươi năm không mưa. Mở sau chương 5 cốt truyện chính + cấp 16; đi bằng thuyền của Ông Ba (chạm thuyền ở cầu tàu hoặc nút ⛵)',
      '📖 Cốt truyện mới "Cơn mưa đi lạc" (5 chương): ngọn hải đăng không bao giờ tắt, cuốn sổ mưa, và vì sao vợ ông Ba vẽ đường tới đúng nơi này',
      '🌾 3 loài hoa chịu mặn: Oải hương biển, Cúc muối, Muống biển — chỉ trồng trên 3 lô bậc thang Mũi Én (sương giữ ẩm, đất lâu khô), bán ở tiệm như hoa thường',
      '☁️ Thanh "Mây về": thu hoạch hoa ở Mũi Én để gọi mây, đảo đổi màu dần từ xám tro sang xanh tím',
      '👥 3 người bạn mới để kết thân: Ông Hải gác đèn, cậu bé Triều hứng sương, Bà Sáo bán hoa khô (trò chuyện, tặng hoa, nhờ việc, quà mốc tim)',
      '🛠️ Sửa lỗi kéo bản đồ tới khu làng bị khựng, phải kéo 2–3 lần mới qua',
    ],
  },
  {
    version: '0.21.0',
    notes: [
      '📜 Cốt truyện "Giấc mơ của tiệm hoa" trọn bộ: Chương 3–7 (cấp 8 → 20) — con thuyền đóng dở, bí mật của Bà Tư, cây cầu lên Đồi Mộng, và người ngủ dưới gốc Cây Mộng',
      '🌱 NỤ MỘNG: 5 chiếc nụ là giấc mơ người làng bỏ lại. Mỗi nụ chỉ nở đúng khoảnh khắc của nó (ngày gió lớn, đêm sao băng, cầu vồng, đêm tuyết, tưới 3 ngày liền) — bé Mơ sẽ báo trước một ngày',
      '🌸 Hoa Mộng nở rồi: TRAO LẠI để người ấy nhớ ra giấc mơ của mình, hoặc GIỮ ở tiệm (+40 điểm xinh xắn). Lựa chọn của bạn quyết định kết truyện',
      '🌠 3 kết thúc: Thức giấc · Mơ tiếp · và một kết ẩn khi trao lại đủ 5 Hoa Mộng. Xem lại cảnh cuối trong Sổ tay để thử lựa chọn khác',
      '🗺️ Vùng mới phía bắc: Đồi Mộng và Cây Mộng (sửa cầu ở chương 4) · thành tựu mới "Người kể chuyện" với danh hiệu "Người giữ giấc mơ"',
      '📐 Thanh công cụ và thanh giờ/thời tiết gọn lại, đỡ che màn hình',
    ],
  },
  {
    version: '0.20.0',
    notes: [
      '📜 CỐT TRUYỆN CHÍNH "Giấc mơ của tiệm hoa" — Chương 1 "Tiệm không có tên chủ" và Chương 2 "Trang giấy phai" (mở ở cấp 5): ai là người chủ cũ mà cả đảo đã quên?',
      '🎭 Hội thoại kiểu phim: dải đen điện ảnh, chân dung có nét mặt, chữ hiện dần kèm giọng riêng từng người, lựa chọn có sức nặng ("… sẽ nhớ điều này"), cảnh hồi ức màu nâu cũ, tranh minh họa',
      '✨ Gặp bé Mơ trước hiên tiệm vào ban đêm (sau 19:00) · người có chuyện để kể hiện 📜 trên đầu · xem tiến độ và xem lại cảnh ở 📖 Sổ tay › Cốt truyện',
      '🪴 TREO HOA ở tiệm: chọn những loài tiệm đang bán — khách vào tiệm chỉ hỏi mua loài đang treo, không còn cảnh khách đòi hoa tiệm không có',
      '🔔 Thông báo nổi (khung xanh, vàng) và khung hướng dẫn gọn hẳn lại, không còn che màn hình — chạm 💡 để thu nhỏ hướng dẫn',
      '📝 Khách muốn loài khác sẽ để lại ĐƠN ĐẶT TRƯỚC (📋 Nhiệm vụ › Đơn hàng): trả cao hơn 35%, có hạn giao · giỏ hoa đang treo hiện ngay dưới mái hiên tiệm',
    ],
  },
  {
    version: '0.19.0',
    notes: [
      '🎮 Mini game có 3 mức 🌱 Dễ · 🌿 Vừa · 🌳 Khó — càng thân dân làng, việc nhờ càng khó nhưng thưởng nhiều hơn (×1,3 / ×1,6)',
      '🔥 Combo khi làm đúng liên tiếp, pháo hoa nhỏ, tiếng chuông cao dần, rung khi sai · 🏆 lưu kỷ lục từng mini game',
      '💐 Mini game mới "Cắm hoa theo mẫu" (Cô Mai): nhớ bình mẫu rồi cắm lại — mức khó mẫu bị che · 🦋 "Bắt bướm" (Bé Su): bắt bướm, tránh ong',
      '📖 Sổ tay có thêm thẻ 🎮 Mini game: chơi lại cho vui bất cứ lúc nào, chọn độ khó, xem kỷ lục',
    ],
  },
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
