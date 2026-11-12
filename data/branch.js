// =============================================================
//  🏪 CHI NHÁNH TRÊN CÁC ĐẢO (GĐ25)
//  Mở quầy bán hoa ở Làng Hoa, Mũi Én, Cồn Lặng, Đảo Ngàn Hương. Dân đảo bạn đã thân làm quản lý.
//  Gửi hàng bằng thuyền (hoa trong kho, hàng của Tiệm Hương Nhài) ⇒ chi nhánh tự bán theo giờ ⇒ tiền vào két, ghé thu.
// =============================================================

// need: dấu / cảnh truyện cần có (đảo đã mở) · hearts: tim tối thiểu với quản lý · at: chỗ đặt quầy (x, z)
//  likes: hàng bán chạy (loài hoa / 'goods' = hàng chế biến / mã sản phẩm) → hệ số nhu cầu · price: giá × giá gốc
export const BRANCHES = {
  lang: { name: 'Chi nhánh Làng Hoa', icon: '🏘️', manager: 'ba_tu', hearts: 2, need: null, cost: 3000, at: [4.4, 29.0],
    likes: { daisy: 1.6, tulip: 1.5, rose: 1.3, sunflower: 1.3, carnation: 1.4 }, price: 1.15, desc: 'Dân làng thích hoa nhà trồng: cúc, tulip, cẩm chướng.' },
  muien: { name: 'Chi nhánh Mũi Én', icon: '🌫️', manager: 'ba_sao', hearts: 2, need: 'e1_sao', cost: 5000, at: [55.2, 3.4],
    likes: { sunflower: 1.5, marigold: 1.5, sealavender: 1.6, saltdaisy: 1.6, beachglory: 1.6, candle_lav: 1.8 }, price: 1.25, desc: 'Dân chài thích hoa bền gió, hoa chịu mặn và nến.' },
  con: { name: 'Chi nhánh Cồn Lặng', icon: '🎣', manager: 'nhum', hearts: 2, need: 'co_fish', cost: 5000, at: [-37.6, -1.2],
    likes: { lily: 1.6, lavender: 1.5, hydrangea: 1.4, rose: 1.2, tea_jasmine: 1.7, tea_lotus: 1.7 }, price: 1.25, desc: 'Người trong sương thích hoa trắng, oải hương và trà nóng.' },
  huong: { name: 'Chi nhánh Ngàn Hương', icon: '🌸', manager: 'sen', hearts: 2, need: 'hg_shop', cost: 6000, at: [-43.6, -35.8],
    likes: { goods: 1.8, rose: 1.4, peony: 1.6, orchid: 1.5 }, price: 1.35, desc: 'Khách du lịch mua quà: nước hoa, mứt, trà và hoa sang.' },
};

export const BRANCH_RULES = {
  salesPerHour: [1.2, 2.0, 3.0],   // số món bán mỗi giờ game theo cấp chi nhánh 1/2/3 (khi đang mở cửa)
  heartBonus: 0.1,                 // mỗi ❤️ với quản lý: bán thêm 10%
  open: [7, 21],                   // giờ mở cửa
  offlineRate: 0.5,                // lúc bạn vắng mặt bán chậm hơn
  shipMinutes: 180,                // thuyền chạy bấy nhiêu phút game (người giao hàng tay nghề cao thì nhanh hơn)
  shipMax: 40,                     // tối đa mỗi chuyến
  capacity: [40, 80, 140],         // sức chứa kho chi nhánh theo cấp
  upgrade: [0, 8000, 20000],       // giá nâng cấp lên cấp 2 / 3
  autoBelow: 8,                    // người giao hàng tự gửi khi kho chi nhánh còn dưới bấy nhiêu món
  starPrice: [0, 1, 1.4, 1.9],     // giá hoa × theo số sao
  joinBonus: 1.2,                  // kết truyện "Cùng nhau": chi nhánh bán thêm 20%
};
