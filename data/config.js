// =============================================================
//  CẤU HÌNH CHUNG — chỉnh số ở đây để cân bằng game
// =============================================================

// ---- Thời gian ----
export const TIME = {
  realSecondsPerGameMinute: 1, // 1 giây thật = 1 phút game  => 24 phút thật = 1 ngày game
  startHour: 6,                // giờ game khi bắt đầu chơi mới
  offlineMaxHours: 24,         // khi tắt game rồi mở lại: tối đa mô phỏng bao nhiêu GIỜ GAME đã trôi qua
};

// ---- Chăm sóc cây ----
export const CARE = {
  dryHealthLossPerHour: 20,  // mất bao nhiêu "sức khỏe" (0-100) mỗi giờ game khi cây bị khô
  offlineDryFactor: 0.35,    // lúc bạn không chơi, cây khô bị mất sức khỏe chậm hơn (35%)
  wiltBelow: 55,             // sức khỏe dưới mức này thì cây trông héo
  growWhenDry: false,        // cây có lớn tiếp khi khô nước không
  fertilizerSpeedBonus: 0.12,// mỗi lần bón phân: lớn nhanh hơn 12%
  thirstyBelow: 0.25,        // mức nước dưới bao nhiêu thì hiện biểu tượng "khát"
  // chất lượng khi thu hoạch: điểm = sức khỏe*0.6 + tỉ lệ bón phân*0.4 (thang 0..1)
  quality3Stars: 0.85,
  quality2Stars: 0.55,
};

// ---- Nông trại ----
export const FARM = {
  plotCols: 3,     // số ô mỗi lô (ngang)
  plotRows: 3,     // số ô mỗi lô (dọc)
  tileSize: 1.25,  // kích thước 1 ô (đơn vị 3D)
  tileGap: 0.14,
};

// ---- Đồ khởi đầu cho người chơi mới ----
export const STARTER = {
  coins: 100,
  seeds: { rose: 4, tulip: 6, sunflower: 3 },
  items: { fertilizer: 8 },
  tools: { shovel: 1, wateringCan: 1 },
  freeSeedsPack: { rose: 2, tulip: 3, sunflower: 2 }, // nút "nhận hạt thử nghiệm" (chỉ GĐ1, GĐ4 sẽ thay bằng cửa hàng)
};

// ---- Công cụ thử nghiệm (nút tua nhanh, nhận hạt miễn phí) — đặt false khi phát hành ----
export const DEV_TOOLS = true;

// ---- Lưu game ----
export const SAVE = {
  autosaveSeconds: 15, // tự lưu trên máy mỗi bao nhiêu giây
};

// ---- Camera ----
export const CAMERA = {
  viewSize: 22,        // độ rộng khung nhìn (càng lớn càng thấy nhiều)
  zoomMin: 0.6,
  zoomMax: 2.6,
  zoomStart: 1.35,
  panLimit: 20,        // giới hạn kéo bản đồ
};

// ---- Nhân vật ----
export const PLAYER = {
  walkSpeed: 4.2,      // đơn vị 3D / giây
  actionSeconds: 0.55, // thời gian làm 1 thao tác
};
