// 📖 Sổ thưởng mùa & điểm danh (GĐ26) — logic thuần. Tính theo NGÀY THẬT giờ Việt Nam.
// save.pass = { season, pts, claimed: [bậc], day: 'YYYY-MM-DD', dayPts }
// save.checkin = { last: 'YYYY-MM-DD', n (số ngày đã điểm danh trong vòng 28), streak (vị trí 0–6 trong tuần), mile: [số ngày đã nhận mốc] }
import { PASS_RULES, PASS_POINTS, PASS_THEMES, PASS_REWARDS, CHECKIN_WEEK, CHECKIN_MILESTONES } from '../../data/pass.js';

export const vnDate = (ts = Date.now()) => new Date(ts + 7 * 3600 * 1000).toISOString().slice(0, 10);
const dayNum = (d) => Math.floor(Date.parse(`${d}T00:00:00Z`) / 86400000);
const fail = (msg) => ({ ok: false, msg });

/** Mùa sổ hiện tại: { index, theme, start, end, daysLeft } */
export function seasonOf(ts = Date.now()) {
  const d = dayNum(vnDate(ts)) - dayNum(PASS_RULES.epoch);
  const index = Math.floor(d / PASS_RULES.days);
  const into = d - index * PASS_RULES.days;
  return { index, theme: PASS_THEMES[((index % PASS_THEMES.length) + PASS_THEMES.length) % PASS_THEMES.length], daysLeft: PASS_RULES.days - into };
}

export function P(save, ts = Date.now()) {
  const se = seasonOf(ts);
  save.pass = save.pass || { season: se.index, pts: 0, claimed: [], day: '', dayPts: 0 };
  const p = save.pass;
  if (p.season !== se.index) Object.assign(p, { season: se.index, pts: 0, claimed: [] }); // mùa sổ mới
  const today = vnDate(ts);
  if (p.day !== today) { p.day = today; p.dayPts = 0; }
  p.claimed = p.claimed || [];
  return p;
}
export const tierOf = (save, ts) => Math.min(PASS_RULES.tiers, Math.floor(P(save, ts).pts / PASS_RULES.perTier));

/** Cộng điểm. kind = khóa trong PASS_POINTS, n = số lần. Trả về { added, tierUp } */
export function add(save, kind, n = 1, ts = Date.now()) {
  const per = PASS_POINTS[kind];
  if (!per || n <= 0) return { added: 0 };
  const p = P(save, ts);
  const before = tierOf(save, ts);
  const room = Math.max(0, PASS_RULES.dailyCap - p.dayPts);
  const added = Math.min(room, Math.round(per * n));
  if (!added) return { added: 0 };
  p.pts = Math.min(PASS_RULES.tiers * PASS_RULES.perTier, p.pts + added);
  p.dayPts += added;
  return { added, tierUp: tierOf(save, ts) > before ? tierOf(save, ts) : 0 };
}

/** Quà bậc t (1–30), đã thay outfit 0/1/2 bằng mã trang phục của chủ đề */
export function rewardOf(t, ts = Date.now()) {
  const rw = { ...PASS_REWARDS[t - 1] };
  if (rw.outfit != null) rw.outfit = seasonOf(ts).theme.outfits[rw.outfit];
  return rw;
}
/** Nhận quà bậc t. Trả về { ok, rw } — game cộng quà */
export function claim(save, t, ts = Date.now()) {
  const p = P(save, ts);
  if (t < 1 || t > PASS_RULES.tiers) return fail('Không rõ');
  if (p.claimed.includes(t)) return fail('Đã nhận rồi');
  if (tierOf(save, ts) < t) return fail(`Cần lên bậc ${t}`);
  p.claimed.push(t);
  return { ok: true, rw: rewardOf(t, ts) };
}
export const claimable = (save, ts) => { const t = tierOf(save, ts), p = P(save, ts); let n = 0; for (let i = 1; i <= t; i++) if (!p.claimed.includes(i)) n++; return n; };

// ---------------- điểm danh ----------------
export function C(save) {
  save.checkin = save.checkin || { last: '', n: 0, streak: 0, mile: [] };
  save.checkin.mile = save.checkin.mile || [];
  return save.checkin;
}
export const canCheckin = (save, ts = Date.now()) => C(save).last !== vnDate(ts);
/** Điểm danh hôm nay. Trả về { ok, rw (quà ngày), mile (quà mốc nếu có), day (ngày thứ mấy trong tuần 1–7), n } */
export function checkin(save, ts = Date.now()) {
  const c = C(save), today = vnDate(ts);
  if (c.last === today) return fail('Hôm nay đã điểm danh rồi');
  // vòng 28 ngày: đủ 28 thì bắt đầu vòng mới
  if (c.n >= 28) { c.n = 0; c.mile = []; }
  const idx = c.n % CHECKIN_WEEK.length;
  c.n += 1;
  c.last = today;
  c.streak = idx;
  const rw = { ...CHECKIN_WEEK[idx] };
  const m = CHECKIN_MILESTONES.find((x) => x.days === c.n && !c.mile.includes(x.days));
  if (m) c.mile.push(m.days);
  return { ok: true, rw, mile: m ? { ...m } : null, day: idx + 1, n: c.n };
}
export { PASS_RULES, PASS_POINTS, PASS_REWARDS, CHECKIN_WEEK, CHECKIN_MILESTONES };
