// =============================================================
//  KHÁCH VÃNG LAI (Giai đoạn 6 sẽ thêm khách quen có câu chuyện riêng)
//  self: cách khách tự xưng · look: màu nhân vật chibi
// =============================================================
export const CUSTOMERS = [
  { id: 'lan', name: 'Cô Lan', self: 'cô', look: { skin: '#ffe0c7', hair: '#4a3328', outfit: '#f6a6b9', hat: null, bun: true } },
  { id: 'minh', name: 'Anh Minh', self: 'anh', look: { skin: '#f8cfae', hair: '#2f2a2a', outfit: '#8fc9e8', hat: null } },
  { id: 'thao', name: 'Chị Thảo', self: 'chị', look: { skin: '#ffe0c7', hair: '#6b4433', outfit: '#c8b4f0', hat: '#ffffff', bun: true } },
  { id: 'tu', name: 'Bà Tư', self: 'bà', look: { skin: '#f8cfae', hair: '#dcdcdc', outfit: '#a6dd94', hat: null, bun: true } },
  { id: 'na', name: 'Bé Na', self: 'con', look: { skin: '#ffe0c7', hair: '#e07a52', outfit: '#ffd34e', hat: '#f6a6b9' } },
  { id: 'hai', name: 'Chú Hải', self: 'chú', look: { skin: '#e8b48f', hair: '#3b3b3b', outfit: '#9fe0c4', hat: '#8fc9e8' } },
  { id: 'vy', name: 'Em Vy', self: 'em', look: { skin: '#ffe0c7', hair: '#f29bb2', outfit: '#fff0a8', hat: null, bun: true } },
  { id: 'khoa', name: 'Anh Khoa', self: 'anh', look: { skin: '#c98e66', hair: '#2f2a2a', outfit: '#ffb38a', hat: '#f6d67a' } },
  { id: 'mai', name: 'Chị Mai', self: 'chị', look: { skin: '#f8cfae', hair: '#8a5a3b', outfit: '#bfe0f5', hat: null } },
  { id: 'sau', name: 'Ông Sáu', self: 'ông', look: { skin: '#e8b48f', hair: '#e8e8e8', outfit: '#d9b48a', hat: '#c9a27e' } },
];

// Câu nói khi nhận hoa (theo mức hài lòng)
export const REACTIONS = {
  perfect: ['Đẹp quá trời luôn! Cảm ơn nhiều nha!', 'Đúng ý {self} luôn đó!', 'Tiệm này đỉnh thật, lần sau {self} lại ghé!'],
  good: ['Đẹp lắm, cảm ơn nhé!', 'Ưng ý ghê!', 'Hoa tươi quá!'],
  ok: ['Cũng được, cảm ơn nhé.', 'Ừm... tạm ổn.'],
  bad: ['Không giống {self} tưởng lắm...', 'Lần sau làm đẹp hơn nha.'],
  timeout: ['Chờ lâu quá, {self} đi đây...', 'Thôi {self} ghé tiệm khác vậy.'],
  decline: ['Ồ, tiếc quá...', 'Vậy {self} đi chỗ khác nhé.'],
};
