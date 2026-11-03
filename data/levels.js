// =============================================================
//  CẤP ĐỘ & KINH NGHIỆM (XP)
// =============================================================

// Tổng XP cần để ĐẠT mỗi cấp. LEVEL_XP[0] = cấp 1, LEVEL_XP[1] = cấp 2, ...
// Sau cấp cuối trong bảng, mỗi cấp cần thêm LEVEL_XP_AFTER.
export const LEVEL_XP = [0, 40, 110, 220, 380, 600, 900, 1300, 1800, 2450, 3250, 4200];
export const LEVEL_XP_AFTER = 1100;

// XP nhận được từ mỗi việc
export const XP = {
  till: 1,
  plant: 2,
  water: 1,
  fertilize: 2,
  harvestPerStar: 4,   // thu hoạch hoa 3★ = 12 XP
  sellPer10Coins: 1,   // bán cho khách: 1 XP mỗi 10 xu
  bouquet: 5,          // thưởng thêm khi giao bó hoa
  perfect: 5,          // thưởng thêm khi khách cực kỳ hài lòng
};

// Phần thưởng khi lên cấp (lv = cấp mới)
export function levelReward(lv) {
  return { coins: 40 * lv, fertilizer: 2 + Math.floor(lv / 3) };
}
