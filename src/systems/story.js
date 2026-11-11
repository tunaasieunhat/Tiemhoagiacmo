// =============================================================
//  📜 CỐT TRUYỆN CHÍNH (GĐ20) — LOGIC THUẦN
//  save.story = {
//    seen:  { mãCảnh: 1 },          cảnh đã xem xong
//    flags: { dấu: 1 },             lựa chọn đã ghi dấu
//    done:  { mãChương: 1 },        chương đã xong (đã nhận quà)
//    cur:   { id, i, picks: [] } | null   cảnh đang xem dở (để kể tiếp đúng chỗ khi mở lại game)
//  }
// =============================================================
import { CHAPTERS, SCENES, STORY_LINES, MO_LINES, STORY_RULES } from '../../data/story.js';
import { heartsOf, addFp, BOND_IDS } from './relations.js';
import { VILLAGER_IDS } from './village.js';
import { isNight } from './time.js';

export const createStoryState = () => ({ seen: {}, flags: {}, done: {}, cur: null });

export function S(save) {
  save.story = save.story || createStoryState();
  const st = save.story;
  st.seen = st.seen || {}; st.flags = st.flags || {}; st.done = st.done || {};
  return st;
}

/** Có dấu / đã xem cảnh? */
export const has = (save, key) => { const st = S(save); return !!(st.flags[key] || st.seen[key]); };

/** Điều kiện kiểu 'a|b&!c' trên dấu + cảnh đã xem */
export function cond(save, expr) {
  if (!expr) return true;
  return String(expr).split('|').some((grp) => grp.split('&').every((t) => {
    t = t.trim();
    return t.startsWith('!') ? !has(save, t.slice(1)) : has(save, t);
  }));
}

// ---------------- điều kiện mở chương ----------------
const NEED_TEXT = {
  level: (n) => `Đạt cấp ${n}`,
  hearts: (n) => `Tổng ${n} ❤️ với dân làng`,
  orders: (n) => `Giao ${n} đơn hàng lớn`,
  shopLevel: (n) => `Quy mô tiệm bậc ${n}`,
};
const NEED_VALUE = {
  level: (s) => s.player.level,
  hearts: (s) => VILLAGER_IDS.reduce((a, id) => a + heartsOf(s, id), 0),
  orders: (s) => s.orders?.done || 0,
  shopLevel: (s) => s.shopLevel || 0,
};

/** [{ text, ok, value, n }] */
export function needChecks(save, ch) {
  return Object.entries(ch.need || {}).map(([k, n]) => {
    const value = NEED_VALUE[k] ? NEED_VALUE[k](save) : 0;
    return { text: NEED_TEXT[k] ? NEED_TEXT[k](n) : k, ok: value >= n, value, n };
  });
}

// ---------------- tiến độ ----------------
const stepSeen = (save, step) => step.triggers.filter((t) => S(save).seen[t.scene]).length;
const stepNeed = (step) => step.need || step.triggers.length;
const stepDone = (save, step) => stepSeen(save, step) >= stepNeed(step);

/**
 * Chương đang chơi: { ch, index, stepIdx, step, seen, need, locked, checks, finished }
 *  locked: chương kế chưa đủ điều kiện · finished: đã xong hết các chương hiện có
 */
export function current(save) {
  const st = S(save);
  const index = CHAPTERS.findIndex((c) => !st.done[c.id]);
  if (index < 0) return { finished: true };
  const ch = CHAPTERS[index];
  const checks = needChecks(save, ch);
  if (!checks.every((c) => c.ok)) return { ch, index, locked: true, checks };
  let stepIdx = ch.steps.findIndex((sp) => !stepDone(save, sp));
  if (stepIdx < 0) stepIdx = ch.steps.length - 1;
  const step = ch.steps[stepIdx];
  return { ch, index, stepIdx, step, seen: stepSeen(save, step), need: stepNeed(step), checks, locked: false };
}

/**
 * Các điểm kích hoạt đang mở: bước hiện tại + cảnh chưa xem của những bước trước trong cùng chương.
 * ctx: { hour } — cảnh gặp Mơ (via 'mo') chỉ có ban đêm.
 */
export function triggers(save, ctx = {}) {
  const cur = current(save);
  if (cur.finished || cur.locked) return [];
  const st = S(save);
  const out = [];
  cur.ch.steps.forEach((step, i) => {
    if (i > cur.stepIdx) return;
    for (const t of step.triggers) {
      if (st.seen[t.scene]) continue;
      if (t.via === 'mo' && ctx.hour != null && !isNight(ctx.hour)) continue;
      out.push({ ...t, chapter: cur.ch.id, stepIdx: i, optional: i < cur.stepIdx });
    }
  });
  return out;
}

export const triggerFor = (save, ctx, via, key) => triggers(save, ctx).find((t) => t.via === via && (via === 'villager' ? t.who === key : via === 'spot' ? t.scene === key : true)) || null;

/** Mơ đã "ra mắt" chưa (xong chương 1) — từ đó đêm nào cũng ở trước hiên */
export const moKnown = (save) => has(save, 'c1_mo');

/** Mơ có hiện lúc này không */
export function moVisible(save, hour) {
  if (!isNight(hour)) return false;
  return moKnown(save) || triggers(save, { hour }).some((t) => t.via === 'mo');
}

// ---------------- xem cảnh ----------------
export const sceneOf = (id) => SCENES[id] || null;

/** Ghi nhận 1 lựa chọn trong cảnh: đặt dấu, cộng điểm tình thân. Trả về { remember, fp } */
export function applyChoice(save, opt) {
  const st = S(save);
  if (opt.set) st.flags[opt.set] = 1;
  const fp = {};
  const bonds = []; // kết quả cộng điểm (để game trao quà mốc tim nếu vừa đạt)
  for (const [id, d] of Object.entries(opt.fp || {})) {
    if (!BOND_IDS.includes(id)) continue;
    bonds.push({ id, res: addFp(save, id, d) });
    fp[id] = d;
  }
  return { remember: opt.remember || null, fp, bonds };
}

export function setFlag(save, flag) { S(save).flags[flag] = 1; }

/** Lưu chỗ đang xem dở (id cảnh, dòng thứ i, các lựa chọn đã bấm) */
export function saveProgress(save, id, i, picks) { S(save).cur = { id, i, picks: [...picks] }; }
export function clearProgress(save) { S(save).cur = null; }

/**
 * Xem xong 1 cảnh. Trả về { stepDone, nextGoal, chapterDone: chương | null, reward }
 * (chưa cộng quà — game gọi grant để cộng tiền/XP/vé)
 */
export function finishScene(save, sceneId) {
  const st = S(save);
  const before = current(save);
  st.cur = null;
  if (st.seen[sceneId]) return { already: true };
  st.seen[sceneId] = 1;
  if (before.finished || before.locked) return {};
  const ch = before.ch;
  const wasStep = before.stepIdx;
  const allDone = ch.steps.every((sp) => stepDone(save, sp));
  if (allDone) {
    st.done[ch.id] = 1;
    return { stepDone: true, chapterDone: ch, reward: ch.reward || {}, next: current(save) };
  }
  const after = current(save);
  return { stepDone: after.stepIdx > wasStep, nextGoal: after.step?.goal, next: after };
}

// ---------------- chữ ----------------
export const fmt = (text, save) => String(text ?? '').replace(/\{name\}/g, save.player?.name || 'bạn');

/** Câu dân làng nói thêm theo tiến độ truyện (hoặc null) */
export function storyLine(save, id, rng = Math.random) {
  const pool = (STORY_LINES[id] || []).filter((e) => cond(save, e.if)).flatMap((e) => e.lines);
  if (!pool.length || rng() > STORY_RULES.storyLineChance) return null;
  return pool[Math.floor(rng() * pool.length)];
}

/** Mơ nói gì khi chạm vào lúc không có cảnh: ưu tiên gợi ý việc cần làm */
export function moLine(save, rng = Math.random) {
  const cur = current(save);
  if (cur.finished) return rng() < 0.4 ? 'Mơ đang cố nhớ thêm... Khi nào nhớ ra Mơ kể cậu liền!' : MO_LINES[Math.floor(rng() * MO_LINES.length)];
  if (cur.locked) {
    const miss = cur.checks.filter((c) => !c.ok).map((c) => c.text.toLowerCase()).join(', ');
    return rng() < 0.6 ? `Mơ thấy sắp có chuyện đó... Nhưng cậu cần ${miss} đã.` : MO_LINES[Math.floor(rng() * MO_LINES.length)];
  }
  return rng() < 0.6 && cur.step ? `Cậu nhớ nha: ${cur.step.goal.charAt(0).toLowerCase()}${cur.step.goal.slice(1)}.` : MO_LINES[Math.floor(rng() * MO_LINES.length)];
}

/** Tóm tắt cho Sổ tay: [{ ch, state: 'done'|'active'|'locked'|'later', scenes: [{id,title,seen}], goal, seen, need, checks }] */
export function overview(save) {
  const st = S(save);
  const cur = current(save);
  return CHAPTERS.map((ch, i) => {
    const scenes = ch.steps.flatMap((sp) => sp.triggers.map((t) => ({ id: t.scene, title: SCENES[t.scene]?.title || t.scene, seen: !!st.seen[t.scene] })));
    let state = 'later';
    if (st.done[ch.id]) state = 'done';
    else if (!cur.finished && cur.index === i) state = cur.locked ? 'locked' : 'active';
    return { ch, state, scenes, goal: state === 'active' ? cur.step.goal : null, seen: state === 'active' ? cur.seen : 0, need: state === 'active' ? cur.need : 0, checks: needChecks(save, ch) };
  });
}
