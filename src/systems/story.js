// =============================================================
//  📜 CỐT TRUYỆN CHÍNH (GĐ20) — LOGIC THUẦN
//  save.story = {
//    seen:  { mãCảnh: 1 },          cảnh đã xem xong
//    flags: { dấu: 1 },             lựa chọn đã ghi dấu
//    done:  { mãChương: 1 },        chương đã xong (đã nhận quà)
//    cur:   { id, i, picks: [] } | null   cảnh đang xem dở (để kể tiếp đúng chỗ khi mở lại game)
//    buds:  { mãNụ: { st: 'bud'|'bloom'|'kept'|'given', day, wait, streak, lastWater } }   🌱 Nụ Mộng (GĐ20B)
//    queue: [mãCảnh]                cảnh chờ tự chiếu (vd nụ vừa nở)
//    cloud: số                      ☁️ điểm "Mây về" ở Mũi Én (GĐ21)
//  Các chương chia theo MẠCH (arc): 'main' và 'en' chạy song song, mỗi mạch có chương đang chơi riêng.
//  }
// =============================================================
import { CHAPTERS, SCENES, STORY_LINES, STORY_LINES_B, MO_LINES, DIEP_LINES, STORY_RULES, BUDS, ARCS } from '../../data/story.js';
import { heartsOf, addFp, BOND_IDS } from './relations.js';
import { VILLAGER_IDS } from './village.js';
import { isNight } from './time.js';
import { isLowTide, rareCaught, F as fishState } from './fishing.js';
import { CG_TEXT } from '../../data/story.js';
import { countOf as craftCount, pageCount } from './craft.js';
import { isFullMoon } from './fishing.js';
import { dayOf, calendarOf } from './calendar.js';
import { SEASONS } from '../../data/seasons.js';

export const createStoryState = () => ({ seen: {}, flags: {}, done: {}, cur: null, buds: {}, queue: [], cloud: 0 });
export const ARC_IDS = Object.keys(ARCS);
const arcOf = (ch) => ch.arc || 'main';

export function S(save) {
  save.story = save.story || createStoryState();
  const st = save.story;
  st.seen = st.seen || {}; st.flags = st.flags || {}; st.done = st.done || {};
  st.buds = st.buds || {}; st.queue = st.queue || []; st.cloud = st.cloud || 0;
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

// ---------------- 🌱 Nụ Mộng ----------------
export const BUD_IDS = Object.keys(BUDS);
export const budOf = (save, id) => S(save).buds[id] || null;
const BLOOMED = ['bloom', 'kept', 'given'];
export const bloomCount = (save) => BUD_IDS.filter((id) => BLOOMED.includes(budOf(save, id)?.st)).length;
export const decidedCount = (save) => BUD_IDS.filter((id) => ['kept', 'given'].includes(budOf(save, id)?.st)).length;
export const givenCount = (save) => BUD_IDS.filter((id) => budOf(save, id)?.st === 'given').length;
export const keptCount = (save) => BUD_IDS.filter((id) => budOf(save, id)?.st === 'kept').length;
/** Điểm xinh xắn cộng thêm từ Hoa Mộng giữ ở tiệm */
export const extraBeauty = (save) => keptCount(save) * STORY_RULES.budBeauty;

/** Nhận 1 nụ (trong cảnh truyện) */
export function getBud(save, id, day = 0) {
  const st = S(save);
  if (!BUDS[id] || st.buds[id]) return false;
  st.buds[id] = { st: 'bud', day, wait: 0, streak: 0, lastWater: 0 };
  return true;
}

/** Điều kiện nở của 1 nụ lúc này. ctx: { weather, hour } */
export function budReady(save, id, ctx = {}) {
  const b = budOf(save, id), w = BUDS[id]?.when;
  if (!b || b.st !== 'bud' || !w) return false;
  if (w.water) return (b.streak || 0) >= w.water;
  // nụ đợi thời tiết: phải ở trên kệ ít nhất qua 1 đêm (không nở ngay hôm vừa mang về)
  if (ctx.day != null && (b.day || 0) >= ctx.day) return false;
  if (w.weather && !w.weather.includes(ctx.weather)) return false;
  if (w.night && !isNight(ctx.hour ?? 12)) return false;
  return true;
}

/** Kiểm tra các nụ: nụ nào đủ điều kiện thì nở, xếp cảnh nở vào hàng chờ. Trả về danh sách mã nụ vừa nở. */
export function budTick(save, ctx = {}) {
  const st = S(save);
  const out = [];
  for (const id of BUD_IDS) {
    if (!budReady(save, id, ctx)) continue;
    st.buds[id].st = 'bloom';
    st.queue.push(`bloom_${id}`);
    out.push(id);
  }
  return out;
}

/** Tưới nụ (loại cần tưới mỗi ngày). Trả về { ok, streak, need, msg } */
export function waterBud(save, id, day) {
  const b = budOf(save, id), w = BUDS[id]?.when;
  if (!b || b.st !== 'bud' || !w?.water) return { ok: false, msg: 'Nụ này không cần tưới' };
  if (b.lastWater === day) return { ok: false, msg: 'Hôm nay đã tưới rồi, mai tưới tiếp nhé' };
  b.streak = b.lastWater === day - 1 ? (b.streak || 0) + 1 : 1;
  b.lastWater = day;
  return { ok: true, streak: b.streak, need: w.water };
}

/**
 * Sang ngày mới: nụ đợi thời tiết mà trời hôm nay không hợp thì đếm thêm 1 ngày chờ.
 * Chờ quá STORY_RULES.omenDays ⇒ trả về { id, type } để game "gọi" thời tiết đó cho ngày mai (Mơ báo trước).
 * ctx: { weather: thời tiết hôm nay, seasonTomorrow: mã mùa của ngày mai }
 */
export function omen(save, ctx = {}) {
  let pick = null;
  for (const id of BUD_IDS) {
    const b = budOf(save, id), w = BUDS[id].when;
    if (!b || b.st !== 'bud') continue;
    if (w.water) { if (b.lastWater && b.lastWater < (ctx.day || 0) - 1) b.streak = 0; continue; }
    if (w.weather.includes(ctx.weather)) { b.wait = 0; continue; }
    b.wait = (b.wait || 0) + 1;
    if (!pick && b.wait >= STORY_RULES.omenDays && (!w.season || w.season === ctx.seasonTomorrow)) pick = { id, type: w.weather[0] };
  }
  if (pick) S(save).buds[pick.id].wait = 0;
  return pick;
}

/** Giữ hoa ở tiệm (vẫn trao được về sau) */
export function keepBud(save, id) {
  const b = budOf(save, id);
  if (!b || b.st !== 'bloom') return false;
  b.st = 'kept';
  return true;
}

/** Trao hoa lại cho chủ (không lấy lại được) */
export function giveBud(save, id) {
  const st = S(save), b = st.buds[id];
  if (!b || !['bloom', 'kept'].includes(b.st)) return false;
  b.st = 'given';
  st.flags[`gave_${id}`] = 1;
  st.flags.gave_any = 1;
  if (givenCount(save) >= BUD_IDS.length) st.flags.all_given = 1;
  return true;
}

/** Kết thúc đã chọn: 'wake' | 'dream' | 'all' | null */
export function ending(save) {
  const f = S(save).flags;
  if (!S(save).done.c7) return null;
  return f.end_all ? 'all' : f.end_wake ? 'wake' : f.end_dream ? 'dream' : null;
}

// ---------------- điều kiện mở chương ----------------
const NEED_TEXT = {
  level: (n) => `Đạt cấp ${n}`,
  hearts: (n) => `Tổng ${n} ❤️ với dân làng`,
  orders: (n) => `Giao ${n} đơn hàng lớn`,
  shopLevel: (n) => `Quy mô tiệm bậc ${n}`,
  blooms: (n) => `Làm nở ${n} Nụ Mộng`,
  after: (id) => { const c = CHAPTERS.find((x) => x.id === id); return c ? `Xong chương ${c.n} “${c.title}”${arcOf(c) === 'main' ? ' của cốt truyện chính' : ''}` : id; },
  cloud: (n) => `${n} điểm ☁️ Mây về (thu hoạch hoa ở Mũi Én)`,
  days: (n) => `Đợi thêm ${n} ngày`,
  season: (id) => `Đợi tới ${SEASONS.find((x) => x.id === id)?.name || id}`,
};
const todayOf = (s) => dayOf(s.time?.gameMinutes || 0);
const NEED_VALUE = {
  level: (s) => s.player.level,
  hearts: (s) => VILLAGER_IDS.reduce((a, id) => a + heartsOf(s, id), 0),
  orders: (s) => s.orders?.done || 0,
  shopLevel: (s) => s.shopLevel || 0,
  blooms: (s) => bloomCount(s),
  cloud: (s) => S(s).cloud,
};

/** [{ text, ok, value, n }] */
export function needChecks(save, ch) {
  return Object.entries(ch.need || {}).map(([k, n]) => {
    if (k === 'after') { const ok = !!S(save).done[n]; return { text: NEED_TEXT.after(n), ok, value: ok ? 1 : 0, n: 1 }; }
    // (GĐ23) đợi n ngày game kể từ khi xong chương "after" · đợi tới mùa
    if (k === 'days') { const d0 = S(save).doneDay?.[ch.need.after]; const value = d0 ? todayOf(save) - d0 : 0; return { text: NEED_TEXT.days(Math.max(1, n - value)), ok: value >= n, value, n }; }
    if (k === 'season') { const ok = calendarOf(todayOf(save)).season.id === n; return { text: NEED_TEXT.season(n), ok, value: ok ? 1 : 0, n: 1 }; }
    const value = NEED_VALUE[k] ? NEED_VALUE[k](save) : 0;
    return { text: NEED_TEXT[k] ? NEED_TEXT[k](n) : k, ok: value >= n, value, n };
  });
}

// ---------------- tiến độ ----------------
const COUNTERS = {
  decided: decidedCount, blooms: bloomCount, given: givenCount, cloud: (s) => S(s).cloud,
  // (GĐ22) câu cá
  bottles: (s) => fishState(s).bottles, caught: (s) => fishState(s).caught, rare: (s) => rareCaught(s), mong: (s) => fishState(s).mong,
  // (GĐ23) Tiệm Hương Nhài
  pages: (s) => pageCount(s),
  // (GĐ25) Người mua đảo: tiệc & chi nhánh
  parties: (s) => s.party?.done || 0,
  branches: (s) => Object.values(s.branch?.b || {}).filter((b) => b.open).length,
  shipped: (s) => s.branch?.ships || 0,
  wedding: (s) => (s.party?.story_wedding != null ? 1 : 0),
};
// bộ đếm có dấu ':' (vd 'made:tea_jasmine', 'sold:tea_jasmine', 'gather:honey') đọc thẳng từ save.craft.count
const counterOf = (key) => COUNTERS[key] || (String(key).includes(':') ? (s) => craftCount(s, key) : () => 0);

/** Bước đang làm của mạch Cồn Lặng có đang cần thứ này không ('bottles' | 'mong') — để lúc quăng cần biết có thả chai thư / Cá Mộng */
export function wants(save, what) {
  const cur = current(save, 'lang');
  return !cur.finished && !cur.locked && cur.step?.count?.buds === what && cur.seen < cur.need;
}
const stepSeen = (save, step) => (step.count ? Math.min(step.count.n, counterOf(step.count.buds)(save)) : step.triggers.filter((t) => S(save).seen[t.scene]).length);
const stepNeed = (step) => (step.count ? step.count.n : step.need || step.triggers.length);
const stepDone = (save, step) => stepSeen(save, step) >= stepNeed(step);

/**
 * Chương đang chơi: { ch, index, stepIdx, step, seen, need, locked, checks, finished }
 *  locked: chương kế chưa đủ điều kiện · finished: đã xong hết các chương hiện có
 */
export function current(save, arc = 'main') {
  const st = S(save);
  const index = CHAPTERS.findIndex((c) => arcOf(c) === arc && !st.done[c.id]);
  if (index < 0) return { finished: true, arc };
  const ch = CHAPTERS[index];
  const checks = needChecks(save, ch);
  if (!checks.every((c) => c.ok)) return { ch, index, locked: true, checks, arc };
  let stepIdx = ch.steps.findIndex((sp) => !stepDone(save, sp));
  if (stepIdx < 0) stepIdx = ch.steps.length - 1;
  const step = ch.steps[stepIdx];
  return { ch, index, stepIdx, step, seen: stepSeen(save, step), need: stepNeed(step), checks, locked: false, arc };
}

/** Chương đang chơi của mọi mạch: { main: …, en: … } */
export const currentAll = (save) => Object.fromEntries(ARC_IDS.map((a) => [a, current(save, a)]));

/**
 * Các điểm kích hoạt đang mở: cảnh trong hàng chờ (tự chiếu) + bước hiện tại + cảnh chưa xem của những bước trước trong cùng chương.
 * ctx: { hour } — cảnh gặp Mơ (via 'mo') và điểm sáng có night: true chỉ có ban đêm.
 */
export function triggers(save, ctx = {}) {
  const st = S(save);
  const out = st.queue.filter((id) => sceneOf(id)).map((scene) => ({ scene, via: 'auto', queued: true }));
  const night = ctx.hour == null || isNight(ctx.hour);
  for (const arc of ARC_IDS) {
    const cur = current(save, arc);
    if (cur.finished || cur.locked) continue;
    cur.ch.steps.forEach((step, i) => {
      if (i > cur.stepIdx) return;
      for (const t of step.triggers) {
        if (st.seen[t.scene]) continue;
        if ((t.via === 'mo' || t.night) && !night) continue;
        if (t.lowTide && ctx.hour != null && !isLowTide(ctx.hour)) continue; // chỉ hiện lúc triều xuống
        if (t.moon && (ctx.day == null || !night || !isFullMoon(ctx.day, ctx.hour ?? 22))) continue; // (GĐ23) chỉ đêm rằm
        if (t.weather && ctx.weather != null && !t.weather.includes(ctx.weather)) continue; // (GĐ23) chỉ khi trời đúng kiểu
        if (t.hours && ctx.hour != null && (ctx.hour < t.hours[0] || ctx.hour >= t.hours[1])) continue;
        out.push({ ...t, chapter: cur.ch.id, arc, stepIdx: i, optional: i < cur.stepIdx });
      }
    });
  }
  return out;
}

export const triggerFor = (save, ctx, via, key) => triggers(save, ctx).find((t) => t.via === via && (via === 'villager' ? t.who === key : via === 'spot' ? t.scene === key : true)) || null;

/** Mơ đã "ra mắt" chưa (xong chương 1). Sau kết "Thức giấc" Mơ đã về với bà Diệp nên không còn hiện. */
export const moKnown = (save) => has(save, 'c1_mo') && ending(save) !== 'wake';

/** Mơ có hiện lúc này không */
export function moVisible(save, hour) {
  if (!isNight(hour)) return false;
  return moKnown(save) || triggers(save, { hour }).some((t) => t.via === 'mo');
}

// ---------------- xem cảnh ----------------
/** Cảnh theo mã. 'bloom_<nụ>' được dựng tự động từ BUDS[nụ].bloom */
export function sceneOf(id) {
  if (SCENES[id]) return SCENES[id];
  // 'bottle_<n>': vớt được chai thư thứ n (GĐ22) — hiện lá thư + 1 câu của Nhum
  const bt = /^bottle_(\d+)$/.exec(id || '');
  if (bt && CG_TEXT.bottles[+bt[1] - 1]) {
    const n = +bt[1];
    const say = { 2: 'Lại là “K.” nữa! Ổng đi lạc trong sương hả chị? Sao ổng không kêu to lên?', 3: 'Ổng lấy vợ rồi. Chắc ổng hết buồn rồi ha chị. ...Mà sao ổng vẫn còn viết thư?', 4: 'Có em bé! Chị ơi, cái cằm bướng là cằm làm sao?', 5: '“Lần này con không quay đầu.” Vậy là ổng về tới chưa hả chị?' }[n] || '...';
    return { title: `Chai thư thứ ${n}`, lines: [['cg', 'bottle', { i: n - 1 }], ['nar', 'Thêm một chiếc chai nữa. Giấy bên trong còn khô.'], ['nhum', n === 5 ? 'sad' : 'think', say], ['cg', null], ['end']] };
  }
  // 'hpage_<n>': mở trang Sổ Hương thứ n (GĐ23) — hiện trang sổ + hồi ức của bà Nhài
  const hp = /^hpage_(\d+)$/.exec(id || '');
  if (hp && CG_TEXT.hpages?.[+hp[1]]) {
    const pg = CG_TEXT.hpages[+hp[1]];
    return { title: `Sổ Hương · ${pg.title}`, lines: [['cg', 'hpage', { i: +hp[1] }], ...(pg.after || []).map((l) => (Array.isArray(l) ? l : ['nar', l])), ['cg', null], ['end']] };
  }
  const m = /^bloom_(\w+)$/.exec(id || '');
  const b = m && BUDS[m[1]];
  if (!b) return null;
  return { title: `${b.flower} nở`, lines: [
    ['cam', 'shelf', 2.2],
    ...b.bloom.map((t) => ['nar', t]),
    ['sfx', 'chime', 5],
    ['you', 'happy', `Nở rồi... Giờ giữ nó ở tiệm, hay mang trả cho ${b.who}?`],
    ['end'],
  ] };
}

/** Ghi nhận 1 lựa chọn trong cảnh: đặt dấu, cộng điểm tình thân. Trả về { remember, fp, bonds } */
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

/** So tiến độ trước/sau của 1 mạch: xong bước? xong chương (đánh dấu done, trả quà để game cộng)? */
function settleArc(save, before) {
  if (!before || before.finished || before.locked) return {};
  const st = S(save);
  const ch = before.ch;
  if (ch.steps.every((sp) => stepDone(save, sp))) {
    st.done[ch.id] = 1;
    st.doneDay = st.doneDay || {};
    st.doneDay[ch.id] = todayOf(save);
    return { stepDone: true, chapterDone: ch, reward: ch.reward || {}, next: current(save, before.arc) };
  }
  const after = current(save, before.arc);
  return { stepDone: after.stepIdx > before.stepIdx, nextGoal: after.step?.goal, next: after };
}

/** before = currentAll(save) lấy TRƯỚC khi thay đổi. Trả về kết quả của mạch có tiến triển (ưu tiên mạch vừa xong chương). */
function settle(save, before) {
  const all = before && before.main ? before : { [before?.arc || 'main']: before };
  const res = Object.values(all).map((b) => settleArc(save, b));
  return res.find((r) => r.chapterDone) || res.find((r) => r.stepDone) || res.find((r) => r.next) || {};
}

/**
 * Xem xong 1 cảnh. Trả về { stepDone, nextGoal, chapterDone: chương | null, reward }
 * (chưa cộng quà — game cộng tiền/XP/vé)
 */
export function finishScene(save, sceneId) {
  const st = S(save);
  const before = currentAll(save);
  st.cur = null;
  st.queue = st.queue.filter((x) => x !== sceneId);
  if (st.seen[sceneId]) return { already: true, ...settle(save, before) };
  st.seen[sceneId] = 1;
  return settle(save, before);
}

/** ☁️ Cộng điểm "Mây về" (thu hoạch hoa ở Mũi Én) */
export function addCloud(save, n) { const st = S(save); st.cloud = Math.max(0, st.cloud + n); return st.cloud; }

/** Gọi sau việc không phải cảnh (vd Giữ hoa ở tiệm, cộng Mây): before = currentAll(save) lấy TRƯỚC khi làm việc đó */
export const checkProgress = (save, before) => settle(save, before);

// ---------------- chữ ----------------
/** {name} = tên người chơi · {dấu?A|B} = có dấu thì A, không thì B */
export function fmt(text, save) {
  // (GĐ23) cho phép lồng nhau: {a?A|{b?B|C}} — thay từ trong ra ngoài
  let out = String(text ?? '');
  for (let k = 0; k < 6; k++) {
    const next = out.replace(/\{([!\w&|]+)\?([^{|}]*)\|([^{}]*)\}/g, (_, c, a, b) => (cond(save, c) ? a : b));
    if (next === out) break;
    out = next;
  }
  return out.replace(/\{name\}/g, save.player?.name || 'bạn');
}

/** Câu dân làng nói thêm theo tiến độ truyện (hoặc null). Câu của chương mới được ưu tiên. */
export function storyLine(save, id, rng = Math.random) {
  const of = (tbl) => (tbl[id] || []).filter((e) => cond(save, e.if)).flatMap((e) => e.lines);
  const late = of(STORY_LINES_B);
  const pool = late.length ? late : of(STORY_LINES);
  if (!pool.length || rng() > STORY_RULES.storyLineChance) return null;
  return pool[Math.floor(rng() * pool.length)];
}

const pickLine = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/** Mơ nói gì khi chạm vào lúc không có cảnh: ưu tiên gợi ý việc cần làm / nụ đang đợi gì */
export function moLine(save, rng = Math.random) {
  const waiting = BUD_IDS.filter((id) => budOf(save, id)?.st === 'bud');
  if (waiting.length && rng() < 0.35) return BUDS[pickLine(waiting, rng)].hint;
  const cur = current(save);
  if (cur.finished) return rng() < 0.3 ? 'Cây trên đồi nở đẹp ghê. Mơ ngắm hoài không chán!' : pickLine(MO_LINES, rng);
  if (cur.locked) {
    const miss = cur.checks.filter((c) => !c.ok).map((c) => c.text.toLowerCase()).join(', ');
    return rng() < 0.6 ? `Mơ thấy sắp có chuyện đó... Nhưng cậu cần ${miss} đã.` : pickLine(MO_LINES, rng);
  }
  return rng() < 0.6 && cur.step ? `Cậu nhớ nha: ${cur.step.goal.charAt(0).toLowerCase()}${cur.step.goal.slice(1)}.` : pickLine(MO_LINES, rng);
}

export const diepLine = (rng = Math.random) => pickLine(DIEP_LINES, rng);

/** Tóm tắt cho Sổ tay: [{ ch, state: 'done'|'active'|'locked'|'later', scenes: [{id,title,seen}], goal, seen, need, checks }] */
export function overview(save, arc = 'main') {
  const st = S(save);
  const cur = current(save, arc);
  return CHAPTERS.map((ch, i) => [ch, i]).filter(([ch]) => arcOf(ch) === arc).map(([ch, i]) => {
    const scenes = ch.steps.flatMap((sp) => sp.triggers.map((t) => ({ id: t.scene, title: SCENES[t.scene]?.title || t.scene, seen: !!st.seen[t.scene] })));
    // các cảnh "Trao lại" xem lại được ở thẻ chương 6
    if (ch.id === 'c6') for (const id of BUD_IDS) { const g = BUDS[id].give; if (st.seen[g]) scenes.push({ id: g, title: SCENES[g]?.title || g, seen: true }); }
    let state = 'later';
    if (st.done[ch.id]) state = 'done';
    else if (!cur.finished && cur.index === i) state = cur.locked ? 'locked' : 'active';
    return { ch, state, scenes, goal: state === 'active' ? cur.step.goal : null, seen: state === 'active' ? cur.seen : 0, need: state === 'active' ? cur.need : 0, checks: needChecks(save, ch) };
  });
}

/** Danh sách nụ cho giao diện: [{ id, def, st, streak, need, canWater }] */
export function budList(save, day = 0) {
  return BUD_IDS.map((id) => {
    const b = budOf(save, id), def = BUDS[id];
    return { id, def, st: b?.st || null, streak: b?.streak || 0, need: def.when.water || 0, canWater: !!def.when.water && b?.st === 'bud' && b.lastWater !== day };
  });
}
