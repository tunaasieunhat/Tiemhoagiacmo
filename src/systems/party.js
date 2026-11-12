// =============================================================
//  🎉 HỢP ĐỒNG TRANG TRÍ TIỆC (GĐ25) — logic thuần
//  save.party = { offers: [hợp đồng], active: null | { ...hợp đồng, deadline, design: [vkey | null] }, done, best, day, seq, log: [] }
//  Hoa chỉ bị trừ khỏi kho lúc "Trình khách"; trong lúc thiết kế chỉ giữ chỗ (không vượt số hoa đang có).
// =============================================================
import { PARTY_ITEMS, VENUES, OCCASIONS, PARTY_RULES } from '../../data/party.js';
import { BONDS } from '../../data/stories.js';
import { FLOWERS } from '../../data/flowers.js';
import { MEANINGS } from '../../data/variants.js';
import { parseVkey, parseFlowerKey, tonesOf, meaningsOf, variantColors } from './variants.js';

const hash = (str) => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rngOf = (seed) => { let x = seed || 1; return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; };
const fail = (msg) => ({ ok: false, msg });

export const createPartyState = () => ({ offers: [], active: null, done: 0, best: 0, day: 0, seq: 1, log: [] });
export function PT(save) {
  save.party = save.party || createPartyState();
  const p = save.party;
  p.offers = p.offers || [];
  p.log = p.log || [];
  return p;
}

/** Sở thích hoa của khách (lấy từ quà thích/ghét ở data/stories.js): { fav: 'loài' | 'loài:màu', hate } */
function tastesOf(client) {
  const g = BONDS[client]?.gifts || {};
  const flowerOnly = (list) => (list || []).filter((x) => !x.includes('tone:') && !x.includes('meaning:') && FLOWERS[x.split(':')[0]]);
  return { fav: flowerOnly(g.love)[0] || flowerOnly(g.like)[0] || null, hate: flowerOnly(g.hate)[0] || flowerOnly(g.dislike)[0] || null };
}

/** Tạo 1 hợp đồng. occ/venue/client có thể chỉ định (hợp đồng cốt truyện) */
export function makeOffer(save, day, { rng = Math.random, clients = [], occ = null, venue = null, client = null, story = null } = {}) {
  const p = PT(save);
  const occIds = Object.keys(OCCASIONS).filter((o) => o !== 'wedding' || occ === 'wedding');
  const oid = occ || occIds[Math.floor(rng() * occIds.length)];
  const O = OCCASIONS[oid];
  const cl = client || clients[Math.floor(rng() * clients.length)] || 'ba_tu';
  const vid = venue || O.venues[Math.floor(rng() * O.venues.length)];
  const t = tastesOf(cl);
  const offer = {
    id: p.seq++, occ: oid, client: cl, venue: vid, tones: O.tones, meanings: O.meanings, fav: t.fav, hate: t.hate,
    reward: Math.round(O.reward * (0.9 + rng() * 0.25)), madeDay: day, story: story || null,
  };
  return offer;
}

/** Mỗi ngày mới: bỏ hợp đồng quá 3 ngày chưa nhận, thêm cho đủ. Hợp đồng đang làm quá hạn ⇒ hỏng. extra = số thêm (Thứ Sáu) */
export function refresh(save, day, { clients = [], extra = 0 } = {}) {
  const p = PT(save);
  if (p.day === day) return { expired: null };
  p.day = day;
  let expired = null;
  if (p.active && !p.active.story && day > p.active.deadline) { expired = p.active; p.active = null; }
  p.offers = p.offers.filter((o) => o.story || day - o.madeDay <= 3);
  const r = rngOf(hash(`party|${day}|${save.player?.name || ''}`));
  const target = PARTY_RULES.maxOffers + extra;
  let guard = 0;
  while (p.offers.length < target && clients.length && guard++ < 10) {
    const o = makeOffer(save, day, { rng: r, clients });
    if (!p.offers.some((x) => x.client === o.client)) p.offers.push(o);
  }
  return { expired };
}

/** Thêm hợp đồng cốt truyện (vd đám cưới Cô Mai). Không trùng */
export function addStoryOffer(save, day, opts) {
  const p = PT(save);
  if (p.offers.some((o) => o.story === opts.story) || p.active?.story === opts.story) return null;
  const o = makeOffer(save, day, opts);
  o.reward = Math.round(o.reward * 1.5);
  p.offers.unshift(o);
  return o;
}

export function accept(save, id, day) {
  const p = PT(save);
  if (p.active) return fail('Đang làm một hợp đồng khác. Trình khách hoặc hủy trước đã.');
  const i = p.offers.findIndex((o) => o.id === id);
  if (i < 0) return fail('Hợp đồng không còn');
  const o = p.offers.splice(i, 1)[0];
  p.active = { ...o, deadline: day + PARTY_RULES.deadlineDays, design: VENUES[o.venue].slots.map(() => null) };
  return { ok: true, msg: `🎉 Đã nhận hợp đồng ${OCCASIONS[o.occ].name}. Ra ${VENUES[o.venue].name} để trang trí!`, active: p.active };
}

export function cancel(save) {
  const p = PT(save);
  if (!p.active) return fail('Không có hợp đồng');
  const o = p.active;
  p.active = null;
  if (!o.story) save.player.reputation = Math.max(0, save.player.reputation - 3);
  else p.offers.unshift({ ...o, design: undefined, deadline: undefined });
  return { ok: true, msg: o.story ? 'Đã tạm gác hợp đồng (có thể nhận lại).' : 'Đã hủy hợp đồng (−3 💗 uy tín).' };
}

/** Tổng số bông có trong kho theo vkey (mọi số sao) */
export function stockOf(save, vk) {
  let n = 0;
  for (const [k, c] of Object.entries(save.inventory.flowers)) if (c > 0 && k.split('|')[0] === vk) n += c;
  return n;
}
/** Số bông vkey đang được dùng trong thiết kế (trừ chỗ số skip) */
export function usedOf(active, vk, skip = -1) {
  return active.design.reduce((a, d, i) => a + (i !== skip && d === vk ? PARTY_ITEMS[VENUES[active.venue].slots[i][0]].n : 0), 0);
}
/** Danh sách hoa đủ dùng cho chỗ si: [{ vkey, have, free }] */
export function choicesFor(save, si) {
  const a = PT(save).active;
  if (!a) return [];
  const need = PARTY_ITEMS[VENUES[a.venue].slots[si][0]].n;
  const keys = new Set(Object.keys(save.inventory.flowers).filter((k) => save.inventory.flowers[k] > 0).map((k) => k.split('|')[0]));
  return [...keys].map((vk) => { const have = stockOf(save, vk); return { vkey: vk, have, free: have - usedOf(a, vk, si), need }; })
    .filter((c) => !FLOWERS[c.vkey.split(':')[0]]?.luck);
}
export function setSlot(save, si, vk) {
  const a = PT(save).active;
  if (!a || si < 0 || si >= a.design.length) return fail('Không rõ');
  if (vk == null) { a.design[si] = null; return { ok: true }; }
  const need = PARTY_ITEMS[VENUES[a.venue].slots[si][0]].n;
  if (stockOf(save, vk) - usedOf(a, vk, si) < need) return fail(`Không đủ hoa (cần ${need} bông)`);
  a.design[si] = vk;
  return { ok: true };
}

/** Lấy hoa ra khỏi kho cho cả thiết kế: ưu tiên bông nhiều sao. Trả về { take: {flowerKey: n}, stars: trung bình } */
function plan(save, a) {
  const take = {};
  let sum = 0, cnt = 0;
  const left = { ...save.inventory.flowers };
  a.design.forEach((vk, i) => {
    if (!vk) return;
    let need = PARTY_ITEMS[VENUES[a.venue].slots[i][0]].n;
    const stacks = Object.keys(left).filter((k) => left[k] > 0 && k.split('|')[0] === vk).sort((x, y) => parseFlowerKey(y).q - parseFlowerKey(x).q);
    for (const k of stacks) {
      const t = Math.min(need, left[k]);
      left[k] -= t; need -= t; take[k] = (take[k] || 0) + t; sum += t * parseFlowerKey(k).q; cnt += t;
      if (!need) break;
    }
  });
  return { take, stars: cnt ? sum / cnt : 0 };
}

/** Chấm điểm thiết kế: { total 0–100, parts: [{ id, name, got, max, note }], ok (đủ chỗ để trình) } */
export function score(save, a = PT(save).active) {
  if (!a) return null;
  const W = PARTY_RULES.weights;
  const filled = a.design.filter(Boolean);
  const parts = [];
  const push = (id, name, got, max, note) => parts.push({ id, name, got: Math.round(got), max, note });
  push('fill', 'Đủ chỗ trang trí', W.fill * (filled.length / a.design.length), W.fill, `${filled.length}/${a.design.length} chỗ`);
  if (!filled.length) return { total: 0, parts, ok: false, filled: 0 };
  const info = filled.map((vk) => { const { species, variant } = parseVkey(vk); return { vk, sp: species, tones: tonesOf(species, variant) || [], means: meaningsOf(species, variant) || [] }; });
  const toneHit = info.filter((x) => x.tones.some((t) => a.tones.includes(t))).length / info.length;
  push('tone', 'Tông màu hợp dịp', W.tone * toneHit, W.tone, `${Math.round(toneHit * 100)}% hoa đúng tông`);
  const meanSet = new Set(info.flatMap((x) => x.means));
  const meanHit = a.meanings.filter((m) => meanSet.has(m)).length / a.meanings.length;
  const negative = [...meanSet].some((m) => MEANINGS[m]?.negative);
  push('meaning', 'Ý nghĩa', W.meaning * meanHit - (negative ? 6 : 0), W.meaning, `${a.meanings.filter((m) => meanSet.has(m)).length}/${a.meanings.length} ý nghĩa${negative ? ' · có ý nghĩa buồn' : ''}`);
  const favHit = a.fav && info.some((x) => x.vk === a.fav || x.sp === a.fav);
  push('favorite', 'Hoa khách thích', a.fav ? (favHit ? W.favorite : 0) : W.favorite, W.favorite, a.fav ? (favHit ? 'Có!' : 'Chưa có') : 'Khách dễ tính');
  // hài hòa: 2–4 loại hoa khác nhau là đẹp nhất
  const kinds = new Set(filled).size;
  const harmony = kinds >= 2 && kinds <= 4 ? 1 : kinds === 1 ? 0.4 : kinds === 5 ? 0.7 : 0.4;
  push('harmony', 'Hài hòa', W.harmony * harmony, W.harmony, `${kinds} loại hoa (đẹp nhất 2–4)`);
  const { stars } = plan(save, a);
  push('quality', 'Chất lượng hoa', W.quality * Math.max(0, (stars - 1) / 2), W.quality, `trung bình ${stars.toFixed(1)}★`);
  const hateHit = a.hate && info.some((x) => x.vk === a.hate || x.sp === a.hate);
  if (hateHit) push('hate', 'Hoa khách ghét!', -PARTY_RULES.hatePenalty, 0, 'Bỏ ra đi');
  const total = Math.max(0, Math.min(100, parts.reduce((s, x) => s + x.got, 0)));
  return { total, parts, ok: filled.length >= PARTY_RULES.minFill, filled: filled.length, stars };
}

/** Trình khách: trừ hoa, tính thưởng. mult = hệ số ngày (Thứ Sáu ×1,5). Trả về kết quả để game cộng tình thân / XP */
export function submit(save, day, { mult = 1 } = {}) {
  const p = PT(save);
  const a = p.active;
  if (!a) return fail('Không có hợp đồng');
  const sc = score(save, a);
  if (!sc.ok) return fail(`Cần trang trí ít nhất ${PARTY_RULES.minFill} chỗ`);
  const { take } = plan(save, a);
  for (const [k, n] of Object.entries(take)) if ((save.inventory.flowers[k] || 0) < n) return fail('Không đủ hoa trong kho');
  for (const [k, n] of Object.entries(take)) { save.inventory.flowers[k] -= n; if (!save.inventory.flowers[k]) delete save.inventory.flowers[k]; }
  const k = sc.total / 100;
  const lerp = ([lo, hi]) => Math.round(lo + (hi - lo) * k);
  const coins = Math.round(a.reward * (0.3 + 0.9 * k) * mult);
  const res = { ok: true, score: sc.total, coins, fp: lerp(PARTY_RULES.fp), rep: lerp(PARTY_RULES.rep), xp: lerp(PARTY_RULES.xp), client: a.client, occ: a.occ, venue: a.venue, story: a.story, design: [...a.design], used: Object.values(take).reduce((x, y) => x + y, 0) };
  const O = OCCASIONS[a.occ];
  res.line = sc.total >= 80 ? O.lines[1] : sc.total < 50 ? O.lines[2] : 'Cảm ơn tiệm nhé. Mọi người đều vui.';
  save.player.coins += coins;
  save.player.reputation = Math.max(0, save.player.reputation + res.rep);
  save.stats.coinsEarned = (save.stats.coinsEarned || 0) + coins;
  p.done += 1;
  p.best = Math.max(p.best, sc.total);
  if (a.story) p[`story_${a.story}`] = sc.total;
  p.log.unshift({ day, occ: a.occ, client: a.client, score: sc.total, coins });
  p.log = p.log.slice(0, 8);
  p.shown = { venue: a.venue, design: [...a.design], until: day + 1 }; // tiệc còn bày tới hết ngày mai
  p.active = null;
  return res;
}

/** Màu để dựng 3D cho 1 vkey */
export const colorsOf = (vk) => { const { species, variant } = parseVkey(vk); return variantColors(species, variant); };
export { VENUES, PARTY_ITEMS, OCCASIONS };
