// =============================================================
//  GIẤY GÓI & RUY BĂNG
//  tones : hợp với tông màu nào (dùng khi chấm điểm bó hoa)
//  free  : miễn phí, không giới hạn
//  price : giá mua (Khu Chợ, Giai đoạn 4) — cũng được cộng vào giá bó hoa
// =============================================================
export const PAPERS = {
  kraft: { name: 'Giấy kraft', color: '#d9b48a', tones: ['natural', 'warm'], free: true, price: 0 },
  cream: { name: 'Giấy kem', color: '#fbefd9', tones: ['pastel', 'natural'], price: 6 },
  pink: { name: 'Giấy hồng phấn', color: '#f8c6d4', tones: ['pastel', 'warm'], price: 8 },
  sky: { name: 'Giấy xanh nhạt', color: '#bfe0f5', tones: ['cool', 'pastel'], price: 8 },
  red: { name: 'Giấy đỏ', color: '#e86a6a', tones: ['warm'], price: 10 },
};

export const RIBBONS = {
  twine: { name: 'Dây đay', color: '#b48a5a', tones: ['natural'], free: true, price: 0 },
  white: { name: 'Ruy băng trắng', color: '#ffffff', tones: ['cool', 'pastel', 'natural'], price: 4 },
  pink: { name: 'Ruy băng hồng', color: '#f47a93', tones: ['warm', 'pastel'], price: 5 },
  purple: { name: 'Ruy băng tím', color: '#a674dc', tones: ['cool'], price: 5 },
  gold: { name: 'Ruy băng vàng', color: '#f4c430', tones: ['warm'], price: 6 },
};

// Số lượng khởi đầu cho người chơi
export const STARTER_WRAPS = {
  papers: { cream: 6, pink: 6, sky: 4, red: 3 },
  ribbons: { white: 6, pink: 6, purple: 3, gold: 3 },
};
