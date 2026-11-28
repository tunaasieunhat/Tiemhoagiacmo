// =============================================================
//  📅 KẾ HOẠCH HÔM NAY & LỊCH TUẦN (GĐ25)
//  Mỗi ngày game có 5 việc gợi ý (chọn theo tình hình của bạn). Làm xong từng việc nhận quà nhỏ, xong cả 5 nhận quà lớn.
//  Mỗi ngày trong tuần (tuần = 7 ngày game = 1 mùa) có một chủ đề riêng với hiệu ứng thật.
// =============================================================

export const PLAN_RULES = {
  tasks: 5,                         // số việc mỗi ngày
  allDone: { coins: 300, luck: 1 }, // quà khi xong cả 5 việc
};

// Mẫu việc. need: điều kiện để được chọn (do game xét) · stat: bộ đếm tiến độ · n: [ít nhất, nhiều nhất] (tăng theo cấp)
//  reward: tiền + XP mỗi việc
export const PLAN_TASKS = {
  harvest: { icon: '🌸', text: 'Thu hoạch {n} bông hoa', stat: 'harvested', n: [6, 20], reward: { coins: 60, xp: 20 } },
  serve: { icon: '🛍️', text: 'Phục vụ {n} khách ở tiệm hoa', stat: 'served', n: [3, 10], reward: { coins: 80, xp: 25 } },
  bouquet: { icon: '💐', text: 'Gói {n} bó hoa cho khách', stat: 'bouquets', n: [1, 4], reward: { coins: 100, xp: 30 }, need: 'level3' },
  bugs: { icon: '🐛', text: 'Bắt {n} con sâu trên ruộng', stat: 'bugs', n: [2, 6], reward: { coins: 50, xp: 15 } },
  talk: { icon: '💬', text: 'Trò chuyện với {who}', stat: 'talk', n: [1, 1], reward: { coins: 60, xp: 20 } },
  birthday: { icon: '🎂', text: 'Tặng quà sinh nhật {who}', stat: 'gift', n: [1, 1], reward: { coins: 150, xp: 40 } },
  order: { icon: '📦', text: 'Giao {n} đơn hàng lớn', stat: 'orders', n: [1, 2], reward: { coins: 120, xp: 35 }, need: 'orders' },
  fish: { icon: '🎣', text: 'Câu {n} con cá', stat: 'fish', n: [3, 8], reward: { coins: 70, xp: 20 }, need: 'fishing' },
  gather: { icon: '🍃', text: 'Hái nguyên liệu ở Đảo Ngàn Hương {n} lần', stat: 'gather', n: [2, 5], reward: { coins: 70, xp: 20 }, need: 'huong' },
  make: { icon: '🫙', text: 'Làm {n} món ở Tiệm Hương Nhài', stat: 'made', n: [2, 5], reward: { coins: 90, xp: 25 }, need: 'huong' },
  party: { icon: '🎉', text: 'Hoàn thành 1 hợp đồng trang trí tiệc', stat: 'parties', n: [1, 1], reward: { coins: 200, xp: 50 }, need: 'party' },
  ship: { icon: '⛵', text: 'Gửi {n} chuyến hàng cho chi nhánh', stat: 'ships', n: [1, 2], reward: { coins: 100, xp: 25 }, need: 'branch' },
  story: { icon: '📜', text: 'Xem tiếp cốt truyện', stat: 'scenes', n: [1, 1], reward: { coins: 80, xp: 30 }, need: 'story' },
};

// Chủ đề từng ngày trong tuần (ngày 1 của mùa = Thứ Hai). effect: hiệu ứng thật trong game
export const WEEKDAYS = [
  { name: 'Thứ Hai', icon: '🧺', theme: 'Chợ phiên', desc: 'Bán sỉ hoa ở Khu Mua Bán được giá cao hơn 30%.', effect: { wholesale: 1.3 } },
  { name: 'Thứ Ba', icon: '⛵', theme: 'Ngày giao hàng', desc: 'Thuyền chở hàng ra chi nhánh đi nhanh gấp đôi.', effect: { shipTime: 0.5 } },
  { name: 'Thứ Tư', icon: '🚢', theme: 'Thuyền buôn ghé bến', desc: 'Thuyền buôn đậu ở cầu tàu phía đông, bán hạt giống màu hiếm (xem ở Sổ quản lý › Hôm nay).', effect: { trader: true } },
  { name: 'Thứ Năm', icon: '💗', theme: 'Ngày của dân làng', desc: 'Trò chuyện với dân làng được thêm 50% tình thân.', effect: { talkFp: 1.5 } },
  { name: 'Thứ Sáu', icon: '🎉', theme: 'Ngày tiệc', desc: 'Thêm hợp đồng trang trí tiệc, thưởng tiệc ×1,5.', effect: { party: 1.5 } },
  { name: 'Thứ Bảy', icon: '🏮', theme: 'Chợ đêm', desc: 'Khách cho tiền bo gấp rưỡi.', effect: { tips: 1.5 } },
  { name: 'Chủ Nhật', icon: '☀️', theme: 'Ngày nghỉ', desc: 'Khách tới tiệm đông hơn 40%.', effect: { spawn: 1.4 } },
];

// Thuyền buôn Thứ Tư: 3 món hạt màu hiếm (chọn ngẫu nhiên theo tuần). price: giá × giá hạt thường
export const TRADER = { offers: 3, priceMult: 6, stock: 3 };
