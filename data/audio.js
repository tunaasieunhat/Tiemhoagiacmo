// =============================================================
//  ÂM THANH, HIỆU ỨNG CHẠM & INTRO — chỉnh số liệu tại đây
//  (Người chơi tự chỉnh âm lượng / bật tắt trong ⚙️ Cài đặt; lựa chọn đó lưu trên từng máy.)
// =============================================================
export const AUDIO = {
  music: {
    volume: 0.45,       // âm lượng nhạc nền mặc định (0 = tắt, 1 = to nhất)
    fadeInSeconds: 2,   // thời gian nhạc to dần khi bắt đầu một bài
    shuffle: true,      // true = bắt đầu từ một bài ngẫu nhiên; sau đó phát lần lượt và lặp lại cả danh sách
    // File nằm trong thư mục public/audio/
    tracks: [
      { file: 'audio/petals-beneath-the-rain.mp3', title: 'Petals Beneath the Rain' },
      { file: 'audio/where-the-petals-sway.mp3', title: 'Where the Petals Sway' },
      { file: 'audio/where-the-grass-bends.mp3', title: 'Where the Grass Bends' },
    ],
    // (0.22.1) Nhạc riêng từng vùng: khi máy quay ở vùng đó thì chỉ phát các bài này (thay cho tracks ở trên)
    areas: {
      en: [ // 🌫️ Mũi Én
        { file: 'audio/saltwater-and-petals.mp3', title: 'Saltwater and Petals' },
        { file: 'audio/petals-at-first-light.mp3', title: 'Petals at First Light' },
      ],
    },
    crossfadeSeconds: 1.5, // đổi vùng: nhạc cũ nhỏ dần trong bấy nhiêu giây rồi mới sang bài của vùng mới
  },

  sfx: {
    volume: 0.6,        // âm lượng tiếng "tách" khi chạm nút / chạm vào nông trại (0 = tắt)
  },

  tap: {
    enabled: true,      // hiệu ứng cánh hoa bung ra ở chỗ chạm
    petals: 6,          // số cánh hoa mỗi lần chạm
    spreadPx: 34,       // cánh hoa bay xa bao nhiêu điểm ảnh
    colors: ['#ff8fb1', '#ffc2d4', '#ffd36e', '#b9a2ff', '#8fd8ff'],
  },

  intro: {
    enabled: true,          // phát intro khi mở game (hiệu ứng vẽ trong game, không dùng file video)
    brand: 'DREAMER',       // chữ lớn
    sub: 'GAMES',           // chữ nhỏ bên dưới
    title: 'Tiệm Hoa Giấc Mơ',
    seconds: 5,             // tổng thời gian intro (giây)
    showSkipAfter: 0.6,     // hiện nút "Bỏ qua" sau bao nhiêu giây (chạm vào màn hình cũng bỏ qua được)
    stars: 80,              // số ngôi sao / cánh hoa bay
  },
};
