// =============================================================
//  🎬 KHUNG QUẢNG CÁO BẢN MỚI — video giới thiệu hiện 1 lần sau khi cập nhật (bấm ✕ để thoát)
//  Đổi `id` khi có video mới ⇒ người chơi sẽ được xem lại 1 lần. Để `video: ''` nếu không muốn hiện.
// =============================================================
export const PROMO = {
  id: '0.28',                              // mã video: đã xem mã này rồi thì không tự hiện nữa
  video: 'promo/cap-nhat-0.28.mp4',        // file trong thư mục public/
  poster: 'promo/cap-nhat-0.28.jpg',       // ảnh chờ khi video đang tải
  title: '🌸 Có gì mới trong bản 0.28',
  sub: 'Câu cá làm mới · khách tâm sự · dòng giống & đất · giá chợ · đời sống làng',
  delaySeconds: 6,                         // vào game bao lâu thì hiện (đợi cảnh mở đầu / bảng khác đóng)
  newPlayers: false,                       // người chơi mới (chưa xong hướng dẫn) có hiện không
};
