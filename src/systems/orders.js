// =============================================================
//  📦 ĐƠN HÀNG LỚN CÓ HẠN CHÓT (GĐ16) — LOGIC THUẦN
//  save.orders = { list: [{ id, kind, items: [{ sp, n, minQ }], due, coins, xp, ticket }], nextAt, nextId, done, failed }
// =============================================================
import { ORDER_RULES, ORDER_KINDS } from '../../data/orders.js';
import { FLOWERS, NORMAL_FLOWER_IDS } from '../../data/flowers.js';
import { SHOP } from '../../data/shop.js';
import { parseFlowerKey } from './variants.js';

export function createOrdersState() {
  return { list: [], nextAt: 0, nextId: 1, done: 0, failed: 0 };
}

const O = (save) => {
  save.orders = save.orders || createOrdersState();
  const o = save.orders;
  o.list = o.list || [];
  o.nextId = o.nextId || 1;
  return o;
};
const byLevel = (table, lv) => { let r = table[0]; for (const row of table) if (lv >= row[0]) r = row; return r; };
const randInt = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));

/** Tạo 1 đơn mới phù hợp cấp người chơi */
export function makeOrder(save, now, rng = Math.random) {
  const o = O(save);
  const lv = save.player.level;
  const pool = NORMAL_FLOWER_IDS.filter((id) => FLOWERS[id].unlockLevel <= lv && !FLOWERS[id].greenhouseOnly);
  const [, nMin, nMax] = byLevel(ORDER_RULES.size, lv);
  const [, minQ] = byLevel(ORDER_RULES.minQ, lv);
  const total = randInt(rng, nMin, nMax);
  const lines = total >= 10 && pool.length > 1 ? 2 : 1;
  const picks = [...pool].sort(() => rng() - 0.5).slice(0, lines);
  const items = picks.map((sp, i) => ({ sp, n: i === 0 ? Math.ceil(total / lines) : Math.floor(total / lines), minQ }));
  const coins = Math.round(items.reduce((a, it) => a + FLOWERS[it.sp].basePrice * SHOP.qualityMult[it.minQ] * it.n, 0) * ORDER_RULES.payMult / 10) * 10;
  const order = {
    id: o.nextId++,
    kind: Math.floor(rng() * ORDER_KINDS.length),
    items,
    due: now + randInt(rng, ORDER_RULES.dueHours[0], ORDER_RULES.dueHours[1]) * 60,
    coins,
    xp: total * ORDER_RULES.xpPerFlower,
    ticket: rng() < ORDER_RULES.ticketChance,
  };
  o.list.push(order);
  return order;
}

/** Cho thời gian trôi: hết hạn ⇒ hủy đơn (mất uy tín); đủ thời gian ⇒ thêm đơn mới. Trả về sự kiện.
 *  offline: lúc tắt game thì hạn giao TẠM DỪNG (dời hạn thêm dMin phút), không tạo đơn mới. */
export function ordersTick(save, now, rng = Math.random, { offline = false, dMin = 0 } = {}) {
  const o = O(save);
  const events = [];
  if (save.player.level < ORDER_RULES.unlockLevel) return events;
  if (offline) { for (const ord of o.list) ord.due += dMin; if (o.nextAt) o.nextAt += dMin; return events; }
  for (const ord of [...o.list]) {
    if (now >= ord.due) {
      o.list = o.list.filter((x) => x !== ord);
      o.failed = (o.failed || 0) + 1;
      save.player.reputation = Math.max(0, (save.player.reputation || 0) + ORDER_RULES.failRep);
      events.push({ type: 'expired', order: ord });
    }
  }
  if (!o.nextAt) o.nextAt = now;
  if (now >= o.nextAt && o.list.length < ORDER_RULES.max) {
    events.push({ type: 'new', order: makeOrder(save, now, rng) });
    o.nextAt = now + ORDER_RULES.everyHours * 60;
  } else if (now >= o.nextAt) o.nextAt = now + 60;
  return events;
}

/** Số cành trong kho đáp ứng 1 dòng yêu cầu (loài, ≥ số sao) */
export function haveFor(save, it) {
  return Object.entries(save.inventory.flowers).reduce((a, [k, n]) => {
    if (!n) return a;
    const f = parseFlowerKey(k);
    return f.species === it.sp && f.q >= it.minQ ? a + n : a;
  }, 0);
}

export const canDeliver = (save, ord) => ord.items.every((it) => haveFor(save, it) >= it.n);

/** Giao đơn: trừ hoa (dùng cành ít sao nhất đủ yêu cầu trước, giữ hoa đẹp lại), cộng thưởng */
export function deliverOrder(save, id) {
  const o = O(save);
  const ord = o.list.find((x) => x.id === id);
  if (!ord) return { ok: false, msg: 'Đơn này không còn nữa' };
  if (!canDeliver(save, ord)) return { ok: false, msg: 'Kho chưa đủ hoa cho đơn này' };
  for (const it of ord.items) {
    let need = it.n;
    const keys = Object.keys(save.inventory.flowers)
      .map((k) => ({ k, f: parseFlowerKey(k) }))
      .filter(({ k, f }) => f.species === it.sp && f.q >= it.minQ && save.inventory.flowers[k] > 0)
      .sort((a, b) => a.f.q - b.f.q);
    for (const { k } of keys) {
      const take = Math.min(need, save.inventory.flowers[k]);
      save.inventory.flowers[k] -= take;
      need -= take;
      if (!need) break;
    }
  }
  o.list = o.list.filter((x) => x !== ord);
  o.done = (o.done || 0) + 1;
  save.player.coins += ord.coins;
  return { ok: true, order: ord };
}

export const kindOf = (ord) => ORDER_KINDS[ord.kind] || ORDER_KINDS[0];
