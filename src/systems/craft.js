// =============================================================
//  🌸 TIỆM HƯƠNG NHÀI (GĐ23) — LOGIC THUẦN (không DOM / three)
//  save.craft = {
//    ing:   { mãNguyênLiệu: số }          nguyên liệu đang có
//    goods: { 'mãSảnPhẩm|sao': số }       hàng làm xong đang bày trên kệ (sao 0–3 = chất lượng mẻ)
//    pages: { 0: 1, ... }                 trang Sổ Hương đã mở (làm món đó lần đầu)
//    count: { 'made:x': n, 'sold:x': n, 'gather:x': n, 'play:x': n }   bộ đếm (cốt truyện dùng)
//    gday:  { chỗHái: { day, n } }        số lần hái trong ngày
//    sellAt: phút game lần cuối có khách ghé · earned: tổng tiền đã bán
//  }
// =============================================================
import { INGREDIENTS, GATHER, PRODUCTS, CRAFT_RULES } from '../../data/huong.js';
import { parseFlowerKey } from './variants.js';

export const createCraftState = () => ({ ing: {}, goods: {}, pages: {}, count: {}, gday: {}, sellAt: 0, earned: 0 });

export function C(save) {
  save.craft = save.craft || createCraftState();
  const c = save.craft;
  for (const k of ['ing', 'goods', 'pages', 'count', 'gday']) c[k] = c[k] || {};
  c.sellAt = c.sellAt || 0; c.earned = c.earned || 0;
  return c;
}

const inc = (c, key, n = 1) => { c.count[key] = (c.count[key] || 0) + n; };
export const countOf = (save, key) => C(save).count[key] || 0;
export const ingOf = (save, id) => C(save).ing[id] || 0;
export const pageCount = (save) => Object.keys(C(save).pages).length;
export const PRODUCT_IDS = Object.keys(PRODUCTS);

/** Chỗ hái có mở không: { ok, msg, left } — has(dấu) do game truyền (dấu cốt truyện / cảnh đã xem) */
export function gatherOpen(save, spotId, { hour = 12, day = 1, has = () => true } = {}) {
  const g = GATHER[spotId];
  if (!g) return { ok: false, msg: 'Không có chỗ này' };
  if (g.need && !has(g.need)) return { ok: false, msg: 'Chỗ này chưa mở. Theo cốt truyện 🌸 Ngàn Hương nhé!' };
  if (g.story && g.give.oldwax && ingOf(save, 'oldwax') > 0) return { ok: false, msg: 'Bạn đã có sáp tổ đa cổ rồi.' };
  if (g.hours && (hour < g.hours[0] || hour >= g.hours[1])) return { ok: false, msg: `${g.name} chỉ hái được từ ${g.hours[0]} giờ tới ${g.hours[1]} giờ (lúc sương còn đọng).` };
  const used = C(save).gday[spotId]?.day === day ? C(save).gday[spotId].n : 0;
  const left = g.perDay - used;
  if (left <= 0) return { ok: false, msg: `Hôm nay hái ở ${g.name} đủ rồi. Mai quay lại nhé!`, left: 0 };
  return { ok: true, left };
}

/**
 * Ghi kết quả 1 lần hái (sau mini game). stars 0..3. rng để chọn nguyên liệu bất kỳ ('any').
 * Trả về { ok, got: { id: n }, msg }
 */
export function gather(save, spotId, stars, { day = 1, rng = Math.random } = {}) {
  const c = C(save), g = GATHER[spotId];
  if (!g) return { ok: false, msg: 'Không có chỗ này' };
  const d = c.gday[spotId];
  c.gday[spotId] = { day, n: d?.day === day ? d.n + 1 : 1 };
  inc(c, `play:${g.game}`);
  if (stars <= 0) return { ok: true, got: {}, msg: 'Lần này chưa hái được gì. Thử lại nhé!' };
  const got = {};
  for (const [id, arr] of Object.entries(g.give)) {
    const n = arr[Math.min(arr.length, stars) - 1] || 0;
    if (!n) continue;
    if (id === 'any') {
      const pool = Object.keys(INGREDIENTS).filter((k) => !INGREDIENTS[k].story && !INGREDIENTS[k].buy);
      for (let i = 0; i < n; i++) { const k = pool[Math.floor(rng() * pool.length)]; got[k] = (got[k] || 0) + 1; }
    } else got[id] = (got[id] || 0) + n;
  }
  for (const [id, n] of Object.entries(got)) { c.ing[id] = (c.ing[id] || 0) + n; inc(c, `gather:${id}`, n); }
  return { ok: true, got };
}

/** Thêm nguyên liệu (cảnh truyện, quà) */
export function addIng(save, id, n = 1) { const c = C(save); c.ing[id] = (c.ing[id] || 0) + n; inc(c, `gather:${id}`, n); }

/** Mua nguyên liệu bán ở tiệm (đường phèn). Trả về { ok, msg, cost } */
export function buyIng(save, id, n = 1) {
  const def = INGREDIENTS[id];
  if (!def?.buy) return { ok: false, msg: 'Món này không bán' };
  const cost = def.buy * n;
  if (save.player.coins < cost) return { ok: false, msg: 'Không đủ tiền' };
  save.player.coins -= cost;
  addIng(save, id, n);
  return { ok: true, cost, msg: `Mua ${n} ${def.name}: -${cost} 💰` };
}

/** Số bông của 1 loài trong kho (mọi màu, mọi sao) */
export function flowerCount(save, species) {
  let n = 0;
  for (const [k, v] of Object.entries(save.inventory.flowers || {})) if (v > 0 && parseFlowerKey(k).species === species) n += v;
  return n;
}

/** Công thức đã mở chưa (has = hàm xét dấu / cảnh đã xem) */
export const known = (id, has) => !!PRODUCTS[id] && has(PRODUCTS[id].unlock);

/** Thiếu gì để làm 1 mẻ: [{ kind: 'ing'|'flower', id, need, have }] */
export function missing(save, id) {
  const p = PRODUCTS[id], out = [];
  for (const [k, n] of Object.entries(p.ing || {})) { const have = ingOf(save, k); if (have < n) out.push({ kind: 'ing', id: k, need: n, have }); }
  for (const [sp, n] of Object.entries(p.flowers || {})) { const have = flowerCount(save, sp); if (have < n) out.push({ kind: 'flower', id: sp, need: n, have }); }
  return out;
}

/** Có làm được không: { ok, msg } */
export function canMake(save, id, has = () => true) {
  const p = PRODUCTS[id];
  if (!p) return { ok: false, msg: 'Không có công thức này' };
  if (!known(id, has)) return { ok: false, msg: 'Chưa biết công thức này' };
  if (p.once && countOf(save, `made:${id}`)) return { ok: false, msg: 'Chai hương này chỉ pha một lần.' };
  if (missing(save, id).length) return { ok: false, msg: 'Chưa đủ nguyên liệu' };
  return { ok: true };
}

/** Trừ hoa: lấy hoa ÍT SAO NHẤT trước (hoa xấu cũng dùng được) */
function takeFlowers(save, species, n) {
  const inv = save.inventory.flowers;
  const keys = Object.keys(inv).filter((k) => inv[k] > 0 && parseFlowerKey(k).species === species).sort((a, b) => parseFlowerKey(a).q - parseFlowerKey(b).q);
  for (const k of keys) { if (n <= 0) break; const t = Math.min(n, inv[k]); inv[k] -= t; n -= t; }
}

/**
 * Làm 1 mẻ sau mini game chế biến (stars 0..3). Trừ nguyên liệu + hoa, thêm hàng lên kệ.
 * Trả về { ok, made: số món, q, firstPage: số trang vừa mở | null, msg }
 */
export function make(save, id, stars, has = () => true) {
  const can = canMake(save, id, has);
  if (!can.ok) return can;
  const c = C(save), p = PRODUCTS[id];
  for (const [k, n] of Object.entries(p.ing || {})) c.ing[k] -= n;
  for (const [sp, n] of Object.entries(p.flowers || {})) takeFlowers(save, sp, n);
  const q = Math.max(0, Math.min(3, stars | 0));
  const made = p.once ? 1 : CRAFT_RULES.yield[q];
  if (p.sell !== false) c.goods[`${id}|${q}`] = (c.goods[`${id}|${q}`] || 0) + made;
  inc(c, `made:${id}`, made);
  inc(c, 'made', made);
  let firstPage = null;
  if (p.page != null && !c.pages[p.page]) { c.pages[p.page] = 1; firstPage = p.page; }
  return { ok: true, made, q, firstPage };
}

export const priceOf = (id, q) => Math.round(PRODUCTS[id].price * CRAFT_RULES.qMult[Math.max(0, Math.min(3, q))]);
export const goodsList = (save) => Object.entries(C(save).goods).filter(([, n]) => n > 0).map(([k, n]) => { const [id, q] = k.split('|'); return { key: k, id, q: +q, n, price: priceOf(id, +q) }; });
export const goodsCount = (save) => goodsList(save).reduce((a, g) => a + g.n, 0);

function sellKey(save, key, n, mult = 1) {
  const c = C(save), [id, q] = key.split('|');
  const have = c.goods[key] || 0;
  n = Math.min(n, have);
  if (n <= 0) return 0;
  c.goods[key] = have - n;
  const coins = Math.round(priceOf(id, +q) * mult) * n;
  save.player.coins += coins;
  c.earned += coins;
  inc(c, `sold:${id}`, n);
  inc(c, 'sold', n);
  return coins;
}

/** "Bán ngay cho Sen" (rẻ hơn): bán hết 1 loại hàng. Trả về { ok, coins, n } */
export function quickSell(save, key) {
  const n = C(save).goods[key] || 0;
  if (!n) return { ok: false, msg: 'Hết hàng rồi' };
  const coins = sellKey(save, key, n, CRAFT_RULES.quick);
  return { ok: true, coins, n };
}

/**
 * Khách du lịch ghé mua theo thời gian (gọi khi thời gian trôi). from/to = phút game.
 * open: tiệm đã mở cửa (cốt truyện). Trả về [{ id, q, coins }] những món vừa bán.
 */
export function shopTick(save, from, to, { open = false, offline = false, rng = Math.random } = {}) {
  const c = C(save), out = [];
  if (!open) { c.sellAt = to; return out; }
  if (!c.sellAt || c.sellAt > to) c.sellAt = from;
  const every = CRAFT_RULES.sellEvery / (offline ? CRAFT_RULES.offlineRate : 1);
  let guard = 0;
  while (c.sellAt + every <= to && guard++ < 400) {
    c.sellAt += every;
    const hour = (c.sellAt % 1440) / 60;
    if (hour < CRAFT_RULES.open[0] || hour >= CRAFT_RULES.open[1]) continue;
    const list = goodsList(save);
    if (!list.length) continue;
    // khách thích món đắt + nhiều hàng hơn một chút
    const tot = list.reduce((a, g) => a + g.n, 0);
    let r = rng() * tot, pick = list[0];
    for (const g of list) { r -= g.n; if (r <= 0) { pick = g; break; } }
    const coins = sellKey(save, pick.key, 1);
    out.push({ id: pick.id, q: pick.q, coins });
  }
  return out;
}

/** Mức khó mini game theo số lần đã chơi: dễ → vừa (lần 6) → khó (lần 16) */
export const levelOf = (save, kind) => { const p = save.mg?.[kind]?.plays || 0; return p >= 16 ? 2 : p >= 6 ? 1 : 0; };
