// 🏡 Nhà của bạn (GĐ24) — LOGIC THUẦN.
// save.home = { wall, roof, door, colors: { 'wall:pink': 1 }, items: { mailbox: 1 }, off: { mailbox: 1 } }
//  colors: màu đã mua · items: vật phẩm đã mua · off: vật phẩm đang tắt (cất đi)
import { HOME_COLORS, HOME_ITEMS } from '../../data/home.js';

export const createHomeState = () => ({ wall: 'cream', roof: 'coral', door: 'wood', colors: {}, items: {}, off: {} });

export function H(save) {
  save.home = save.home || createHomeState();
  const h = save.home;
  h.colors = h.colors || {}; h.items = h.items || {}; h.off = h.off || {};
  for (const part of Object.keys(HOME_COLORS)) if (!HOME_COLORS[part][h[part]]) h[part] = Object.keys(HOME_COLORS[part])[0];
  return h;
}

export const ownsColor = (save, part, id) => !HOME_COLORS[part]?.[id]?.price || !!H(save).colors[`${part}:${id}`];

/** Chọn màu (chưa có thì mua). Trả về { ok, msg, cost } */
export function setColor(save, part, id) {
  const def = HOME_COLORS[part]?.[id];
  if (!def) return { ok: false, msg: 'Không có màu này' };
  const h = H(save);
  let cost = 0;
  if (!ownsColor(save, part, id)) {
    if ((def.level || 0) > save.player.level) return { ok: false, msg: `Cần cấp ${def.level}` };
    if (save.player.coins < def.price) return { ok: false, msg: 'Không đủ tiền' };
    save.player.coins -= def.price;
    h.colors[`${part}:${id}`] = 1;
    cost = def.price;
  }
  h[part] = id;
  return { ok: true, cost, msg: cost ? `Đã mua màu ${def.name}: -${cost} 💰` : `Đã đổi sang ${def.name}` };
}

/** Mua vật phẩm, hoặc bật/tắt nếu đã có. Trả về { ok, msg, cost, on } */
export function toggleItem(save, id) {
  const def = HOME_ITEMS[id];
  if (!def) return { ok: false, msg: 'Không có vật phẩm này' };
  const h = H(save);
  if (!h.items[id]) {
    if ((def.level || 0) > save.player.level) return { ok: false, msg: `Cần cấp ${def.level}` };
    if (save.player.coins < def.price) return { ok: false, msg: 'Không đủ tiền' };
    save.player.coins -= def.price;
    h.items[id] = 1;
    delete h.off[id];
    return { ok: true, cost: def.price, on: true, msg: `Đã gắn ${def.name}: -${def.price} 💰` };
  }
  if (h.off[id]) delete h.off[id]; else h.off[id] = 1;
  return { ok: true, cost: 0, on: !h.off[id], msg: h.off[id] ? `Đã cất ${def.name}` : `Đã bày lại ${def.name}` };
}

/** Trạng thái để dựng mô hình: { wall, roof, door (mã màu), items: [id đang bật] } */
export function homeLook(save) {
  const h = H(save);
  return {
    wall: HOME_COLORS.wall[h.wall].color, roof: HOME_COLORS.roof[h.roof].color, door: HOME_COLORS.door[h.door].color,
    items: Object.keys(h.items).filter((k) => HOME_ITEMS[k] && !h.off[k]),
  };
}
