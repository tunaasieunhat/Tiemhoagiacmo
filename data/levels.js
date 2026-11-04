// =============================================================
//  CẤP ĐỘ & KINH NGHIỆM (XP)
// =============================================================

// Tổng XP cần để ĐẠT mỗi cấp. LEVEL_XP[0] = cấp 1, LEVEL_XP[1] = cấp 2, ...
// Sau cấp cuối trong bảng, mỗi cấp cần thêm LEVEL_XP_AFTER.
export const LEVEL_XP = [0, 40, 110, 220, 380, 600, 900, 1300, 1800, 2450, 3250, 4200];
export const LEVEL_XP_AFTER = 1100;

// XP nhận được từ mỗi việc
// (0.16) Giảm mạnh để lên cấp chậm lại: trước đây ~40 phút lên cấp 5, giờ khoảng 1,5–2 giờ chơi.
// Mốc XP của từng cấp (LEVEL_XP) KHÔNG đổi vì máy chủ bảng xếp hạng dùng cùng bảng này.
export const XP = {
  till: 0,
  plant: 1,
  water: 0,            // tưới không cho XP (tránh bấm tưới liên tục để cày)
  fertilize: 1,
  harvestPerStar: 1,   // thu hoạch hoa 3★ = 3 XP
  sellPer10Coins: 0.2, // bán cho khách: 1 XP mỗi 50 xu
  bouquet: 3,          // thưởng thêm khi giao bó hoa
  perfect: 3,          // thưởng thêm khi khách cực kỳ hài lòng
};

// Phần thưởng khi lên cấp (lv = cấp mới)
export function levelReward(lv) {
  return { coins: 20 * lv, fertilizer: 2 + Math.floor(lv / 3) };
}
