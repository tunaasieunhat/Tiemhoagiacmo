// =============================================================
//  CHĂM SÓC CÓ KỸ NĂNG (GĐ16) — chỉnh số ở đây
//  Thời gian tính bằng GIỜ GAME (1 giờ game = 1 phút thật)
// =============================================================

// 🥀 Độ tươi: hoa nở rồi mà để lâu không hái sẽ héo dần
export const FRESH = {
  goldenHours: 2,        // "giờ vàng": hái trong 2 giờ đầu sau khi nở
  goldenStarChance: 0.3, // hái trong giờ vàng: 30% cơ hội được thêm 1⭐ (tối đa 3⭐)
  freshHours: 6,         // sau 6 giờ bắt đầu héo
  losePerHours: 6,       // cứ thêm 6 giờ nữa thì mất 1⭐ (thấp nhất còn 1⭐)
  offlineFactor: 0.25,   // lúc bạn không chơi, hoa héo chậm hơn (25%)
};

// 🐛 Bắt sâu: sâu bò lên cây lúc bạn đang chơi, chạm để bắt
export const BUGS = {
  everyMinutes: 40,      // cứ khoảng 40 phút game thử thả 1 con (nếu còn chỗ)
  chance: 0.55,          // xác suất có sâu mỗi lần thử
  max: 3,                // tối đa bao nhiêu con cùng lúc
  lifeMinutes: 100,      // không bắt trong 100 phút game (~1,5 phút thật) thì sâu gặm cây
  damage: 18,            // sâu gặm: cây mất bao nhiêu sức khỏe
  coins: [6, 14],        // bắt được 1 con: tiền thưởng ngẫu nhiên trong khoảng
  comboSeconds: 6,       // bắt con tiếp theo trong 6 giây thật => combo
  comboBonus: 4,         // mỗi bậc combo cộng thêm 4 💰
  goldenChance: 0.08,    // 8% là 🐞 bọ rùa vàng (hiếm)
  golden: { coins: 40, shards: 2 }, // thưởng khi bắt bọ rùa vàng
};

// 🌱 Đất & luân canh
export const SOIL = {
  harvestCost: 5,        // mỗi lần thu hoạch đất mất 5 điểm màu (0–100)
  sameSpeciesMult: 3,    // trồng cùng loài với lần trước: đất mất gấp 3
  restPerHour: 3,        // ô đất đã xới để trống: hồi 3 điểm/giờ
  compost: 12,           // dọn cây héo (ủ làm phân): +12 điểm màu cho ô đó
  fertilize: 3,          // mỗi lần bón phân: +3 điểm màu
  rotationGrow: 1.12,    // luân canh (trồng loài khác lần trước): lớn nhanh hơn 12%
  rotationQuality: 0.05, // ... và cộng 0,05 điểm chất lượng
  qualityLoss: 0.3,      // đất bạc màu 100% thì trừ 0,3 điểm chất lượng (theo tỉ lệ)
  minGrow: 0.7,          // đất bạc màu hoàn toàn: chỉ lớn với tốc độ 70%
  poorBelow: 45,         // dưới mức này: đất "bạc màu" (hiện cảnh báo, màu đất nhạt)
};

// ✨ Bất ngờ khi thu hoạch
export const HARVEST_FUN = {
  comboSeconds: 4,       // thu hoạch ô tiếp theo trong 4 giây thật => combo
  comboCoins: 2,         // mỗi bậc combo (từ ×3) thưởng thêm 2 💰
  mutationChance: 0.02,  // 2% nhận thêm 1 hạt "đột biến" màu lạ của chính loài đó
  mutationRare: 0.25,    // trong đó 25% là màu Hiếm, còn lại màu Ít gặp
};
