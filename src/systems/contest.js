// =============================================================
//  CUỘC THI HOA (thuần dữ liệu) — dùng chung cho game VÀ Edge Function trên máy chủ
// =============================================================
import { CONTEST, CONTEST_THEMES } from '../../data/contest.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { scoreBouquet } from './bouquet.js';
import { parseFlowerKey, variantData } from './variants.js';
import { VARIANTS } from '../../data/variants.js';

const VN_OFFSET = 7 * 3600 * 1000;
const DAY = 86400000;

/** Mùa thi hiện tại theo giờ Việt Nam: tuần ISO (thứ Hai 00:00 → Chủ nhật 24:00) */
export function roundOf(ms = Date.now()) {
  const vn = new Date(ms + VN_OFFSET);
  const dow = (vn.getUTCDay() + 6) % 7; // 0 = thứ Hai
  const mondayVn = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() - dow);
  // tuần ISO: năm theo thứ Năm của tuần
  const thu = new Date(mondayVn + 3 * DAY);
  const year = thu.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const week1Mon = Date.UTC(year, 0, 4 - ((jan4.getUTCDay() + 6) % 7));
  const week = Math.round((mondayVn - week1Mon) / (7 * DAY)) + 1;
  const theme = CONTEST_THEMES[(year * 53 + week) % CONTEST_THEMES.length];
  const startsAt = mondayVn - VN_OFFSET;
  return { id: `${year}-W${String(week).padStart(2, '0')}`, theme, startsAt, endsAt: startsAt + 7 * DAY };
}

export const previousRound = (ms = Date.now()) => roundOf(roundOf(ms).startsAt - 1000);

/**
 * Chấm 1 bài dự thi. sel = { items: {"rose:red|3": 2}, paper, ribbon }
 * Trả về { ok, reason?, score, parts, rareBonus, total }
 */
export function contestScore(theme, sel) {
  const items = [];
  for (const [k, n] of Object.entries(sel?.items || {})) {
    if (!/^[a-z]+:[a-z]+\|[1-3]$/.test(k) || !Number.isInteger(n) || n < 0 || n > 20) return { ok: false, reason: 'Dữ liệu bó hoa không hợp lệ' };
    if (!n) continue;
    const f = parseFlowerKey(k);
    if (!VARIANTS[f.species]?.[f.variant]) return { ok: false, reason: 'Loài hoa không hợp lệ' };
    items.push({ species: f.species, variant: f.variant, q: f.q, n });
  }
  const total = items.reduce((a, b) => a + b.n, 0);
  if (total < theme.min || total > theme.max) return { ok: false, reason: `Bó hoa cần từ ${theme.min} đến ${theme.max} cành`, total };
  if (!PAPERS[sel.paper] || !RIBBONS[sel.ribbon]) return { ok: false, reason: 'Hãy chọn giấy gói và ruy băng', total };
  const r = scoreBouquet({ tone: theme.tone, meaning: theme.meaning, min: theme.min, max: theme.max }, items, sel.paper, sel.ribbon);
  const rareN = items.reduce((a, it) => { const rar = variantData(it.species, it.variant).rarity; return a + it.n * (rar === 'rare' || rar === 'legend' ? 1 : rar === 'uncommon' ? 0.5 : 0); }, 0);
  const rareBonus = Math.round(Math.min(CONTEST.rareBonusMax, (rareN / total) * CONTEST.rareBonusMax * 2));
  const score = Math.min(110, Math.round(r.score + rareBonus));
  return { ok: true, score, base: r.score, parts: r.parts, tips: r.tips, rareBonus, total };
}

/** Thưởng theo hạng (rank bắt đầu từ 1) */
export function contestReward(rank, players) {
  for (const r of CONTEST.rewards) {
    if (r.top && rank <= r.top) return r;
    if (r.topPct && rank <= Math.ceil((players * r.topPct) / 100)) return r;
  }
  return CONTEST.rewards[CONTEST.rewards.length - 1];
}
