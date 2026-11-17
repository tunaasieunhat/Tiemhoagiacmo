// Kết thân với dân làng (GĐ12) — LOGIC THUẦN.
// save.village = { rel: { id: { fp, talkDay, giftDay, done: {eventId: day}, known: {vkey: 'love'|...}, claimed: [3,5..] } }, flags: {} }
import { FRIEND, BONDS } from '../../data/stories.js';
import { REGULARS } from '../../data/regulars.js';
import { calendarOf } from './calendar.js';
import { parseFlowerKey, tonesOf, meaningsOf, variantName } from './variants.js';
import { applyReward } from './regulars.js';

export const BOND_IDS = Object.keys(BONDS);
const MAX_FP = FRIEND.pointsPerHeart * FRIEND.maxHearts;

export function createVillageState() {
  return { rel: Object.fromEntries(BOND_IDS.map((id) => [id, newRel()])), flags: {} };
}
const newRel = () => ({ fp: 0, talkDay: 0, giftDay: 0, done: {}, known: {}, claimed: [] });

/** Điểm khởi đầu khi chuyển save cũ: khách quen đã xong bao nhiêu chương ở tiệm thì được tặng sẵn ít điểm */
export function initVillageFromRegulars(save) {
  const v = createVillageState();
  for (const id of BOND_IDS) {
    if (REGULARS[id]) v.rel[id].fp = Math.min(MAX_FP, (save.regulars?.[id]?.hearts || 0) * FRIEND.regularHeadStart);
  }
  return v;
}

export function relOf(save, id) {
  save.village = save.village || createVillageState();
  save.village.flags = save.village.flags || {};
  const r = save.village.rel[id] || (save.village.rel[id] = newRel());
  r.done = r.done || {}; r.known = r.known || {}; r.claimed = r.claimed || [];
  return r;
}

export const heartsOf = (save, id) => Math.floor((relOf(save, id).fp || 0) / FRIEND.pointsPerHeart);
export const heartFrac = (save, id) => ((relOf(save, id).fp || 0) % FRIEND.pointsPerHeart) / FRIEND.pointsPerHeart;

export function tierName(hearts) {
  let name = FRIEND.tiers[0][1];
  for (const [h, n] of FRIEND.tiers) if (hearts >= h) name = n;
  return name;
}

export function isBirthday(id, day) {
  const b = BONDS[id]?.birthday;
  if (!b) return false;
  const c = calendarOf(day);
  return c.season.id === b.season && c.dayOfSeason === b.day;
}

/** Được trò chuyện: chưa nói hôm nay, hoặc đang kể dở 1 sự kiện (kể tiếp được) */
export const canTalk = (save, id, day) => { const r = relOf(save, id); return r.talkDay !== day || !!r.evStep; };
export const canGift = (save, id, day) => relOf(save, id).giftDay !== day;

/** Kiểm tra điều kiện kiểu 'a|b' (hoặc), 'a&!b' (và, phủ định) */
export function checkCond(cond, flags = {}) {
  if (!cond) return true;
  return String(cond).split('|').some((grp) => grp.split('&').every((t) => {
    t = t.trim();
    return t.startsWith('!') ? !flags[t.slice(1)] : !!flags[t];
  }));
}

/** Chữ có điều kiện: "{dấu?câu nếu có|câu nếu không}" */
export function fmt(text, flags = {}) {
  return String(text || '').replace(/\{([!\w&|]+)\?([^|}]*)\|([^}]*)\}/g, (_, c, a, b) => (checkCond(c, flags) ? a : b));
}

/** Sự kiện tim đang chờ (đủ tim, chưa xem, đủ điều kiện) */
export function availableEvent(save, id) {
  const r = relOf(save, id);
  const h = heartsOf(save, id);
  return (BONDS[id]?.events || []).find((e) => h >= e.need && !r.done[e.id] && checkCond(e.if, save.village.flags)) || null;
}

/** Hôm nay nói chuyện gì: sự kiện tim nếu có, không thì 1 câu chuyện thường (cố định theo ngày để mở lại không đổi) */
export function todaysTalk(save, id, day) {
  const ev = availableEvent(save, id);
  if (ev) {
    const r = relOf(save, id);
    // đang kể dở thì kể tiếp từ cảnh đó (không cho chọn lại cảnh đầu để "cày" điểm)
    const start = r.evStep?.id === ev.id && ev.scenes[r.evStep.scene] ? r.evStep.scene : 0;
    return { kind: 'event', event: ev, scenes: ev.scenes, title: ev.title, start };
  }
  const talks = BONDS[id]?.talks || [];
  if (!talks.length) return null;
  const i = (day * 7 + BOND_IDS.indexOf(id) * 3) % talks.length;
  return { kind: 'talk', scenes: [talks[i]], title: null, start: 0 };
}

/** Cộng/trừ điểm, trả về các mốc tim vừa đạt (để trao quà) */
export function addFp(save, id, delta) {
  const r = relOf(save, id);
  const before = heartsOf(save, id);
  r.fp = Math.max(0, Math.min(MAX_FP, (r.fp || 0) + Math.round(delta)));
  const after = heartsOf(save, id);
  const rewards = [];
  for (const [lv, rw] of Object.entries(BONDS[id]?.rewards || {})) {
    const n = +lv;
    if (after >= n && !r.claimed.includes(n)) { r.claimed.push(n); rewards.push({ hearts: n, reward: rw }); }
  }
  return { before, after, rewards };
}

/** Người chơi chọn 1 câu trả lời. Trả về { delta, reply, next, hearts... } */
export function chooseOption(save, id, talk, sceneIdx, optIdx, day) {
  const r = relOf(save, id);
  const scene = talk.scenes[sceneIdx];
  const opt = scene?.ch?.[optIdx];
  if (!opt) return null;
  if (opt.set) save.village.flags[opt.set] = day || 1;
  const res = addFp(save, id, opt.fp || 0);
  const next = opt.next != null && talk.scenes[opt.next] ? opt.next : null;
  r.talkDay = day;
  if (talk.kind === 'event') {
    if (next == null) { r.done[talk.event.id] = day || 1; delete r.evStep; }
    else r.evStep = { id: talk.event.id, scene: next };
  }
  return { delta: opt.fp || 0, reply: fmt(opt.r, save.village.flags), next, ...res };
}

/** Người này thích hoa đó tới mức nào: love | like | neutral | dislike | hate */
export function giftReaction(id, flowerKey) {
  const g = BONDS[id]?.gifts || {};
  const { species, variant, vkey } = parseFlowerKey(flowerKey);
  const tones = tonesOf(species, variant) || [];
  const means = meaningsOf(species, variant) || [];
  const order = ['love', 'like', 'dislike', 'hate'];
  const has = (lvl, test) => (g[lvl] || []).some(test);
  // ưu tiên: đúng màu > cả loài > ý nghĩa > tông màu (lỗi "ghét" ý nghĩa xấu luôn được ưu tiên trước ý nghĩa tốt)
  for (const lvl of order) if (has(lvl, (k) => k === vkey)) return lvl;
  for (const lvl of order) if (has(lvl, (k) => k === species)) return lvl;
  for (const lvl of ['hate', 'dislike', 'love', 'like']) if (has(lvl, (k) => k.startsWith('meaning:') && means.includes(k.slice(8)))) return lvl;
  for (const lvl of order) if (has(lvl, (k) => k.startsWith('tone:') && tones.includes(k.slice(5)))) return lvl;
  return 'neutral';
}

/** Tặng 1 bông hoa trong kho. Trả về { level, delta, line, birthday, ... } hoặc { error } */
export function giveGift(save, id, flowerKey, day) {
  if (!canGift(save, id, day)) return { error: 'Hôm nay đã tặng quà người này rồi' };
  const inv = save.inventory.flowers;
  if (!(inv[flowerKey] > 0)) return { error: 'Trong kho không còn hoa này' };
  const r = relOf(save, id);
  const level = giftReaction(id, flowerKey);
  const { q, vkey } = parseFlowerKey(flowerKey);
  let delta = FRIEND.gift[level];
  if (delta > 0) delta *= FRIEND.quality[q] || 1; // hoa nhiều sao được quý hơn
  const birthday = isBirthday(id, day);
  if (birthday && delta > 0) delta *= FRIEND.birthdayMult;
  inv[flowerKey] -= 1;
  r.giftDay = day;
  r.known[vkey] = level;
  const res = addFp(save, id, delta);
  return { level, delta: Math.round(delta), line: BONDS[id]?.giftLines?.[level] || '', birthday, ...res };
}

/** Trao quà mốc tim (dùng applyReward của khách quen + đồ trang trí) */
export function grantBondReward(save, rw = {}) {
  applyReward(save, rw); // xp do game.gainXp cộng (để lên cấp đúng cách)
  for (const [k, n] of Object.entries(rw.decor || {})) save.decor.owned[k] = (save.decor.owned[k] || 0) + n;
}

/** Tên hoa có "ý thích đã biết" để hiển thị trong bảng tặng quà */
export function knownReaction(save, id, flowerKey) {
  return relOf(save, id).known[parseFlowerKey(flowerKey).vkey] || null;
}

export const flowerLabel = (flowerKey) => { const f = parseFlowerKey(flowerKey); return `${variantName(f.species, f.variant)} ${'★'.repeat(f.q)}`; };
