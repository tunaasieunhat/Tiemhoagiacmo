// =============================================================
//  CHẤM ĐIỂM BÓ HOA SÁNG TẠO (thuần dữ liệu)
//  4 tiêu chí (0–100): Phối màu · Ý nghĩa · Cân đối · Chất lượng
// =============================================================
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { MEANINGS } from '../../data/variants.js';
import { tonesOf, meaningsOf, variantData } from './variants.js';

export const WEIGHTS = { color: 0.3, meaning: 0.3, balance: 0.2, quality: 0.2 };
export const PART_NAMES = { color: 'Phối màu', meaning: 'Ý nghĩa', balance: 'Cân đối', quality: 'Chất lượng' };

function hsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/** Độ hài hòa của các màu cánh hoa (0..1). Trắng/kem được coi là màu trung tính. */
export function hueHarmony(colors) {
  const hues = colors.map(hsl).filter((c) => c.s > 0.25 && c.l < 0.92).map((c) => c.h);
  if (hues.length <= 1) return 1;
  // gom các màu gần nhau (≤ 35°) thành nhóm
  const groups = [];
  for (const h of hues) {
    const g = groups.find((x) => hueDist(x, h) <= 35);
    if (!g && g !== 0) groups.push(h);
  }
  if (groups.length === 1) return 1;
  if (groups.length === 2) {
    const d = hueDist(groups[0], groups[1]);
    if (d <= 70) return 0.9;            // màu tương đồng
    if (d >= 150) return 0.85;          // màu bổ túc (tương phản đẹp)
    return 0.55;
  }
  if (groups.length === 3) return 0.45;
  return 0.2;
}

/**
 * items: [{species, variant, q, n}]
 * req: { tone, meaning?, min, max }
 * Trả về { parts: {color, meaning, balance, quality}, score, tips: [] }
 */
export function scoreBouquet(req, items, paperId, ribbonId) {
  const total = items.reduce((a, b) => a + b.n, 0);
  const tips = [];
  if (!total) return { parts: { color: 0, meaning: 0, balance: 0, quality: 0 }, score: 0, tips };
  const paper = PAPERS[paperId], ribbon = RIBBONS[ribbonId];

  // --- phối màu ---
  const inTone = items.filter((it) => tonesOf(it.species, it.variant).includes(req.tone)).reduce((a, b) => a + b.n, 0) / total;
  const harmony = hueHarmony(items.map((it) => variantData(it.species, it.variant).petal));
  const color = 100 * (0.25 * (paper?.tones.includes(req.tone) ? 1 : 0) + 0.15 * (ribbon?.tones.includes(req.tone) ? 1 : 0) + 0.35 * inTone + 0.25 * harmony);
  if (inTone < 0.5) tips.push('Chọn thêm hoa hợp tông khách thích');
  if (paper && !paper.tones.includes(req.tone)) tips.push('Đổi giấy gói hợp tông hơn');
  if (harmony < 0.5) tips.push('Bớt số màu hoa cho đỡ rối mắt');

  // --- ý nghĩa ---
  const negatives = new Set();
  items.forEach((it) => meaningsOf(it.species, it.variant).forEach((m) => { if (MEANINGS[m]?.negative && m !== req.meaning) negatives.add(m); }));
  let meaning;
  if (req.meaning) {
    const match = items.filter((it) => meaningsOf(it.species, it.variant).includes(req.meaning)).reduce((a, b) => a + b.n, 0) / total;
    meaning = match > 0 ? 35 + 65 * Math.min(1, match / 0.6) : 10; // 60% số hoa đúng ý nghĩa là đạt tối đa
    if (match === 0) tips.push(`Chưa có hoa mang ý nghĩa "${MEANINGS[req.meaning].name}"`);
  } else meaning = 75;
  if (negatives.size) {
    meaning -= 35 * negatives.size;
    tips.push(`Có hoa mang ý nghĩa không hợp: ${[...negatives].map((m) => MEANINGS[m].name).join(', ')}`);
  }
  meaning = Math.max(0, meaning);

  // --- cân đối ---
  const bySpecies = {};
  items.forEach((it) => { bySpecies[it.species] = (bySpecies[it.species] || 0) + it.n; });
  const nSpecies = Object.keys(bySpecies).length;
  const focal = Math.max(...Object.values(bySpecies)) / total;
  let balance = total % 2 === 1 ? 30 : 10; // người Việt thường tặng hoa số lẻ
  if (total % 2 === 0) tips.push('Người Việt thường tặng hoa số lẻ (3, 5, 7...)');
  if (nSpecies === 1) balance += 25;
  else if (focal >= 0.4 && focal <= 0.75) balance += 40; // có hoa chủ đạo + hoa điểm xuyết
  else { balance += 20; tips.push('Nên có 1 loài hoa chủ đạo, các loài khác điểm xuyết'); }
  if (nSpecies >= 2 && nSpecies <= 3) balance += 20;
  else if (nSpecies > 3) { balance += 5; tips.push('Quá nhiều loài hoa trong một bó'); }
  const span = Math.max(1, req.max - req.min);
  balance += 10 * Math.min(1, (total - req.min) / span);
  balance = Math.min(100, balance);

  // --- chất lượng ---
  const qAvg = items.reduce((a, it) => a + it.q * it.n, 0) / total;
  const quality = 100 * ((qAvg - 1) / 2) * 0.85 + 15;
  if (qAvg < 2) tips.push('Hoa chất lượng cao (★★★) sẽ được điểm cao hơn');

  const parts = { color: Math.round(color), meaning: Math.round(meaning), balance: Math.round(balance), quality: Math.round(quality) };
  const score = Math.round(Object.entries(WEIGHTS).reduce((a, [k, w]) => a + parts[k] * w, 0));
  return { parts, score, tips, qAvg };
}
