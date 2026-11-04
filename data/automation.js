// =============================================================
//  TỰ ĐỘNG HÓA: máy móc (mua cho từng lô) & nhân viên (thuê, trả lương mỗi ngày game)
// =============================================================
export const MACHINES = {
  sprinkler: {
    name: 'Vòi tưới tự động', icon: '🚿', price: 1800, level: 4,
    desc: 'Tự tưới các ô trong lô khi đất sắp khô (không tốn gì thêm)',
    threshold: 0.3, // tưới khi độ ẩm dưới 30%
  },
  feeder: {
    name: 'Máy bón phân', icon: '⚙️', price: 2400, level: 5,
    desc: 'Tự bón phân cho cây khi cây cần (dùng phân bón trong kho)',
  },
};

export const STAFF = {
  gardener: {
    name: 'Bác Tâm làm vườn', icon: '👨‍🌾', hire: 900, wage: 150, level: 6,
    desc: 'Mỗi giờ game: thu hoạch hoa nở, dọn & xới đất, gieo lại đúng loại hạt cũ nếu kho còn hạt',
    everyMinutes: 60,
    look: { skin: '#e8b48f', hair: '#7a6a5a', outfit: '#a6dd94', hat: '#d9b48a' },
  },
  clerk: {
    name: 'Chị Thu bán hàng', icon: '👩‍💼', hire: 1200, wage: 180, level: 7,
    desc: 'Tự phục vụ khách mua 1 cành / nhiều cành bằng hoa trong kho (bó hoa vẫn cần bạn gói)',
    everyMinutes: 30,
    look: { skin: '#ffe0c7', hair: '#3b2a22', outfit: '#f6a6b9', hat: null, bun: true },
  },
};
