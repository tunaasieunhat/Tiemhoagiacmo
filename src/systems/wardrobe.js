// 👗 Tủ đồ (GĐ26) — logic thuần. save.wardrobe = { owned: { mã: 1 }, wear: { ô: mã } }
// Hình dáng nhân vật = save.player.avatar (màu da, màu tóc gốc) + thuộc tính của các món đang mặc.
import { WARDROBE, STARTER_WEAR, SLOTS } from '../../data/wardrobe.js';

const fail = (msg) => ({ ok: false, msg });
export const ITEM_IDS = Object.keys(WARDROBE);

export function W(save) {
  save.wardrobe = save.wardrobe || { owned: {}, wear: {} };
  const w = save.wardrobe;
  w.owned = w.owned || {};
  w.wear = w.wear || {};
  for (const id of ITEM_IDS) if (WARDROBE[id].price === 0 && WARDROBE[id].src === 'shop') w.owned[id] = 1; // đồ cơ bản có sẵn
  return w;
}

export const owns = (save, id) => !!W(save).owned[id];

/** Hình dáng hiện tại để dựng nhân vật / ảnh đại diện */
export function lookOf(save) {
  const base = { ...(save.player?.avatar || {}) };
  const w = save.wardrobe;
  if (!w || !Object.keys(w.wear || {}).length) return base; // chưa từng mở tủ đồ: giữ nguyên như cũ
  for (const slot of Object.keys(SLOTS)) {
    const it = WARDROBE[w.wear[slot]];
    if (it) Object.assign(base, it.set);
  }
  if (w.hair) base.hair = w.hair;
  return base;
}

/** Món đang mặc ở 1 ô (mặc định theo STARTER_WEAR) */
export const wearing = (save, slot) => W(save).wear[slot] || STARTER_WEAR[slot];

export function wear(save, id) {
  const it = WARDROBE[id];
  if (!it) return fail('Không rõ');
  if (!owns(save, id)) return fail('Bạn chưa có món này');
  const w = W(save);
  if (!Object.keys(w.wear).length) Object.assign(w.wear, STARTER_WEAR, keepBase(save));
  w.wear[it.slot] = id;
  return { ok: true, msg: `👗 Đã mặc ${it.name}` };
}

/** Lần đầu mặc: chọn món gần với hình dáng cũ nhất (mũ rơm / không mũ, búi tóc) */
function keepBase(save) {
  const a = save.player?.avatar || {};
  return { hat: a.hat ? 'hat_straw' : 'hat_none', hair: a.bun ? 'hair_bun' : 'hair_short' };
}

export function buy(save, id) {
  const it = WARDROBE[id];
  if (!it || it.src !== 'shop') return fail('Món này không bán ở cửa hàng');
  if (owns(save, id)) return fail('Đã có rồi');
  if (save.player.coins < it.price) return fail(`Cần ${it.price.toLocaleString('vi-VN')} 💰`);
  save.player.coins -= it.price;
  save.stats.spent = (save.stats.spent || 0) + it.price;
  W(save).owned[id] = 1;
  return { ok: true, msg: `🛍️ Đã mua ${it.icon} ${it.name}!` };
}

/** Nhận món từ quà (Khu Vui Chơi, Sổ thưởng, điểm danh, truyện). Trả về true nếu là món mới */
export function grant(save, id) {
  if (!WARDROBE[id]) return false;
  const w = W(save);
  if (w.owned[id]) return false;
  w.owned[id] = 1;
  return true;
}

export function setHairColor(save, color) { W(save).hair = color; if (!Object.keys(W(save).wear).length) Object.assign(W(save).wear, STARTER_WEAR, keepBase(save)); }
export const ownedCount = (save) => ITEM_IDS.filter((id) => owns(save, id)).length;
