// Mua đất của dân làng (GĐ13) — LOGIC THUẦN.
// Lô mua ở Chợ có plot.slot (0–3, vị trí PLOT_SLOTS); lô mua của dân làng có plot.parcel (mã trong data/land.js).
// save.land = { deals: { parcelId: { day, bargain: 'ok'|'fail' } } } — trạng thái trả giá trong ngày
import { PARCELS, LAND_RULES, MOODS } from '../../data/land.js';
import { heartsOf, addFp } from './relations.js';

export const PARCEL_IDS = Object.keys(PARCELS);

function hash01(day, key) {
  let h = 0;
  for (const c of key) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  let t = (Math.imul(day, 2654435761) ^ h) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const ownsParcel = (save, id) => save.farm.plots.some((p) => p.parcel === id);

/** Tâm trạng của chủ đất hôm nay (cố định theo ngày) */
export function moodOf(parcelId, day) {
  const list = Object.entries(MOODS);
  const total = list.reduce((a, [, m]) => a + m.weight, 0);
  let r = hash01(day, `mood:${parcelId}`) * total;
  for (const [id, m] of list) { r -= m.weight; if (r < 0) return { id, ...m }; }
  return { id: 'normal', ...MOODS.normal };
}

function deal(save, parcelId, day) {
  save.land = save.land || { deals: {} };
  save.land.deals = save.land.deals || {};
  const d = save.land.deals[parcelId];
  return d && d.day === day ? d : null;
}

/**
 * Báo giá hôm nay: { ok, reason, line, price, mood, hearts, need, canBargain, bargainChance }
 * reason: 'owned' | 'level' | 'hearts' | 'mood' | 'angry'
 */
export function quote(save, parcelId, day) {
  const P = PARCELS[parcelId];
  if (!P) return { ok: false, reason: 'none' };
  if (ownsParcel(save, parcelId)) return { ok: false, reason: 'owned' };
  const hearts = heartsOf(save, P.owner);
  const mood = moodOf(parcelId, day);
  const base = { parcel: P, hearts, need: P.minHearts, mood };
  if (save.player.level < (P.level || 1)) return { ...base, ok: false, reason: 'level', line: `Cần đạt cấp ${P.level} mới đủ sức chăm thêm mảnh đất này.` };
  if (hearts < P.minHearts) return { ...base, ok: false, reason: 'hearts', line: P.lines.refuse };
  const d = deal(save, parcelId, day);
  if (d?.bargain === 'fail') return { ...base, ok: false, reason: 'angry', line: P.lines.bargainNo };
  if (!mood.sell) return { ...base, ok: false, reason: 'mood', line: P.lines.no };
  const extra = Math.max(0, hearts - P.minHearts);
  const disc = Math.min(LAND_RULES.maxDiscount, extra * LAND_RULES.discountPerHeart);
  const wob = 1 + (hash01(day, `price:${parcelId}`) * 2 - 1) * LAND_RULES.wobble;
  let price = P.price * (1 - disc) * mood.mult * wob;
  if (d?.bargain === 'ok') price *= 1 - LAND_RULES.bargainOff;
  price = Math.max(LAND_RULES.roundTo, Math.round(price / LAND_RULES.roundTo) * LAND_RULES.roundTo);
  const chance = Math.min(LAND_RULES.bargainMax, LAND_RULES.bargainBase + extra * LAND_RULES.bargainPerHeart);
  return { ...base, ok: true, price, line: mood.id === 'happy' ? P.lines.happy : mood.id === 'grumpy' ? P.lines.grumpy : P.story, canBargain: !d?.bargain, bargainChance: chance, bargained: d?.bargain === 'ok' };
}

/** Trả giá (mỗi ngày 1 lần, kết quả cố định theo ngày — tải lại game không thử lại được) */
export function bargain(save, parcelId, day) {
  const q = quote(save, parcelId, day);
  if (!q.ok || !q.canBargain) return { ok: false, quote: q };
  const success = hash01(day, `bargain:${parcelId}`) < q.bargainChance;
  save.land.deals[parcelId] = { day, bargain: success ? 'ok' : 'fail' };
  const P = PARCELS[parcelId];
  let fp = null;
  if (!success) fp = addFp(save, P.owner, LAND_RULES.bargainFailFp);
  return { ok: true, success, line: success ? P.lines.bargainOk : P.lines.bargainNo, fp, quote: quote(save, parcelId, day) };
}

/** Mua: trừ tiền, thêm 1 lô có plot.parcel. createPlot do nơi gọi truyền vào (tránh vòng phụ thuộc với schema.js). */
export function buyParcel(save, parcelId, day, createPlot) {
  const q = quote(save, parcelId, day);
  if (!q.ok) return { ok: false, msg: q.line || 'Chưa mua được', quote: q };
  if (save.player.coins < q.price) return { ok: false, msg: `Không đủ tiền (cần ${q.price} 💰)`, quote: q };
  save.player.coins -= q.price;
  const plot = createPlot(`land-${parcelId}`);
  plot.parcel = parcelId;
  save.farm.plots.push(plot);
  const P = PARCELS[parcelId];
  const fp = addFp(save, P.owner, LAND_RULES.buyThanksFp);
  return { ok: true, price: q.price, line: P.lines.sold, fp, plotIndex: save.farm.plots.length - 1 };
}

/** Vùng mặt đất của 1 mảnh (để trả đồ trang trí về kho, chặn đặt đồ) */
export function parcelRect(parcelId, half = 2.35) {
  const P = PARCELS[parcelId];
  return P ? { x: P.x, z: P.z, hx: half, hz: half } : null;
}
