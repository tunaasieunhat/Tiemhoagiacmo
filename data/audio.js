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
    enabled: true,          // phát video intro khi mở game
    file: 'intro.mp4',      // file trong thư mục public/
    background: '#06090d',  // màu nền quanh video (khớp màu nền của video)
    showSkipAfter: 0.8,     // hiện nút "Bỏ qua" sau bao nhiêu giây
    maxWaitSeconds: 6,      // video không tải được sau bấy nhiêu giây thì bỏ qua để vào game
  },
};
