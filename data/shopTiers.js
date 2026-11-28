// =============================================================
//  🏪 QUY MÔ TIỆM HOA (GĐ18) — nâng quy mô ở Chợ › Nâng cấp
//  Khác với "bậc uy tín" (tự lên theo 💗): quy mô tiệm phải bỏ tiền xây và đủ điều kiện.
//  cost 💰 · level cấp · rep uy tín 💗 · medals số huy chương thành tựu (mỗi bậc Đồng/Bạc/Vàng = 1)
//  priceMult: khách trả giá cao hơn · spawnMult: khách đến nhanh hơn (<1) · vipChance: tỉ lệ khách VIP · queue: thêm chỗ chờ
// =============================================================

export const SHOP_TIERS = [
  { name: 'Tiệm nhỏ', icon: '🏠', priceMult: 1, spawnMult: 1, vipChance: 0, queue: 0,
    desc: 'Tiệm hoa nhỏ xinh ven nông trại.' },
  { name: 'Cửa hàng hoa', icon: '🏪', cost: 6000, level: 6, rep: 100, medals: 3, priceMult: 1.08, spawnMult: 0.9, vipChance: 0.06, queue: 0,
    desc: 'Thêm bồn hoa, đèn dây lấp lánh. Khách trả cao hơn 8%, bắt đầu có khách 👑 VIP.' },
  { name: 'Tiệm hoa lớn', icon: '🏬', cost: 20000, level: 12, rep: 250, medals: 8, priceMult: 1.16, spawnMult: 0.82, vipChance: 0.12, queue: 1,
    desc: 'Xây thêm phòng kính trưng hoa, biển hiệu sao. Khách trả cao hơn 16%, thêm 1 chỗ chờ.' },
  { name: 'Chuỗi tiệm Giấc Mơ', icon: '👑', cost: 60000, level: 20, rep: 600, medals: 15, priceMult: 1.25, spawnMult: 0.75, vipChance: 0.18, queue: 1,
    desc: 'Tầng 2, vườn trên mái, cờ và biển vàng. Khách trả cao hơn 25%, nhiều khách VIP.' },
];

// Khách VIP: trả rất đắt nhưng khó tính
export const VIP = {
  priceMult: 1.8,    // nhân giá
  minQuality: 2,     // đòi tối thiểu 2⭐ (hoặc cao hơn nếu yêu cầu sẵn cao hơn)
  patienceMult: 1.3, // kiên nhẫn hơn một chút
  repBonus: 3,       // thêm uy tín khi làm VIP hài lòng
};
