// 📈 Nền kinh tế quần đảo sống (0.31 · gói C) — LOGIC THUẦN. Số liệu: data/economy.js
// Giá & tin đồn tính được từ số ngày (không cần lưu). save.econ = { supply: { [đảo]: { pts, cycle, reqs: [{...yêu cầu, done}], got } } }
import { PRICE, RUMOR_RULES, RUMORS, SUPPLY_RULES, ISLANDS } from '../../data/economy.js';
import { FLOWERS, NORMAL_FLOWER_IDS } from '../../data/flowers.js';
import { inSeason, festivalOn } from './calendar.js';
import { tonesOf, parseFlowerKey } from './variants.js';
import { parseFishKey } from './fishing.js';
import { wholesalePrice } from './shop.js';

const hash = (str) => { let h = 2166136261; for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 16; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; // FNV + trộn bit (giá trị đều hơn)
const fail = (msg) => ({ ok: false, msg });
const SELLABLE = NORMAL_FLOWER_IDS;

export function E(save) {
  save.econ = save.econ || {};
  save.econ.supply = save.econ.supply || {};
  return save.econ;
}

// ============================================================= TIN ĐỒN
/** Tin đồn được loan ra vào ngày `day` (hoặc null): { day (ngày loan tin), target (ngày xảy ra), kind, mult, species: [...], text } */
export function rumorOn(day) {
  if (hash(`rumor:${day}`) >= RUMOR_RULES.chance) return null;
  const R = RUMORS[Math.floor(hash(`rt:${day}`) * RUMORS.length)];
  const [a, b] = RUMOR_RULES.lead;
  const target = day + a + Math.floor(hash(`rl:${day}`) * (b - a + 1));
  let species;
  if (R.species) {
    const pool = SELLABLE.filter((f) => !FLOWERS[f].salt);
    species = [pool[Math.floor(hash(`rs:${day}`) * pool.length)]];
  } else species = SELLABLE.filter((f) => FLOWERS[f].tones?.includes(R.tone)).sort((x, y) => hash(`${day}:${x}`) - hash(`${day}:${y}`)).slice(0, RUMOR_RULES.perTone);
  const sp1 = FLOWERS[species[0]]?.name?.toLowerCase() || 'hoa';
  return { day, target, kind: R.kind, mult: R.mult, species, island: R.island, text: R.text.replace('{loài}', sp1) };
}
/** Các tin đồn có hiệu lực vào ngày `day` (loan tin trong vòng 4 ngày trước). known: chỉ tính tin đã loan tới ngày này */
export function rumorsFor(day, known = Infinity) {
  const out = [];
  for (let d = day - 4; d < day; d++) { const r = rumorOn(d); if (r && r.target === day && r.day <= known) out.push(r); }
  return out;
}
/** Tin đồn người chơi đã nghe (loan trong `back` ngày gần đây, sự kiện chưa qua hoặc vừa qua) */
export function recentRumors(today, back = 4) {
  const out = [];
  for (let d = today; d > today - back; d--) { const r = rumorOn(d); if (r && r.target >= today - 1) out.push(r); }
  return out;
}

// ============================================================= GIÁ CHỢ
/** Chỉ số giá bán sỉ của loài vào ngày `day` (1 = giá gốc). known: chỉ tính tin đồn đã loan tới ngày đó (để dự báo) */
export function priceIndex(species, day, known = Infinity) {
  if (!FLOWERS[species] || FLOWERS[species].luck) return 1;
  const h = hash(`p:${species}`);
  const [p1, p2] = PRICE.periodDays;
  const period = p1 + h * (p2 - p1);
  let k = 1 + PRICE.wave * Math.sin((day / period) * Math.PI * 2 + h * 10);
  if (known >= day) k += PRICE.noise * (hash(`n:${species}:${day}`) * 2 - 1); // nhiễu từng ngày: không đoán trước được
  k *= inSeason(species, day) ? PRICE.inSeason : PRICE.offSeason;
  if (festivalOn(day)?.flowers?.includes(species)) k *= PRICE.festival;
  for (const r of rumorsFor(day, known)) if (r.species.includes(species)) k *= r.mult;
  return Math.max(PRICE.min, Math.min(PRICE.max, Math.round(k * 100) / 100));
}

/** Biểu đồ giá: [{ day, k, forecast }] từ (today - history) tới (today + forecast) */
export function priceChart(species, today) {
  const out = [];
  for (let d = today - PRICE.history; d <= today + PRICE.forecast; d++) {
    if (d < 1) continue;
    out.push({ day: d, k: priceIndex(species, d, d > today ? today : Infinity), forecast: d > today });
  }
  return out;
}

/** Giá bán sỉ 1 cành (đã nhân chỉ số giá, ưu đãi đảo) */
export function wholesaleNow(save, key, day) {
  const f = parseFlowerKey(key);
  let k = priceIndex(f.species, day);
  if (FLOWERS[f.species]?.salt) k *= perkMult(save, 'salt');
  return Math.max(1, Math.round(wholesalePrice(key) * k));
}

// ============================================================= CHUỖI CUNG ỨNG
export const islandOpen = (save, id, has) => !ISLANDS[id].need || has(ISLANDS[id].need);
export function islandLevel(save, id) {
  const p = E(save).supply[id]?.pts || 0;
  let lv = 0;
  SUPPLY_RULES.levels.forEach((need, i) => { if (p >= need) lv = i; });
  return lv;
}
/** Hệ số ưu đãi theo cấp đảo (key: spawn | salt | fish | craft | snack) */
export function perkMult(save, key) {
  for (const [id, I] of Object.entries(ISLANDS)) if (I.perk.key === key) return 1 + I.perk.perLevel * islandLevel(save, id);
  return 1;
}
export const cycleOf = (day) => Math.floor((day - 1) / SUPPLY_RULES.cycleDays);
export const cycleLeft = (day) => SUPPLY_RULES.cycleDays - ((day - 1) % SUPPLY_RULES.cycleDays);

/** Cập nhật chu kỳ yêu cầu của các đảo. Trả về [{ id, decayed }] cho đảo vừa sang chu kỳ mới */
export function ensureCycles(save, day, has) {
  const cyc = cycleOf(day), out = [];
  for (const [id, I] of Object.entries(ISLANDS)) {
    if (!islandOpen(save, id, has)) continue;
    const st = E(save).supply[id] || (E(save).supply[id] = { pts: 0, cycle: -1, reqs: [], got: 0 });
    if (st.cycle === cyc) continue;
    let decayed = 0;
    if (st.cycle >= 0 && st.got === 0 && st.pts > 0) { decayed = Math.min(st.pts, SUPPLY_RULES.decay); st.pts -= decayed; }
    st.cycle = cyc; st.got = 0;
    const idx = I.pool.map((_, i) => i).sort((a, b) => hash(`${id}:${cyc}:${a}`) - hash(`${id}:${cyc}:${b}`)).slice(0, SUPPLY_RULES.perCycle);
    st.reqs = idx.map((i) => ({ ...I.pool[i], done: false }));
    out.push({ id, decayed });
  }
  return out;
}

export function reqText(r) {
  if (r.kind === 'flower') return `${r.n} cành hoa${r.tone ? ` tông ${{ warm: 'ấm', cool: 'mát', pastel: 'pastel', natural: 'mộc mạc' }[r.tone]}` : ''}${r.q > 1 ? ` từ ${r.q}★` : ''}`;
  if (r.kind === 'item') return `${r.n} ${{ fertilizer: '🧪 phân bón', fishmeal: '🐟 phân cá' }[r.id] || r.id}`;
  if (r.kind === 'craft') return `${r.n} món hàng Tiệm Hương Nhài`;
  return `${r.n} con cá`;
}

/** Tìm hàng trong kho đáp ứng yêu cầu: { ok, take: [[loại, mã, số]], value } — ưu tiên hàng rẻ nhất */
export function findGoods(save, r) {
  const take = []; let need = r.n, value = 0;
  if (r.kind === 'flower') {
    const keys = Object.entries(save.inventory.flowers).filter(([k, n]) => n > 0 && (() => { const f = parseFlowerKey(k); return f.q >= (r.q || 1) && !FLOWERS[f.species]?.luck && (!r.tone || tonesOf(f.species, f.variant).includes(r.tone)); })())
      .sort((a, b) => wholesalePrice(a[0]) - wholesalePrice(b[0]));
    for (const [k, n] of keys) { if (!need) break; const t = Math.min(n, need); take.push(['flower', k, t]); need -= t; value += wholesalePrice(k) * t; }
  } else if (r.kind === 'item') {
    const have = save.inventory.items[r.id] || 0;
    if (have >= need) { take.push(['item', r.id, need]); value += 15 * need; need = 0; }
  } else if (r.kind === 'craft') {
    for (const [k, n] of Object.entries(save.craft?.goods || {})) { if (!need || n <= 0) continue; const t = Math.min(n, need); take.push(['craft', k, t]); need -= t; value += 70 * t; }
  } else if (r.kind === 'fish') {
    for (const [k, n] of Object.entries(save.fish?.bag || {})) { if (!need || n <= 0) continue; const t = Math.min(n, need); take.push(['fish', k, t]); need -= t; value += 25 * (1 + parseFishKey(k).q) * t; }
  }
  return need > 0 ? { ok: false, take: [], value: 0 } : { ok: true, take, value };
}

/** Giao 1 yêu cầu cho đảo. Trả về { ok, coins, pts, levelUp, allDone, msg } */
export function deliver(save, id, i) {
  const st = E(save).supply[id], r = st?.reqs[i];
  if (!r || r.done) return fail('Yêu cầu không còn');
  const g = findGoods(save, r);
  if (!g.ok) return fail(`Kho chưa đủ: cần ${reqText(r)}`);
  for (const [kind, k, n] of g.take) {
    if (kind === 'flower') { save.inventory.flowers[k] -= n; if (!save.inventory.flowers[k]) delete save.inventory.flowers[k]; }
    else if (kind === 'item') save.inventory.items[k] -= n;
    else if (kind === 'craft') save.craft.goods[k] -= n;
    else if (kind === 'fish') { save.fish.bag[k] -= n; if (!save.fish.bag[k]) delete save.fish.bag[k]; }
  }
  const before = islandLevel(save, id);
  r.done = true; st.got++;
  let pts = SUPPLY_RULES.pts;
  const allDone = st.reqs.every((x) => x.done);
  if (allDone) pts += SUPPLY_RULES.bonusAll;
  st.pts += pts;
  const coins = Math.round(g.value * SUPPLY_RULES.coinsPer);
  save.player.coins += coins;
  const after = islandLevel(save, id);
  return { ok: true, coins, pts, allDone, levelUp: after > before ? after : 0, msg: `${ISLANDS[id].icon} Đã giao ${reqText(r)} cho ${ISLANDS[id].name}: +${coins} 💰 · +${pts} phát triển${allDone ? ' (đủ cả chu kỳ!)' : ''}` };
}
