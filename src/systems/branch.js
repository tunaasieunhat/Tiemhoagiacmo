// =============================================================
//  🏪 CHI NHÁNH (GĐ25) — logic thuần
//  save.branch = { b: { id: { open, lvl, stock: { mã: n }, till, sold, earned, acc } }, boats: [{ id, at, items }], ships, earned }
//  Mã hàng trong kho chi nhánh: hoa 'loài:màu|sao' · hàng chế biến 'g:mã|sao'
// =============================================================
import { BRANCHES, BRANCH_RULES } from '../../data/branch.js';
import { FLOWERS } from '../../data/flowers.js';
import { PRODUCTS } from '../../data/huong.js';
import { parseFlowerKey, rarityOf } from './variants.js';
import { C as craftState, priceOf } from './craft.js';

const fail = (msg) => ({ ok: false, msg });
export const BRANCH_IDS = Object.keys(BRANCHES);
export const createBranchState = () => ({ b: {}, boats: [], ships: 0, earned: 0 });
export function B(save) {
  save.branch = save.branch || createBranchState();
  const s = save.branch;
  s.b = s.b || {};
  s.boats = s.boats || [];
  return s;
}
export const branchOf = (save, id) => B(save).b[id] || null;
export const openCount = (save) => BRANCH_IDS.filter((id) => branchOf(save, id)?.open).length;
export const stockCount = (br) => Object.values(br?.stock || {}).reduce((a, n) => a + n, 0);
export const capacityOf = (br) => BRANCH_RULES.capacity[(br?.lvl || 1) - 1];
const isGoods = (k) => k.startsWith('g:');

/** Tên + biểu tượng 1 mã hàng */
export function itemLabel(k) {
  if (isGoods(k)) { const [id, q] = k.slice(2).split('|'); const P = PRODUCTS[id]; return { icon: P?.icon || '📦', name: P?.name || id, q: +q }; }
  const f = parseFlowerKey(k);
  return { icon: FLOWERS[f.species]?.icon || '🌸', name: FLOWERS[f.species]?.name || f.species, q: f.q };
}

/** Giá bán 1 món ở chi nhánh id */
export function priceAt(id, k) {
  const D = BRANCHES[id];
  if (isGoods(k)) { const [pid, q] = k.slice(2).split('|'); return Math.round(priceOf(pid, +q) * D.price); }
  const f = parseFlowerKey(k);
  return Math.max(1, Math.round(FLOWERS[f.species].basePrice * BRANCH_RULES.starPrice[f.q] * rarityOf(f.species, f.variant).priceMult * D.price));
}
/** Hệ số nhu cầu của 1 món ở chi nhánh */
export function demandOf(id, k) {
  const L = BRANCHES[id].likes;
  if (isGoods(k)) { const pid = k.slice(2).split('|')[0]; return L[pid] || L.goods || 1; }
  return L[parseFlowerKey(k).species] || 1;
}

/** Điều kiện mở: ctx = { hearts(id), has(flag) } ⇒ { ok, why } */
export function canOpen(save, id, ctx) {
  const D = BRANCHES[id];
  if (branchOf(save, id)?.open) return { ok: false, why: 'Đã mở' };
  if (D.need && !ctx.has(D.need)) return { ok: false, why: 'Chưa tới được đảo này (đi tiếp cốt truyện của đảo)' };
  if (!ctx.flag) return { ok: false, why: 'Cần đi tiếp cốt truyện “Người mua đảo”' };
  if (ctx.hearts(D.manager) < D.hearts) return { ok: false, why: `Cần ${D.hearts} ❤️ với người quản lý` };
  if (save.player.coins < D.cost) return { ok: false, why: `Cần ${D.cost.toLocaleString('vi-VN')} 💰` };
  return { ok: true };
}
export function openBranch(save, id, ctx) {
  const c = canOpen(save, id, ctx);
  if (!c.ok) return fail(c.why);
  save.player.coins -= BRANCHES[id].cost;
  save.stats.spent = (save.stats.spent || 0) + BRANCHES[id].cost;
  B(save).b[id] = { open: true, lvl: 1, stock: {}, till: 0, sold: 0, earned: 0, acc: 0 };
  return { ok: true, msg: `${BRANCHES[id].icon} Khai trương ${BRANCHES[id].name}!` };
}
export function upgrade(save, id) {
  const br = branchOf(save, id);
  if (!br?.open) return fail('Chưa mở');
  if (br.lvl >= 3) return fail('Đã cấp cao nhất');
  const cost = BRANCH_RULES.upgrade[br.lvl];
  if (save.player.coins < cost) return fail(`Cần ${cost.toLocaleString('vi-VN')} 💰`);
  save.player.coins -= cost;
  save.stats.spent = (save.stats.spent || 0) + cost;
  br.lvl += 1;
  return { ok: true, msg: `⬆️ ${BRANCHES[id].name} lên cấp ${br.lvl}: bán nhanh hơn, kho rộng hơn!` };
}

/** Hàng đang trên thuyền tới chi nhánh id */
export const onBoat = (save, id) => B(save).boats.filter((x) => x.id === id).reduce((a, x) => a + Object.values(x.items).reduce((p, q) => p + q, 0), 0);

/** Hàng gửi được (kho người chơi): [{ key (mã chi nhánh), have, label, price, demand }] */
export function shippable(save, id) {
  const out = [];
  for (const [k, n] of Object.entries(save.inventory.flowers)) if (n > 0 && !FLOWERS[parseFlowerKey(k).species]?.luck) out.push({ key: k, have: n });
  for (const [k, n] of Object.entries(craftState(save).goods)) if (n > 0) out.push({ key: `g:${k}`, have: n });
  return out.map((x) => ({ ...x, label: itemLabel(x.key), price: priceAt(id, x.key), demand: demandOf(id, x.key) }))
    .sort((a, b) => b.demand - a.demand || b.price - a.price);
}

/** Gửi hàng: items = { mã: n }. mult = hệ số thời gian (Thứ Ba ×0,5, người giao hàng giỏi nhanh hơn) */
export function ship(save, id, items, now, mult = 1) {
  const br = branchOf(save, id);
  if (!br?.open) return fail('Chi nhánh chưa mở');
  const room = capacityOf(br) - stockCount(br) - onBoat(save, id);
  let total = 0;
  const clean = {};
  for (const [k, n0] of Object.entries(items)) {
    const n = Math.max(0, Math.floor(n0));
    if (!n) continue;
    const have = isGoods(k) ? craftState(save).goods[k.slice(2)] || 0 : save.inventory.flowers[k] || 0;
    if (have < n) return fail('Không đủ hàng trong kho');
    clean[k] = n; total += n;
  }
  if (!total) return fail('Chưa chọn món nào');
  if (total > BRANCH_RULES.shipMax) return fail(`Mỗi chuyến tối đa ${BRANCH_RULES.shipMax} món`);
  if (total > room) return fail(`Kho chi nhánh chỉ còn chỗ cho ${Math.max(0, room)} món`);
  for (const [k, n] of Object.entries(clean)) {
    if (isGoods(k)) craftState(save).goods[k.slice(2)] -= n;
    else { save.inventory.flowers[k] -= n; if (!save.inventory.flowers[k]) delete save.inventory.flowers[k]; }
  }
  const at = now + Math.round(BRANCH_RULES.shipMinutes * mult);
  B(save).boats.push({ id, at, items: clean });
  B(save).ships += 1;
  return { ok: true, msg: `⛵ Thuyền chở ${total} món tới ${BRANCHES[id].name}, khoảng ${Math.round((at - now) / 60 * 10) / 10} giờ nữa tới nơi`, at, total };
}

/** Người giao hàng tự chọn hàng gửi (hàng bán chạy trước, chỉ lấy tối đa nửa mỗi chồng để bạn còn bán ở tiệm) */
export function autoPack(save, id, skill) {
  const br = branchOf(save, id);
  if (!br?.open) return null;
  const room = Math.min(capacityOf(br) - stockCount(br) - onBoat(save, id), 6 + skill * 3, BRANCH_RULES.shipMax);
  if (room < 4) return null;
  const items = {};
  let left = room;
  for (const x of shippable(save, id)) {
    if (left <= 0) break;
    const n = Math.min(left, Math.floor(x.have / 2));
    if (n > 0) { items[x.key] = n; left -= n; }
  }
  return Object.keys(items).length ? items : null;
}

/**
 * Thời gian trôi: thuyền cập bến, chi nhánh bán hàng. ctx = { hearts(id), offline, join (kết truyện cùng nhau) }
 * Trả về { arrived: [{ id, n }], sold: { id: { n, coins } } }
 */
export function tick(save, from, to, ctx = {}, rng = Math.random) {
  const s = B(save);
  const out = { arrived: [], sold: {} };
  s.boats = s.boats.filter((bt) => {
    if (bt.at > to) return true;
    const br = s.b[bt.id];
    if (br) for (const [k, n] of Object.entries(bt.items)) br.stock[k] = (br.stock[k] || 0) + n;
    out.arrived.push({ id: bt.id, n: Object.values(bt.items).reduce((a, n) => a + n, 0) });
    return false;
  });
  for (const id of BRANCH_IDS) {
    const br = s.b[id];
    if (!br?.open) continue;
    // số giờ mở cửa trong khoảng [from, to]
    let openMin = 0;
    for (let m = from; m < to; m += 10) { const h = (m % 1440) / 60; if (h >= BRANCH_RULES.open[0] && h < BRANCH_RULES.open[1]) openMin += Math.min(10, to - m); }
    if (!openMin) continue;
    const rate = BRANCH_RULES.salesPerHour[br.lvl - 1] * (1 + BRANCH_RULES.heartBonus * (ctx.hearts?.(BRANCHES[id].manager) || 0)) * (ctx.offline ? BRANCH_RULES.offlineRate : 1) * (ctx.join ? BRANCH_RULES.joinBonus : 1);
    br.acc = (br.acc || 0) + rate * openMin / 60;
    let guard = 0;
    while (br.acc >= 1 && guard++ < 500) {
      const list = Object.entries(br.stock).filter(([, n]) => n > 0);
      if (!list.length) { br.acc = Math.min(br.acc, 1); break; }
      br.acc -= 1;
      const w = list.map(([k, n]) => demandOf(id, k) * Math.sqrt(n));
      let r = rng() * w.reduce((a, x) => a + x, 0), k = list[0][0];
      for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) { k = list[i][0]; break; } }
      br.stock[k] -= 1;
      if (!br.stock[k]) delete br.stock[k];
      const coins = priceAt(id, k);
      br.till += coins; br.sold += 1; br.earned = (br.earned || 0) + coins;
      if (isGoods(k)) { const cc = craftState(save).count; const pid = k.slice(2).split('|')[0]; cc[`sold:${pid}`] = (cc[`sold:${pid}`] || 0) + 1; }
      const o = out.sold[id] || (out.sold[id] = { n: 0, coins: 0 });
      o.n += 1; o.coins += coins;
    }
  }
  return out;
}

/** Thu tiền két */
export function collect(save, id) {
  const br = branchOf(save, id);
  if (!br?.till) return fail('Két trống');
  const coins = br.till;
  br.till = 0;
  save.player.coins += coins;
  save.stats.coinsEarned = (save.stats.coinsEarned || 0) + coins;
  B(save).earned += coins;
  return { ok: true, coins, msg: `💰 Thu ${coins.toLocaleString('vi-VN')} 💰 từ ${BRANCHES[id].name}` };
}
export { BRANCHES, BRANCH_RULES };
