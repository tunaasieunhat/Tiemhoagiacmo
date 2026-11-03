// =============================================================
//  MUA ĐẤT CỦA DÂN LÀNG (GĐ13)
//  Mỗi mảnh đất là 1 lô 3×3 ô nằm ngay ngoài hàng rào nông trại. Chủ đất chỉ bán khi đủ thân (minHearts).
//  Giá mỗi ngày = giá gốc × (bớt theo tim) × (tâm trạng hôm đó) × (dao động nhỏ). Cố định trong ngày.
// =============================================================

export const LAND_RULES = {
  discountPerHeart: 0.06,   // mỗi tim vượt mức tối thiểu được bớt 6%
  maxDiscount: 0.3,         // bớt tối đa 30% nhờ thân thiết
  wobble: 0.08,             // giá dao động ±8% mỗi ngày
  bargainOff: 0.1,          // trả giá thành công: bớt thêm 10%
  bargainBase: 0.35,        // tỉ lệ trả giá thành công khi vừa đủ tim
  bargainPerHeart: 0.07,    // mỗi tim vượt mức: tăng tỉ lệ thành công
  bargainMax: 0.8,
  bargainFailFp: -20,       // trả giá hỏng: chủ đất phật ý (mất điểm tình thân) và hôm đó không bán nữa
  buyThanksFp: 30,          // mua xong: thân thêm
  roundTo: 10,
};

// Tâm trạng trong ngày (chọn ngẫu nhiên cố định theo ngày). weight = độ hay gặp, mult = nhân giá, sell = có bán không
export const MOODS = {
  happy: { name: 'Vui vẻ', icon: '😊', weight: 3, mult: 0.9, sell: true },
  normal: { name: 'Bình thường', icon: '🙂', weight: 4, mult: 1, sell: true },
  grumpy: { name: 'Khó tính', icon: '😤', weight: 2, mult: 1.15, sell: true },
  no: { name: 'Không muốn bán', icon: '🙅', weight: 2, mult: 1, sell: false },
};

// Mảnh đất. x, z = tâm lô. owner = mã dân làng (data/village.js, data/regulars.js)
export const PARCELS = {
  tu_garden: {
    name: 'Mảnh vườn cũ của Bà Tư', owner: 'ba_tu', x: -2.6, z: 11.3, price: 1500, minHearts: 3, level: 3,
    story: 'Ngày xưa ông bà trồng rau ở đây. Giờ bà già rồi, không chăm nổi nữa.',
    lines: {
      refuse: 'Đất này ông bà giữ mấy chục năm... bà chưa nỡ bán cho người lạ đâu con.',
      no: 'Hôm nay bà mệt, không muốn bàn chuyện đất cát. Mai con ghé nhé.',
      happy: 'Con chăm hoa giỏi thế, bà để lại mảnh vườn cho con là yên tâm nhất.',
      grumpy: 'Đất tốt thì giá phải tốt chứ con.',
      bargainOk: 'Thôi được, bà bớt cho con. Coi như quà của bà.',
      bargainNo: 'Con mặc cả với bà già này à? Hôm nay bà không bán nữa!',
      sold: 'Con nhớ trồng thật nhiều hoa vào nhé. Ông nhà bà chắc vui lắm.',
    },
  },
  ba_yard: {
    name: 'Bãi phơi gỗ của Ông Ba', owner: 'ong_ba', x: 2.6, z: 11.3, price: 2200, minHearts: 4, level: 4,
    story: 'Ông Ba từng phơi gỗ ở đây, giờ xưởng có lán mới nên bỏ trống.',
    lines: {
      refuse: 'Hừm. Đất của ông, ông chỉ bán cho người ông tin.',
      no: 'Đang bận đẽo gỗ. Đừng nói chuyện mua bán hôm nay.',
      happy: 'Cháu chăm chỉ, ông bán rẻ cho. Đừng để cỏ mọc là được.',
      grumpy: 'Giá này. Không mặc cả.',
      bargainOk: 'Hừ... được rồi, bớt cho cháu. Lần này thôi đấy.',
      bargainNo: 'Mặc cả à? Hôm nay ông không bán nữa!',
      sold: 'Đất đã giao, chăm cho tốt. Hàng rào hỏng thì gọi ông.',
    },
  },
  ngan_lot: {
    name: 'Đất trống của Cô Ngân', owner: 'co_ngan', x: 9.6, z: 4.0, price: 3000, minHearts: 5, level: 5,
    story: 'Cô Ngân định mở quán thứ hai ở đây nhưng chưa đủ vốn.',
    lines: {
      refuse: 'Đất này cô định mở quán đấy... thân hơn chút nữa cô mới tính chuyện bán.',
      no: 'Hôm nay quán đông quá, cô chưa nghĩ tới chuyện bán đất.',
      happy: 'Bán cho cháu thì cô có tiền sửa quán Mây, đôi bên cùng vui!',
      grumpy: 'Dạo này cà phê lên giá, đất cũng lên theo cháu ạ.',
      bargainOk: 'Haha, cháu khéo nói ghê, cô bớt cho!',
      bargainNo: 'Thôi thôi, cô không bán nữa đâu, giận rồi đấy.',
      sold: 'Trồng hoa thật đẹp nhé, cô sẽ ra cắt hoa về cắm quán!',
    },
  },
  duy_plot: {
    name: 'Vườn thực hành của thầy Duy', owner: 'anh_duy', x: -9.6, z: 10.0, price: 4000, minHearts: 6, level: 6,
    story: 'Thầy Duy định làm vườn thực hành cho học trò, nhưng thấy bạn chăm vườn giỏi hơn.',
    lines: {
      refuse: 'Mình định cho học trò trồng cây ở đây... khi nào thân hơn mình mới bán được.',
      no: 'Hôm nay mình bận chấm bài quá, hôm khác nhé!',
      happy: 'Bạn mua đi, rồi thỉnh thoảng cho học trò mình sang học trồng hoa nhé!',
      grumpy: 'Giá này là mình tính kỹ lắm rồi đó.',
      bargainOk: 'Thôi được, bạn bè với nhau mà, mình bớt!',
      bargainNo: 'Bạn mặc cả ghê quá... hôm nay mình không bán nữa.',
      sold: 'Đất là của bạn rồi! Nhớ để học trò mình sang ngắm hoa nhé.',
    },
  },
};
