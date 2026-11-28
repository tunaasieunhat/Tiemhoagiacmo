// 💌 Khách tâm sự & 🏷️ phong cách tiệm (0.31 · gói B) — LOGIC THUẦN. Số liệu: data/tales.js
// save.tales = { st: { [id]: { step, day, path: [], done, ending } }, letters: [{ id, ending, at }], styles: { [style]: điểm } }
import { TALES, TALE_RULES, STYLES, STYLE_RULES } from '../../data/tales.js';
import { meaningsOf } from './variants.js';

export function T(save) {
  save.tales = save.tales || {};
  const t = save.tales;
  t.st = t.st || {};
  t.letters = t.letters || [];
  t.styles = t.styles || {};
  for (const k of Object.keys(STYLES)) if (t.styles[k] == null) t.styles[k] = 0;
  return t;
}

const stateOf = (save, id) => T(save).st[id] || (T(save).st[id] = { step: 's1', day: -99, path: [], done: false, ending: null });

/** Truyện có thể ghé hôm nay (chưa xong, đủ cấp, đã qua số ngày chờ, không đang ở tiệm) */
export function availableTales(save, day) {
  const lv = save.player.level;
  if (lv < TALE_RULES.minLevel) return [];
  const inShop = new Set((save.shop?.customers || []).map((c) => c.tale).filter(Boolean));
  return Object.entries(TALES).filter(([id, t]) => {
    if (lv < t.level || inShop.has(id)) return false;
    const st = T(save).st[id];
    return !st || (!st.done && day >= st.day + TALE_RULES.waitDays);
  }).map(([id]) => id);
}

/** Yêu cầu bó hoa cho bước hiện tại. allow = các ý nghĩa của câu chuyện (không bị trừ điểm "ý nghĩa xấu") */
export function taleRequest(save, id) {
  const st = stateOf(save, id);
  const step = TALES[id].steps[st.step];
  const allow = [...new Set(step.paths.flatMap((p) => p.m))];
  return { type: 'bouquet', min: step.min, max: step.max, tone: step.tone, minQuality: 1, tale: id, allow, priceMult: TALE_RULES.priceMult, occasionText: 'theo câu chuyện của khách' };
}

/** Khách tâm sự vào tiệm (spot: chỗ đứng trống, patience: thời gian chờ cơ bản) */
export function spawnTale(save, id, { spot, patience }) {
  const sh = save.shop;
  const c = {
    id: sh.nextId++, npc: id, tale: id, step: stateOf(save, id).step, spot,
    request: taleRequest(save, id), arrivedAt: save.time.gameMinutes,
    patience: Math.round(patience * TALE_RULES.patienceMult),
  };
  sh.customers.push(c);
  return c;
}

/** Ý nghĩa của bó hoa: { meaning: số cành } */
export function meaningWeights(items) {
  const w = {};
  for (const it of items) for (const m of meaningsOf(it.species, it.variant)) w[m] = (w[m] || 0) + it.n;
  return w;
}

/** Chọn nhánh truyện theo bó hoa. items: [{species, variant, q, n}] · score: điểm bó hoa */
export function choosePath(step, items, score) {
  if (score < TALE_RULES.sloppy) return step.fallback;
  const w = meaningWeights(items);
  let best = null, bestN = 0;
  for (const p of step.paths) {
    const n = p.m.reduce((a, m) => a + (w[m] || 0), 0);
    if (n > bestN) { best = p.go; bestN = n; }
  }
  return best || step.fallback;
}

/**
 * Khách nhận bó hoa ⇒ đi tiếp câu chuyện. Trả về { id, path, react, ending?, nextDays? }
 * now: phút game (để hẹn ngày gửi thư kết cục) · day: ngày game
 */
export function resolve(save, id, items, score, day, now) {
  const tale = TALES[id];
  const st = stateOf(save, id);
  const step = tale.steps[st.step];
  const path = choosePath(step, items, score);
  const next = step.next[path];
  st.path.push(path);
  st.day = day;
  const out = { id, path, react: step.react[path] || '' };
  if (next.startsWith('end:')) {
    st.done = true;
    st.ending = next.slice(4);
    T(save).letters.push({ id, ending: st.ending, at: now + TALE_RULES.letterDelayHours * 60 });
    out.ending = st.ending;
  } else {
    st.step = next;
    out.nextDays = TALE_RULES.waitDays;
  }
  return out;
}

/** Thư kết cục đã tới hạn (lấy ra khỏi hàng chờ). Trả về [{ id, ending, def }] */
export function takeLetters(save, now) {
  const t = T(save);
  const due = t.letters.filter((l) => now >= l.at);
  if (!due.length) return [];
  t.letters = t.letters.filter((l) => now < l.at);
  return due.map((l) => ({ ...l, def: TALES[l.id].endings[l.ending] }));
}

/** Nhật ký truyện: [{ id, name, state: 'new'|'going'|'done', ending, endings: số kết đã biết / tổng }] */
export function journal(save) {
  return Object.entries(TALES).map(([id, tale]) => {
    const st = T(save).st[id];
    return { id, tale, state: !st ? 'new' : st.done ? 'done' : 'going', st, total: Object.keys(tale.endings).length };
  });
}

/** Chơi lại truyện đã xong (tìm kết khác) */
export function restart(save, id) {
  const st = stateOf(save, id);
  if (!st.done) return false;
  const endings = st.seen || [];
  if (st.ending && !endings.includes(st.ending)) endings.push(st.ending);
  T(save).st[id] = { step: 's1', day: -99, path: [], done: false, ending: null, seen: endings };
  return true;
}
export const endingsSeen = (save, id) => { const st = T(save).st[id]; if (!st) return []; const s = [...(st.seen || [])]; if (st.done && st.ending && !s.includes(st.ending)) s.push(st.ending); return s; };

// ============================================================= PHONG CÁCH TIỆM
export function styleLevel(save, id) {
  const p = T(save).styles[id] || 0;
  let lv = 0;
  STYLE_RULES.levels.forEach((need, i) => { if (p >= need) lv = i; });
  return lv;
}

/** Phong cách mạnh nhất: { id, level } (null nếu chưa có điểm) */
export function topStyle(save) {
  const s = T(save).styles;
  const id = Object.keys(STYLES).reduce((a, k) => (s[k] > (s[a] || 0) ? k : a), null);
  return id && s[id] > 0 ? { id, level: styleLevel(save, id) } : null;
}

/** Bó hoa này thuộc phong cách nào (null nếu không rõ). ev: kết quả evaluateDelivery */
export function styleOfBouquet(ev) {
  if (!ev.items?.length) return null;
  if (ev.score >= STYLE_RULES.luxuryScore && (ev.qAvg || 0) >= 2.6) return 'luxury';
  const w = meaningWeights(ev.items);
  let best = null, bestN = 0;
  for (const [k, S] of Object.entries(STYLES)) {
    const n = S.meanings.reduce((a, m) => a + (w[m] || 0), 0);
    if (n > bestN) { best = k; bestN = n; }
  }
  return best;
}

/** Cộng điểm phong cách (các phong cách khác mất một ít — chuyên sâu). Trả về { id, gain, levelUp } */
export function addStyle(save, id, gain) {
  if (!STYLES[id] || gain <= 0) return null;
  const s = T(save).styles;
  const before = styleLevel(save, id);
  s[id] = Math.round((s[id] + gain) * 10) / 10;
  for (const k of Object.keys(s)) if (k !== id) s[k] = Math.max(0, Math.round((s[k] - gain * STYLE_RULES.focusDrain) * 10) / 10);
  const after = styleLevel(save, id);
  return { id, gain, levelUp: after > before ? after : 0 };
}

/** Sau khi bán 1 bó hoa: cộng điểm phong cách theo bó hoa. Trả về kết quả addStyle hoặc null */
export function styleFromSale(save, ev) {
  const id = styleOfBouquet(ev);
  if (!id) return null;
  return addStyle(save, id, Math.round(STYLE_RULES.perBouquet * (ev.score / 100) * 2 * 10) / 10);
}

/** Hệ số giá & bo cho bó hoa thuộc phong cách id */
export const stylePriceMult = (save, id) => (id ? 1 + STYLE_RULES.priceBonus * styleLevel(save, id) : 1);
export const styleTipMult = (save, id) => (id ? 1 + STYLE_RULES.tipBonus * styleLevel(save, id) * 2.5 : 1);

/** Khách hỏi bó hoa theo phong cách mạnh nhất: { meanings, chance } | null */
export function styleBias(save) {
  const top = topStyle(save);
  if (!top || !top.level || !STYLES[top.id].meanings.length) return null;
  return { meanings: STYLES[top.id].meanings, chance: STYLE_RULES.biasPerLevel * top.level };
}
