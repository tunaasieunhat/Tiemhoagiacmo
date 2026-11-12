// 🎡 Khu Vui Chơi (GĐ26) — logic thuần.
// save.fun = { xu, plays: { quầy: lượt }, best: { quầy: sao }, rides: { trò: lượt }, pantry: { mã: n }, snacks: { 'mã|sao': n },
//   sold, earned, sellAt, bought: { mã quà: 1 } }
import { RIDES, BOOTHS, PRIZES, SNACKS, PANTRY, FUN_RULES, FUN } from '../../data/fun.js';
import { parseFlowerKey } from './variants.js';

const fail = (msg) => ({ ok: false, msg });
export const createFunState = () => ({ xu: 0, plays: {}, best: {}, rides: {}, pantry: {}, snacks: {}, sold: 0, earned: 0, sellAt: 0, bought: {} });
export function F(save) {
  save.fun = save.fun || createFunState();
  const f = save.fun;
  for (const k of ['plays', 'best', 'rides', 'pantry', 'snacks', 'bought']) f[k] = f[k] || {};
  f.xu = f.xu || 0;
  return f;
}
export const isOpenHour = (hour) => hour >= FUN.open[0] && hour < FUN.open[1];
export const totalPlays = (save) => Object.values(F(save).plays).reduce((a, n) => a + n, 0);
export const totalRides = (save) => Object.values(F(save).rides).reduce((a, n) => a + n, 0);

// ---------------- 🎡 trò chơi lớn ----------------
export function ride(save, id) {
  const R = RIDES[id];
  if (!R) return fail('Không rõ');
  if (save.player.coins < R.price) return fail(`Cần ${R.price} 💰`);
  save.player.coins -= R.price;
  save.stats.spent = (save.stats.spent || 0) + R.price;
  const f = F(save);
  f.rides[id] = (f.rides[id] || 0) + 1;
  return { ok: true, R };
}

// ---------------- 🎯 quầy trò chơi ----------------
/** Trả tiền 1 lượt */
export function payBooth(save, id) {
  const B = BOOTHS[id];
  if (!B) return fail('Không rõ');
  if (save.player.coins < B.price) return fail(`Cần ${B.price} 💰 mỗi lượt`);
  save.player.coins -= B.price;
  save.stats.spent = (save.stats.spent || 0) + B.price;
  return { ok: true };
}
/** Ghi kết quả: thưởng Xu Vui theo sao. Trả về { xu, best } */
export function finishBooth(save, id, stars) {
  const B = BOOTHS[id], f = F(save);
  const s = Math.max(0, Math.min(3, stars | 0));
  const xu = B.xu[s];
  f.xu += xu;
  f.plays[id] = (f.plays[id] || 0) + 1;
  const best = s > (f.best[id] || 0);
  if (best) f.best[id] = s;
  return { xu, best, stars: s };
}
/** Mức khó quầy theo số lượt đã chơi */
export const boothLevel = (save, id) => { const n = F(save).plays[id] || 0; return n >= 15 ? 2 : n >= 5 ? 1 : 0; };

// ---------------- 🎁 đổi quà ----------------
/** Trạng thái từng món quà: { ...P, have (đã có), can } — has(kind, ref) do game truyền (vd đã có trang phục chưa) */
export function prizeList(save, has = () => false) {
  const f = F(save);
  return PRIZES.map((P) => { const have = !P.repeat && (f.bought[P.id] || has(P.kind, P.ref)); return { ...P, have, can: !have && f.xu >= P.cost }; });
}
export function exchange(save, prizeId, has = () => false) {
  const P = PRIZES.find((x) => x.id === prizeId), f = F(save);
  if (!P) return fail('Không rõ');
  if (!P.repeat && (f.bought[P.id] || has(P.kind, P.ref))) return fail('Bạn đã có món này');
  if (f.xu < P.cost) return fail(`Cần ${P.cost} 🪙 Xu Vui`);
  f.xu -= P.cost;
  if (!P.repeat) f.bought[P.id] = 1;
  return { ok: true, P };
}

// ---------------- 🍡 quầy ăn vặt ----------------
export function buyPantry(save, id, n = 5) {
  const P = PANTRY[id];
  if (!P) return fail('Không rõ');
  const cost = P.price * n;
  if (save.player.coins < cost) return fail(`Cần ${cost} 💰`);
  save.player.coins -= cost;
  save.stats.spent = (save.stats.spent || 0) + cost;
  const f = F(save);
  f.pantry[id] = (f.pantry[id] || 0) + n;
  return { ok: true, msg: `🛒 Đã mua ${n} ${P.icon} ${P.name}` };
}
/** Số bông của 1 loài trong kho (mọi màu, mọi sao) */
export function flowerCount(save, sp) {
  let n = 0;
  for (const [k, c] of Object.entries(save.inventory.flowers)) if (c > 0 && parseFlowerKey(k).species === sp) n += c;
  return n;
}
/** Thiếu gì để làm món: [{ text }] (rỗng = đủ) */
export function missing(save, id) {
  const S = SNACKS[id], f = F(save), out = [];
  for (const [sp, n] of Object.entries(S.flowers)) { const have = flowerCount(save, sp); if (have < n) out.push({ kind: 'flower', sp, need: n, have }); }
  for (const [p, n] of Object.entries(S.pantry)) { const have = f.pantry[p] || 0; if (have < n) out.push({ kind: 'pantry', id: p, need: n, have }); }
  return out;
}
/** Làm 1 món: trừ nguyên liệu (hoa ít sao dùng trước), thêm món vào kệ */
export function makeSnack(save, id, stars) {
  const S = SNACKS[id];
  if (!S) return fail('Không rõ');
  if (missing(save, id).length) return fail('Chưa đủ nguyên liệu');
  const f = F(save);
  if (shelfCount(save) >= FUN_RULES.shelfMax) return fail(`Kệ đầy rồi (tối đa ${FUN_RULES.shelfMax} món)`);
  for (const [sp, n0] of Object.entries(S.flowers)) {
    let n = n0;
    const keys = Object.keys(save.inventory.flowers).filter((k) => save.inventory.flowers[k] > 0 && parseFlowerKey(k).species === sp).sort((a, b) => parseFlowerKey(a).q - parseFlowerKey(b).q);
    for (const k of keys) { const t = Math.min(n, save.inventory.flowers[k]); save.inventory.flowers[k] -= t; if (!save.inventory.flowers[k]) delete save.inventory.flowers[k]; n -= t; if (!n) break; }
  }
  for (const [p, n] of Object.entries(S.pantry)) f.pantry[p] -= n;
  const q = Math.max(0, Math.min(3, stars | 0));
  const key = `${id}|${q}`;
  f.snacks[key] = (f.snacks[key] || 0) + 1;
  return { ok: true, key, q, msg: `${S.icon} Đã làm ${S.name} ${'⭐'.repeat(q) || '(làm nhanh)'}` };
}
export const snackPrice = (id, q) => Math.round(SNACKS[id].price * FUN_RULES.snackQ[q]);
export const shelf = (save) => Object.entries(F(save).snacks).filter(([, n]) => n > 0).map(([k, n]) => { const [id, q] = k.split('|'); return { key: k, id, q: +q, n, price: snackPrice(id, +q) }; });
export const shelfCount = (save) => shelf(save).reduce((a, x) => a + x.n, 0);
/** Lấy 1 món ăn vặt (vd cho thú cưng ăn). Trả về mã hoặc null */
export function takeSnack(save) {
  const s = shelf(save).sort((a, b) => a.q - b.q)[0];
  if (!s) return null;
  F(save).snacks[s.key] -= 1;
  return s.key;
}

/** Khách đi chơi mua ăn vặt theo giờ. saturdayNight(phút) → true khi đang lễ hội. Trả về [{ id, q, coins }] */
export function snackTick(save, from, to, { open = false, offline = false, saturdayNight = () => false, rng = Math.random } = {}) {
  const f = F(save), out = [];
  if (!open) { f.sellAt = to; return out; }
  if (!f.sellAt || f.sellAt > to) f.sellAt = from;
  let guard = 0;
  while (guard++ < 300) {
    const hour = (f.sellAt % 1440) / 60;
    const rate = FUN_RULES.snackSales * (saturdayNight(f.sellAt) ? FUN_RULES.saturdayMult : 1) * (offline ? 0.5 : 1);
    const step = 60 / rate;
    if (f.sellAt + step > to) break;
    f.sellAt += step;
    if (!isOpenHour(hour)) continue;
    const list = shelf(save);
    if (!list.length) continue;
    const tot = list.reduce((a, x) => a + x.n, 0);
    let r = rng() * tot, pick = list[0];
    for (const x of list) { r -= x.n; if (r <= 0) { pick = x; break; } }
    f.snacks[pick.key] -= 1;
    f.sold = (f.sold || 0) + 1;
    f.earned = (f.earned || 0) + pick.price;
    save.player.coins += pick.price;
    save.stats.coinsEarned = (save.stats.coinsEarned || 0) + pick.price;
    out.push({ id: pick.id, q: pick.q, coins: pick.price });
  }
  return out;
}
export { RIDES, BOOTHS, PRIZES, SNACKS, PANTRY, FUN_RULES, FUN };
