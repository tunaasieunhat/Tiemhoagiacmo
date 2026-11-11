// =============================================================
//  🏅 THÀNH TỰU & DANH HIỆU (GĐ18) — chỉnh số ở đây
//  Mỗi thành tựu có 3 bậc: 🥉 Đồng · 🥈 Bạc · 🥇 Vàng. Đạt bậc Bạc thì mở DANH HIỆU (chọn đeo, bạn bè thấy khi ghé thăm).
//  stat: chỉ số được đếm (xem src/systems/achievements.js)
//  n   : mốc cần đạt cho 3 bậc · rewards: thưởng cho 3 bậc (coins 💰, luck 🎟️, gold 🎫, shard 🧩, fertilizer 🧪)
// =============================================================

export const ACH_TIERS = [
  { name: 'Đồng', icon: '🥉', color: '#c98a5a' },
  { name: 'Bạc', icon: '🥈', color: '#8fa3b8' },
  { name: 'Vàng', icon: '🥇', color: '#e0a21a' },
];

const R1 = { coins: 300, fertilizer: 5 };

export const ACHIEVEMENTS = [
  { id: 'harvest', icon: '🧺', name: 'Nhà nông chăm chỉ', desc: 'Thu hoạch {n} bông hoa', stat: 'harvested', n: [100, 1000, 5000],
    rewards: [R1, { coins: 1500, luck: 2 }, { coins: 5000, gold: 1 }], title: 'Nhà nông chăm chỉ' },
  { id: 'serve', icon: '🏪', name: 'Người bán hoa', desc: 'Phục vụ {n} khách ở tiệm', stat: 'served', n: [50, 400, 2000],
    rewards: [R1, { coins: 1500, luck: 2 }, { coins: 5000, gold: 1 }], title: 'Người bán hoa tận tâm' },
  { id: 'bouquet', icon: '💐', name: 'Nghệ nhân bó hoa', desc: 'Gói {n} bó hoa cho khách', stat: 'bouquets', n: [20, 150, 800],
    rewards: [R1, { coins: 1500, luck: 2 }, { coins: 5000, gold: 1 }], title: 'Nghệ nhân cắm hoa' },
  { id: 'earn', icon: '💰', name: 'Doanh nhân phố hoa', desc: 'Kiếm {n} 💰 từ bán hoa', stat: 'coinsEarned', n: [5000, 50000, 300000],
    rewards: [{ coins: 500 }, { coins: 2500, luck: 2 }, { coins: 8000, gold: 1 }], title: 'Đại gia phố hoa' },
  { id: 'bugs', icon: '🐛', name: 'Thợ săn sâu', desc: 'Bắt {n} con sâu', stat: 'bugs', n: [30, 250, 1200],
    rewards: [R1, { coins: 1200, shard: 10 }, { coins: 4000, shard: 40 }], title: 'Thợ săn sâu' },
  { id: 'orders', icon: '📦', name: 'Nhà cung cấp uy tín', desc: 'Giao {n} đơn hàng lớn', stat: 'orders', n: [5, 40, 150],
    rewards: [{ coins: 600 }, { coins: 2500, luck: 3 }, { coins: 8000, gold: 1 }], title: 'Nhà cung cấp hoa' },
  { id: 'colors', icon: '📖', name: 'Nhà sưu tầm', desc: 'Khám phá {n} màu hoa trong Sổ tay', stat: 'colors', n: [15, 40, 70],
    rewards: [R1, { coins: 2000, luck: 2 }, { coins: 6000, gold: 2 }], title: 'Nhà thực vật học' },
  { id: 'breed', icon: '🧬', name: 'Bậc thầy lai tạo', desc: 'Lai tạo {n} lần', stat: 'bred', n: [10, 80, 300],
    rewards: [R1, { coins: 1500, luck: 2 }, { coins: 5000, gold: 1 }], title: 'Phù thủy lai tạo' },
  { id: 'hearts', icon: '💞', name: 'Bạn của cả làng', desc: 'Tổng cộng {n} ❤️ với dân làng', stat: 'hearts', n: [10, 30, 55],
    rewards: [R1, { coins: 1500, luck: 2 }, { coins: 5000, gold: 1 }], title: 'Bạn của cả làng' },
  { id: 'land', icon: '🗺️', name: 'Địa chủ hoa', desc: 'Sở hữu {n} lô đất', stat: 'plots', n: [3, 6, 8],
    rewards: [R1, { coins: 2000, luck: 2 }, { coins: 6000, gold: 1 }], title: 'Địa chủ vườn hoa' },
  { id: 'beauty', icon: '🎨', name: 'Nhà trang trí', desc: 'Đạt {n} điểm xinh xắn', stat: 'beauty', n: [20, 80, 180],
    rewards: [R1, { coins: 1500, luck: 2 }, { coins: 5000, gold: 1 }], title: 'Nhà thiết kế vườn' },
  { id: 'luck', icon: '🌈', name: 'Người may mắn', desc: 'Sưu tầm {n} loài Cây Vận May', stat: 'luckSpecies', n: [1, 3, 5],
    rewards: [{ shard: 20 }, { shard: 60, luck: 3 }, { coins: 10000, gold: 2 }], title: 'Người được thần may mắn chọn' },
  { id: 'level', icon: '⭐', name: 'Kinh nghiệm đầy mình', desc: 'Đạt cấp {n}', stat: 'level', n: [10, 20, 35],
    rewards: [{ coins: 800 }, { coins: 3000, luck: 3 }, { coins: 10000, gold: 2 }], title: 'Huyền thoại Giấc Mơ' },
  { id: 'fish', icon: '🎣', name: 'Tay câu Cồn Lặng', desc: 'Câu được {n} con cá', stat: 'fish', n: [30, 300, 1500],
    rewards: [{ coins: 800, luck: 1 }, { coins: 3000, gold: 1 }, { coins: 10000, gold: 2 }], title: 'Tay câu Cồn Lặng' },
  { id: 'fishbook', icon: '🐠', name: 'Sổ cá đầy trang', desc: 'Sưu tầm {n} loài cá', stat: 'fishSpecies', n: [10, 25, 40],
    rewards: [{ coins: 1000, luck: 1 }, { coins: 4000, gold: 1 }, { coins: 12000, gold: 3 }], title: 'Nhà ngư học' },
  { id: 'story', icon: '📜', name: 'Người kể chuyện', desc: 'Hoàn thành {n} chương cốt truyện', stat: 'chapters', n: [2, 5, 7],
    rewards: [{ coins: 800, luck: 1 }, { coins: 3000, gold: 1 }, { coins: 10000, gold: 2 }], title: 'Người giữ giấc mơ' },
  { id: 'event', icon: '📅', name: 'Ngôi sao sự kiện', desc: 'Về đích {n} sự kiện tuần', stat: 'events', n: [1, 5, 15],
    rewards: [{ coins: 800, luck: 1 }, { coins: 3000, gold: 1 }, { coins: 10000, gold: 2 }], title: 'Ngôi sao sự kiện' },
];
