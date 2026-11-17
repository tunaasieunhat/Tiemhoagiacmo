// =============================================================
//  🎉 HỢP ĐỒNG TRANG TRÍ TIỆC (GĐ25)
//  Dân làng đặt bạn trang trí tiệc ở một nơi trên đảo. Mỗi chỗ trang trí (slot) cần một số bông hoa cùng loại.
//  Bạn chọn hoa cho từng chỗ ⇒ hoa hiện ra trong 3D ⇒ "Trình khách" để chấm điểm theo yêu cầu.
// =============================================================

// Kiểu đồ trang trí: n = số bông cần · name · icon
export const PARTY_ITEMS = {
  arch: { name: 'Cổng hoa', icon: '🌸', n: 12 },
  stand: { name: 'Lẵng hoa đứng', icon: '💐', n: 6 },
  table: { name: 'Bàn tiệc cắm hoa', icon: '🍽️', n: 4 },
  garland: { name: 'Dây hoa', icon: '🎀', n: 8 },
  lantern: { name: 'Đèn hoa', icon: '🏮', n: 2 },
  carpet: { name: 'Thảm cánh hoa', icon: '🟣', n: 5 },
};

// Nơi tổ chức: center (máy quay nhìn vào) · slots: [kiểu, x, z, hướng (độ)]
export const VENUES = {
  park: { name: 'Công Viên', center: [-21, -10], slots: [
    ['arch', -17.4, -4.6, 135], ['stand', -18.6, -12.8, 45], ['stand', -23.6, -6.4, 90], ['table', -22.4, -10.8, 0], ['table', -20.0, -13.4, 0],
    ['garland', -25.0, -9.8, 90], ['lantern', -17.0, -10.2, 0], ['carpet', -19.6, -6.6, 135],
  ] },
  plaza: { name: 'Quảng trường Làng Hoa', center: [0, 34], slots: [
    ['arch', -1.6, 30.2, 0], ['stand', -3.4, 31.4, 0], ['stand', 0.4, 31.0, 0], ['table', -2.8, 36.2, 20], ['table', 3.2, 32.4, -20],
    ['garland', 0.4, 38.0, 0], ['lantern', 3.6, 36.4, 0], ['carpet', -1.6, 33.0, 0],
  ] },
  beach: { name: 'Bãi biển phía nam', center: [10, 42.4], slots: [
    ['arch', 12.4, 44.0, 30], ['stand', 9.0, 45.6, 30], ['stand', 13.6, 41.0, 30], ['table', 9.2, 41.4, 30], ['table', 11.6, 39.6, 30],
    ['garland', 7.6, 43.4, 30], ['lantern', 14.8, 43.0, 0], ['carpet', 10.6, 43.4, 30],
  ] },
};

// Dịp tổ chức: reward = tiền gốc (× điểm/100) · tones: tông màu khách thích · meanings: ý nghĩa mong muốn · venues: nơi có thể
//  lines: [lời đặt hàng, lời khen (điểm ≥ 80), lời chê (điểm < 50)]
export const OCCASIONS = {
  birthday: { name: 'Tiệc sinh nhật', icon: '🎂', reward: 900, tones: ['warm', 'pastel'], meanings: ['joy', 'congrats'], venues: ['park', 'plaza'],
    lines: ['Sắp tới sinh nhật {who}, nhờ tiệm làm giúp một bữa tiệc thật vui!', 'Đẹp quá! Ai đi qua cũng dừng lại chụp ảnh!', 'Ừm... cũng được. Hơi buồn so với sinh nhật.'] },
  wedding: { name: 'Lễ cưới', icon: '💍', reward: 2200, tones: ['pastel', 'cool'], meanings: ['love', 'purity'], venues: ['beach', 'park'],
    lines: ['{who} sắp tổ chức lễ cưới. Tiệm trang trí giúp nhé, cả đời chỉ một lần!', 'Đúng như trong mơ... Cảm ơn, cảm ơn nhiều lắm.', 'Hoa thì đẹp, mà sao không giống lễ cưới chút nào.'] },
  opening: { name: 'Lễ khai trương', icon: '🎊', reward: 1200, tones: ['warm'], meanings: ['congrats', 'hope'], venues: ['plaza', 'park'],
    lines: ['{who} khai trương cửa hàng, cần hoa thật rực rỡ cho may mắn!', 'Rực rỡ thế này chắc khách đông lắm!', 'Nhìn hơi nhạt, không giống ngày vui.'] },
  memorial: { name: 'Lễ tưởng niệm', icon: '🕯️', reward: 1000, tones: ['cool', 'natural'], meanings: ['longing', 'respect'], venues: ['beach', 'park'],
    lines: ['Ngày giỗ người thân của {who}. Xin tiệm trang trí thật trang nghiêm.', 'Ấm lòng lắm. Chắc người ấy cũng thấy.', 'Màu sắc lòe loẹt quá... không hợp với ngày này.'] },
  anniversary: { name: 'Kỷ niệm ngày cưới', icon: '💞', reward: 1500, tones: ['warm', 'pastel'], meanings: ['love', 'gratitude'], venues: ['beach', 'plaza'],
    lines: ['{who} muốn bất ngờ cho người thương nhân ngày kỷ niệm. Tiệm giúp với!', 'Người ấy khóc rồi! Khóc vì vui đó!', 'Đẹp, nhưng không thấy "tình yêu" ở đâu cả.'] },
  festival: { name: 'Hội hoa của làng', icon: '🏮', reward: 1600, tones: ['warm', 'natural'], meanings: ['joy', 'friendship'], venues: ['plaza'],
    lines: ['Làng sắp mở hội hoa! {who} thay mặt cả làng đặt tiệm trang trí.', 'Cả làng nói năm nay là năm đẹp nhất!', 'Hội làng mà buồn hiu.'] },
};

export const PARTY_RULES = {
  maxOffers: 3,        // số hợp đồng chờ nhận cùng lúc
  deadlineDays: 2,     // số ngày để làm xong sau khi nhận
  minFill: 5,          // phải trang trí ít nhất bấy nhiêu chỗ mới trình khách được
  fp: [10, 40],        // tình thân với khách: điểm thấp → cao
  rep: [2, 12],        // uy tín tiệm
  xp: [40, 140],
  // trọng số chấm điểm (tổng 100)
  weights: { fill: 25, tone: 25, meaning: 20, favorite: 10, harmony: 10, quality: 10 },
  hatePenalty: 20,     // có hoa khách ghét: trừ điểm
};
