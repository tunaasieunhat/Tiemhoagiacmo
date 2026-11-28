// =============================================================
//  👗 TỦ ĐỒ (GĐ26 · Lễ Hội Đảo Mây)
//  Mỗi món thuộc 1 ô (slot) và "set" các thuộc tính hình dáng nhân vật (xem src/models/character.js):
//    hairStyle: short | long | twin | bob | curly | spiky | pony | bun
//    hat (màu) + hatKind: straw | cap | beanie | bow | flower | bunny | crown | leaf | chef | beret · hat: null = không đội
//    top: tee | hoodie | overall | dress | aodai | raincoat | apron | sweater · outfit (màu chính) · trim (màu phụ)
//    shoes (màu giày) · bag: backpack | basket | flowerbag (+ bagColor) · glasses: round | sun | star | heart
//  src: nơi có món — shop (mua bằng 💰) · fun (đổi 🪙 Xu Vui ở Khu Vui Chơi) · pass (Sổ thưởng mùa) · checkin (điểm danh) · story (cốt truyện)
// =============================================================

export const SLOTS = {
  hair: { name: 'Kiểu tóc', icon: '💇' },
  hat: { name: 'Mũ', icon: '🎩' },
  top: { name: 'Trang phục', icon: '👕' },
  shoes: { name: 'Giày', icon: '👟' },
  bag: { name: 'Túi', icon: '🎒' },
  face: { name: 'Kính', icon: '👓' },
};

// Màu tóc đổi miễn phí
export const HAIR_COLORS = ['#3b2a22', '#6b4433', '#2a1f1c', '#8a5a3a', '#c9925a', '#e8c27a', '#d9805a', '#9a9aa8', '#f2a6c0', '#8fb7e8'];

export const WARDROBE = {
  // ---------------- 💇 tóc
  hair_short: { slot: 'hair', name: 'Tóc ngắn', icon: '💇', price: 0, src: 'shop', set: { hairStyle: 'short', bun: false } },
  hair_long: { slot: 'hair', name: 'Tóc dài thả', icon: '💁', price: 600, src: 'shop', set: { hairStyle: 'long', bun: false } },
  hair_twin: { slot: 'hair', name: 'Tóc hai bím', icon: '🎀', price: 700, src: 'shop', set: { hairStyle: 'twin', bun: false } },
  hair_bob: { slot: 'hair', name: 'Tóc bob', icon: '💇‍♀️', price: 600, src: 'shop', set: { hairStyle: 'bob', bun: false } },
  hair_bun: { slot: 'hair', name: 'Búi tóc', icon: '🍡', price: 500, src: 'shop', set: { hairStyle: 'short', bun: true } },
  hair_pony: { slot: 'hair', name: 'Đuôi ngựa', icon: '🐴', price: 700, src: 'shop', set: { hairStyle: 'pony', bun: false } },
  hair_curly: { slot: 'hair', name: 'Tóc xoăn mây', icon: '☁️', price: 900, src: 'fun', cost: 60, set: { hairStyle: 'curly', bun: false } },
  hair_spiky: { slot: 'hair', name: 'Tóc dựng ngầu', icon: '⚡', price: 900, src: 'fun', cost: 60, set: { hairStyle: 'spiky', bun: false } },

  // ---------------- 🎩 mũ
  hat_none: { slot: 'hat', name: 'Không đội mũ', icon: '🚫', price: 0, src: 'shop', set: { hat: null } },
  hat_straw: { slot: 'hat', name: 'Mũ rơm', icon: '👒', price: 0, src: 'shop', set: { hat: '#f6d67a', hatKind: 'straw' } },
  hat_cap: { slot: 'hat', name: 'Mũ lưỡi trai', icon: '🧢', price: 400, src: 'shop', set: { hat: '#6fb7e0', hatKind: 'cap' } },
  hat_beanie: { slot: 'hat', name: 'Mũ len', icon: '🧶', price: 450, src: 'shop', set: { hat: '#f47a93', hatKind: 'beanie' } },
  hat_bow: { slot: 'hat', name: 'Nơ to', icon: '🎀', price: 500, src: 'shop', set: { hat: '#ff8fb1', hatKind: 'bow' } },
  hat_beret: { slot: 'hat', name: 'Mũ nồi họa sĩ', icon: '🎨', price: 650, src: 'shop', set: { hat: '#c84a4a', hatKind: 'beret' } },
  hat_chef: { slot: 'hat', name: 'Mũ đầu bếp', icon: '👨‍🍳', price: 800, src: 'shop', set: { hat: '#ffffff', hatKind: 'chef' } },
  hat_flower: { slot: 'hat', name: 'Vòng hoa', icon: '🌸', price: 0, src: 'fun', cost: 50, set: { hat: '#8fd18b', hatKind: 'flower' } },
  hat_bunny: { slot: 'hat', name: 'Bờm tai thỏ', icon: '🐰', price: 0, src: 'fun', cost: 80, set: { hat: '#ffffff', hatKind: 'bunny' } },
  hat_leaf: { slot: 'hat', name: 'Mầm lá trên đầu', icon: '🌱', price: 0, src: 'checkin', set: { hat: '#7cc27f', hatKind: 'leaf' } },
  hat_crown: { slot: 'hat', name: 'Vương miện hoa', icon: '👑', price: 0, src: 'pass', set: { hat: '#ffd36e', hatKind: 'crown' } },

  // ---------------- 👕 trang phục
  top_tee_blue: { slot: 'top', name: 'Áo thun xanh', icon: '👕', price: 0, src: 'shop', set: { top: 'tee', outfit: '#8fc9e8' } },
  top_tee_pink: { slot: 'top', name: 'Áo thun hồng', icon: '👕', price: 200, src: 'shop', set: { top: 'tee', outfit: '#f6a6b9' } },
  top_tee_yellow: { slot: 'top', name: 'Áo thun vàng', icon: '👕', price: 200, src: 'shop', set: { top: 'tee', outfit: '#ffd36e' } },
  top_hoodie: { slot: 'top', name: 'Áo hoodie tím', icon: '🧥', price: 700, src: 'shop', set: { top: 'hoodie', outfit: '#b9a2ff', trim: '#ffffff' } },
  top_overall: { slot: 'top', name: 'Yếm làm vườn', icon: '👖', price: 650, src: 'shop', set: { top: 'overall', outfit: '#6f9fd8', trim: '#fff3e0' } },
  top_apron: { slot: 'top', name: 'Tạp dề tiệm hoa', icon: '🌷', price: 550, src: 'shop', set: { top: 'apron', outfit: '#f6a6b9', trim: '#fffaf3' } },
  top_sweater: { slot: 'top', name: 'Áo len kẻ sọc', icon: '🧶', price: 750, src: 'shop', set: { top: 'sweater', outfit: '#f4c34e', trim: '#ffffff' } },
  top_raincoat: { slot: 'top', name: 'Áo mưa vàng', icon: '☔', price: 800, src: 'shop', set: { top: 'raincoat', outfit: '#ffd84d', trim: '#ffffff' } },
  top_dress_pink: { slot: 'top', name: 'Váy hoa hồng', icon: '👗', price: 900, src: 'shop', set: { top: 'dress', outfit: '#f6a6b9', trim: '#ffffff' } },
  top_dress_mint: { slot: 'top', name: 'Váy bạc hà', icon: '👗', price: 0, src: 'fun', cost: 90, set: { top: 'dress', outfit: '#9fd6c8', trim: '#ffffff' } },
  top_aodai: { slot: 'top', name: 'Áo dài trắng', icon: '🤍', price: 1600, src: 'shop', set: { top: 'aodai', outfit: '#fffaf3', trim: '#ffffff' } },
  top_aodai_red: { slot: 'top', name: 'Áo dài đỏ Tết', icon: '🧧', price: 0, src: 'checkin', set: { top: 'aodai', outfit: '#d93a4a', trim: '#ffd36e' } },
  top_festival: { slot: 'top', name: 'Áo lễ hội Đảo Mây', icon: '🎆', price: 0, src: 'story', set: { top: 'hoodie', outfit: '#ff9a5c', trim: '#ffd36e' } },
  top_star: { slot: 'top', name: 'Váy sao đêm', icon: '🌌', price: 0, src: 'pass', set: { top: 'dress', outfit: '#3f4a8a', trim: '#ffd36e' } },

  // ---------------- 👟 giày
  shoes_brown: { slot: 'shoes', name: 'Giày nâu', icon: '👞', price: 0, src: 'shop', set: { shoes: '#8a5a3a' } },
  shoes_white: { slot: 'shoes', name: 'Giày trắng', icon: '👟', price: 250, src: 'shop', set: { shoes: '#ffffff' } },
  shoes_red: { slot: 'shoes', name: 'Giày đỏ', icon: '👠', price: 300, src: 'shop', set: { shoes: '#e8384f' } },
  shoes_boots: { slot: 'shoes', name: 'Ủng làm vườn', icon: '🥾', price: 350, src: 'shop', set: { shoes: '#7cc27f' } },
  shoes_gold: { slot: 'shoes', name: 'Giày vàng lấp lánh', icon: '✨', price: 0, src: 'pass', set: { shoes: '#f2c14e' } },

  // ---------------- 🎒 túi
  bag_none: { slot: 'bag', name: 'Không đeo túi', icon: '🚫', price: 0, src: 'shop', set: { bag: null } },
  bag_backpack: { slot: 'bag', name: 'Ba lô', icon: '🎒', price: 450, src: 'shop', set: { bag: 'backpack', bagColor: '#f47a93' } },
  bag_basket: { slot: 'bag', name: 'Giỏ hoa', icon: '🧺', price: 500, src: 'shop', set: { bag: 'basket', bagColor: '#d9b48a' } },
  bag_flower: { slot: 'bag', name: 'Túi bông hoa', icon: '🌼', price: 0, src: 'fun', cost: 70, set: { bag: 'flowerbag', bagColor: '#ffd36e' } },

  // ---------------- 👓 kính
  face_none: { slot: 'face', name: 'Không đeo kính', icon: '🚫', price: 0, src: 'shop', set: { glasses: null } },
  face_round: { slot: 'face', name: 'Kính tròn', icon: '👓', price: 350, src: 'shop', set: { glasses: 'round' } },
  face_sun: { slot: 'face', name: 'Kính râm', icon: '🕶️', price: 450, src: 'shop', set: { glasses: 'sun' } },
  face_star: { slot: 'face', name: 'Kính ngôi sao', icon: '⭐', price: 0, src: 'fun', cost: 60, set: { glasses: 'star' } },
  face_heart: { slot: 'face', name: 'Kính trái tim', icon: '💗', price: 0, src: 'pass', set: { glasses: 'heart' } },
};

// Mặc định (người chơi đang có sẵn, không tốn tiền)
export const STARTER_WEAR = { hair: 'hair_short', hat: 'hat_straw', top: 'top_tee_blue', shoes: 'shoes_brown', bag: 'bag_none', face: 'face_none' };
