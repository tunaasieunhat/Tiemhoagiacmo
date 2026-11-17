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
  items: { fertilizer: 8, cover: 2, medicine: 3 },
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

// ---- Nhìn xuyên mái che (bạt che & nhà kính) để thấy hoa bên dưới ----
export const SEE_THROUGH = {
  zoomFar: 1.0,     // thu nhỏ tới mức này (hoặc nhỏ hơn): mái che hiện đậm nhất
  zoomNear: 1.9,    // phóng to tới mức này (hoặc lớn hơn): mái che mờ nhất
  coverFar: 0.85,   // độ đậm của bạt che khi thu nhỏ (0 = trong suốt, 1 = che kín)
  coverNear: 0.15,  // độ đậm của bạt che khi phóng to
  glassFar: 0.3,    // độ đậm kính nhà kính khi thu nhỏ
  glassNear: 0.08,  // độ đậm kính nhà kính khi phóng to
  whenSelected: true, // chạm vào ô đất trong lô có mái che => mái che lô đó mờ hẳn
};

// ---- Nhân vật ----
export const PLAYER = {
  walkSpeed: 4.2,      // đơn vị 3D / giây
  actionSeconds: 0.55, // thời gian làm 1 thao tác
};

// ---- Đồ họa (GĐ9) ----
//  pixelRatio: độ nét (càng cao càng đẹp nhưng nặng) · shadowSize: độ nét bóng đổ (0 = tắt bóng)
//  fps: số khung hình tối đa mỗi giây (30 tiết kiệm pin)
export const GRAPHICS = {
  levels: {
    high: { name: 'Cao', pixelRatio: 2, shadowSize: 2048, fps: 60 },
    medium: { name: 'Vừa', pixelRatio: 1.5, shadowSize: 1024, fps: 60 },
    low: { name: 'Tiết kiệm pin', pixelRatio: 1, shadowSize: 0, fps: 30 },
  },
  autoMinFps: 26,       // chế độ Tự động: dưới mức này thì giảm đồ họa 1 bậc
  modalFps: 30,         // khi đang mở bảng (che màn hình) chỉ vẽ 30 khung/giây cho mát máy
};
