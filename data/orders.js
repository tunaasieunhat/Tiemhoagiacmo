// =============================================================
//  📦 ĐƠN HÀNG LỚN CÓ HẠN CHÓT (GĐ16) — chỉnh số ở đây
//  Khách đặt trước một lượng lớn hoa; giao đủ trước hạn thì thưởng lớn, trễ hạn thì mất uy tín.
// =============================================================

export const ORDER_RULES = {
  unlockLevel: 3,        // cấp mở bảng đơn hàng
  max: 2,                // tối đa bao nhiêu đơn cùng lúc
  everyHours: 10,        // cứ 10 giờ game có thêm 1 đơn mới (nếu còn chỗ)
  dueHours: [30, 54],    // hạn giao: 30–54 giờ game (~0,5–1 giờ thật)
  payMult: 1.7,          // tiền thưởng = giá bán lẻ × 1,7
  xpPerFlower: 1,        // XP mỗi cành giao
  ticketChance: 0.35,    // 35% kèm 1 🎟️ vé may mắn
  failRep: -6,           // trễ hạn: mất 6 uy tín
  // số cành theo cấp: [cấp tối thiểu, số cành ít nhất, nhiều nhất]
  size: [[3, 6, 9], [5, 9, 14], [8, 12, 20]],
  // yêu cầu số sao tối thiểu theo cấp
  minQ: [[3, 1], [5, 2], [8, 2]],
};

// Dịp đặt hàng (chọn ngẫu nhiên)
export const ORDER_KINDS = [
  { icon: '💒', name: 'Tiệc cưới nhà họ Trần', who: 'Cô dâu Lan' },
  { icon: '🎉', name: 'Khai trương quán trà', who: 'Anh Tâm' },
  { icon: '🎓', name: 'Lễ tốt nghiệp trường làng', who: 'Thầy hiệu trưởng' },
  { icon: '🏮', name: 'Hội chợ hoa cuối tuần', who: 'Ban tổ chức hội chợ' },
  { icon: '🎂', name: 'Sinh nhật bà ngoại', who: 'Bé Na' },
  { icon: '⛪', name: 'Trang trí nhà thờ', who: 'Chị Hạnh' },
  { icon: '🏨', name: 'Sảnh khách sạn Biển Xanh', who: 'Quản lý Minh' },
];
