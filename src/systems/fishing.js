// =============================================================
//  🎣 CÂU CÁ (GĐ22) — LOGIC THUẦN
//  save.fish = {
//    bait: { worm: 10, … }, baitSel: 'worm',
//    rod: 'bamboo', rods: ['bamboo'], line: 0, float: 0,
//    bag:  { 'chep|2': 3, 'koi|3|s': 1 }      cá trong giỏ: loài|số sao(|s = ánh kim)
//    book: { chep: { n, max, q, shiny } }      Sổ cá: số con đã câu, con to nhất (cm), sao cao nhất
//    spotDone: ['pond']                         chỗ câu đã nhận thưởng sưu tầm đủ
//    casts, caught, bottles (chai thư đã vớt), sinceBottle, mong (đã câu được Cá Mộng)
//  }
// =============================================================
import { FISH, FISH_SPOTS, FISH_RULES, BAITS, RODS, GEAR, JUNK, CHEST, PEARL, MONG, SPOT_REWARD } from '../../data/fishing.js';
import { isNight } from './time.js';
import { calendarOf } from './calendar.js';
import { parseVkey, variantName } from './variants.js';

export const createFishState = () => ({ bait: {}, baitSel: 'worm', rod: 'bamboo', rods: ['bamboo'], line: 0, float: 0, bag: {}, book: {}, spotDone: [], casts: 0, caught: 0, bottles: 0, sinceBottle: 0, mong: 0 });

export function F(save) {
  save.fish = save.fish || createFishState();
  const f = save.fish, d = createFishState();
  for (const k of Object.keys(d)) if (f[k] === undefined) f[k] = d[k];
  return f;
}

export const FISH_IDS = Object.keys(FISH);
export const fishOfSpot = (spot) => FISH_IDS.filter((id) => FISH[id].s === spot);
export const fishKey = (id, q, shiny) => `${id}|${q}${shiny ? '|s' : ''}`;
export const parseFishKey = (k) => { const [id, q, s] = k.split('|'); return { id, q: +q || 1, shiny: s === 's' }; };

/** Triều đang xuống? */
export const isLowTide = (hour) => FISH_RULES.lowTide.some(([a, b]) => hour >= a && hour < b);
/** Đêm rằm? (đêm của ngày chia hết cho moonEvery; rạng sáng hôm sau vẫn tính) */
export const isFullMoon = (day, hour) => ((hour < 6 ? day - 1 : day) % FISH_RULES.moonEvery) === 0;

/** Điều kiện môi trường lúc này. ctx: { hour, day, weather } */
export function envOf(ctx = {}) {
  const hour = ctx.hour ?? 12, day = ctx.day ?? 1;
  return { hour, day, night: isNight(hour), lowTide: isLowTide(hour), moon: isFullMoon(day, hour) && isNight(hour), rain: ['rain', 'storm', 'hail'].includes(ctx.weather), fog: ctx.weather === 'fog', season: calendarOf(day).season.id, weather: ctx.weather };
}

/** Chỗ câu có dùng được lúc này không: { ok, msg } */
export function spotOpen(save, spotId, ctx = {}) {
  const sp = FISH_SPOTS[spotId];
  if (!sp) return { ok: false, msg: 'Không có chỗ câu này' };
  const e = envOf(ctx);
  if (sp.lowTide && !e.lowTide) return { ok: false, msg: 'Triều đang lên, rặng đá chìm dưới nước. Quay lại lúc 5–8 giờ hoặc 17–20 giờ nhé' };
  if (sp.night && !e.night) return { ok: false, msg: 'Biển sương chỉ câu được ban đêm (sau 19:00)' };
  return { ok: true };
}

const fishFits = (f, e) => (!f.night || e.night) && (!f.day || !e.night) && (!f.rain || e.rain) && (!f.fog || e.fog) && (!f.moon || e.moon) && (!f.season || f.season === e.season);

/** Các loài đang có ở chỗ câu lúc này */
export const fishNow = (spotId, ctx = {}) => { const e = envOf(ctx); return fishOfSpot(spotId).filter((id) => fishFits(FISH[id], e)); };

const pickW = (rng, list) => { let r = rng() * list.reduce((a, [, w]) => a + w, 0); for (const [v, w] of list) { r -= w; if (r <= 0) return v; } return list[list.length - 1][0]; };

/**
 * Quăng cần: trừ 1 mồi và quyết định thứ cắn câu.
 * opts: { far: quăng trúng vùng xa, wantBottle: cốt truyện đang cần chai thư, wantMong: đang ở bước câu Cá Mộng }
 * Trả về { ok, msg } hoặc { ok, kind: 'fish'|'junk'|'chest'|'bottle'|'mong', fish, cm, q, shiny, tier, junk }
 */
export function cast(save, spotId, ctx = {}, rng = Math.random, opts = {}) {
  const st = F(save);
  const open = spotOpen(save, spotId, ctx);
  if (!open.ok) return open;
  const baitId = st.baitSel;
  const bait = BAITS[baitId];
  if (!bait || !(st.bait[baitId] > 0)) return { ok: false, msg: 'Hết mồi rồi! Mua thêm ở quầy cá của Nhum', noBait: true };
  if (spotId === 'fogsea' && baitId !== 'glow') return { ok: false, msg: 'Biển sương tối lắm: phải dùng ✨ Mồi đêm cá mới thấy' };
  st.bait[baitId] -= 1;
  st.casts += 1;
  const e = envOf(ctx);
  // Cá Mộng: đêm rằm ở Biển sương, khi cốt truyện đã tới bước đó
  if (opts.wantMong && spotId === 'fogsea' && e.moon && !st.mong) return { ok: true, kind: 'mong', fish: MONG, cm: 300, q: 3, tier: 4, bait: baitId };
  // chai thư (cốt truyện) — chỉ ở Cồn Lặng
  if (opts.wantBottle && ['cpier', 'lagoon', 'reef', 'fogsea'].includes(spotId)) {
    st.sinceBottle += 1;
    if (st.sinceBottle > FISH_RULES.bottlePity || rng() < FISH_RULES.bottleChance) { st.sinceBottle = 0; return { ok: true, kind: 'bottle', bait: baitId }; }
  }
  const r = rng();
  if (r < FISH_RULES.junkChance) return { ok: true, kind: 'junk', junk: JUNK[Math.floor(rng() * JUNK.length)], bait: baitId };
  if (r < FISH_RULES.junkChance + FISH_RULES.chestChance) return { ok: true, kind: 'chest', bait: baitId };
  const rod = RODS[st.rod] || RODS.bamboo;
  const pool = fishNow(spotId, ctx).map((id) => {
    const f = FISH[id];
    let w = FISH_RULES.tierWeight[f.t] * (bait.tier[f.t] ?? 1);
    if (f.b.includes(baitId)) w *= FISH_RULES.baitMatch;
    if (opts.far && f.t >= 2) w *= 1 + FISH_RULES.farCast + rod.far;
    return [id, w];
  });
  if (!pool.length) return { ok: true, kind: 'junk', junk: JUNK[0], bait: baitId };
  const fish = FISH[pickW(rng, pool)];
  const k = rng() ** (opts.far ? 0.8 : 1.15); // quăng xa: cá to hơn một chút
  const cm = Math.round(fish.cm[0] + (fish.cm[1] - fish.cm[0]) * k);
  const q = k >= FISH_RULES.starAt[1] ? 3 : k >= FISH_RULES.starAt[0] ? 2 : 1;
  return { ok: true, kind: 'fish', fish, cm, q, shiny: rng() < FISH_RULES.shinyChance, tier: fish.t, bait: baitId };
}

/** Thông số mini game kéo cá cho 1 lần cắn câu */
export function reelConfig(save, c) {
  const st = F(save), R = FISH_RULES.reel, t = c.tier ?? 0;
  const rod = RODS[st.rod] || RODS.bamboo;
  return {
    zone: R.zone[t] + rod.zone, gain: R.gain[t], drain: R.drain[t], start: R.startProgress,
    up: R.tensionUp, down: R.tensionDown, snapAfter: R.snapAfter + st.line * GEAR.line.snapBonus, timeLimit: R.timeLimit,
    move: c.fish?.mv || 'calm', biteWindow: FISH_RULES.biteWindow + st.float * GEAR.float.windowBonus,
    waitMin: FISH_RULES.waitMin, waitMax: FISH_RULES.waitMax,
  };
}

/**
 * Kéo xong: ghi nhận thứ câu được. landed = false ⇒ sổng (mất mồi, không được gì).
 * Trả về { kind, text, fish, cm, q, shiny, isNew, record, coins, pearl, extra, spotComplete }
 */
export function land(save, c, landed, rng = Math.random) {
  const st = F(save);
  if (!landed) return { kind: 'miss' };
  if (c.kind === 'junk') return { kind: 'junk', junk: c.junk, coins: c.junk.coins };
  if (c.kind === 'chest') {
    const coins = Math.round(CHEST.coins[0] + rng() * (CHEST.coins[1] - CHEST.coins[0]));
    const out = { kind: 'chest', coins };
    if (rng() < CHEST.luckChance) out.luck = 1;
    if (rng() < CHEST.baitChance) { st.bait.petal = (st.bait.petal || 0) + 3; out.bait = { id: 'petal', n: 3 }; }
    return out;
  }
  if (c.kind === 'bottle') { st.bottles += 1; return { kind: 'bottle', n: st.bottles }; }
  if (c.kind === 'mong') { st.mong = 1; st.caught += 1; return { kind: 'mong', fish: MONG, cm: c.cm }; }
  const { fish, cm, q, shiny } = c;
  const key = fishKey(fish.id, q, shiny);
  st.bag[key] = (st.bag[key] || 0) + 1;
  st.caught += 1;
  const b = st.book[fish.id] || (st.book[fish.id] = { n: 0, max: 0, q: 0, shiny: 0 });
  const isNew = b.n === 0, record = cm > b.max;
  b.n += 1; b.max = Math.max(b.max, cm); b.q = Math.max(b.q, q); if (shiny) b.shiny = 1;
  const out = { kind: 'fish', fish, cm, q, shiny, isNew, record, key };
  if (fish.id === 'so' && rng() < FISH_RULES.pearlChance) out.pearl = PEARL;
  // sưu tầm đủ cá của chỗ câu này
  if (isNew && !st.spotDone.includes(fish.s) && fishOfSpot(fish.s).every((id) => st.book[id]?.n)) { st.spotDone.push(fish.s); out.spotComplete = { spot: fish.s, reward: SPOT_REWARD }; }
  return out;
}

// ---------------- quầy cá: mua đồ, đổi cá ----------------
export const priceOf = (key) => { const { id, q, shiny } = parseFishKey(key); const f = FISH[id]; return f ? Math.round(f.p * FISH_RULES.qMult[q] * (shiny ? FISH_RULES.shinyMult : 1)) : 0; };
const fail = (msg) => ({ ok: false, msg });
const take = (st, key, n) => { st.bag[key] -= n; if (st.bag[key] <= 0) delete st.bag[key]; };

export function buyBait(save, id, n = 1) {
  const b = BAITS[id], st = F(save);
  if (!b) return fail('Không có mồi này');
  const cost = b.price * n;
  if (save.player.coins < cost) return fail(`Không đủ tiền (cần ${cost} 💰)`);
  save.player.coins -= cost; save.stats.spent = (save.stats.spent || 0) + cost;
  st.bait[id] = (st.bait[id] || 0) + n;
  return { ok: true, msg: `Đã mua ${n} ${b.name} (−${cost} 💰)` };
}

export function buyRod(save, id) {
  const r = RODS[id], st = F(save);
  if (!r || r.need) return fail('Cần này không bán');
  if (st.rods.includes(id)) { st.rod = id; return { ok: true, msg: `Đang dùng ${r.name}` }; }
  if (save.player.coins < r.price) return fail(`Không đủ tiền (cần ${r.price} 💰)`);
  save.player.coins -= r.price; save.stats.spent = (save.stats.spent || 0) + r.price;
  st.rods.push(id); st.rod = id;
  return { ok: true, msg: `Đã mua ${r.name}!` };
}

export function grantRod(save, id) { const st = F(save); if (RODS[id] && !st.rods.includes(id)) st.rods.push(id); st.rod = id; }
export function useRod(save, id) { const st = F(save); if (!st.rods.includes(id)) return false; st.rod = id; return true; }

export function buyGear(save, kind) {
  const g = GEAR[kind], st = F(save);
  if (!g) return fail('Không có món này');
  const lv = st[kind] || 0;
  if (lv >= g.prices.length) return fail('Đã nâng cấp tối đa');
  const cost = g.prices[lv];
  if (save.player.coins < cost) return fail(`Không đủ tiền (cần ${cost} 💰)`);
  save.player.coins -= cost; save.stats.spent = (save.stats.spent || 0) + cost;
  st[kind] = lv + 1;
  return { ok: true, msg: `${g.name} lên bậc ${lv + 1}!` };
}

/** Bán n con (mặc định cả chồng) */
export function sellFish(save, key, n = Infinity) {
  const st = F(save), have = st.bag[key] || 0;
  if (!have) return fail('Không còn con nào');
  n = Math.min(n, have);
  const coins = priceOf(key) * n;
  take(st, key, n);
  save.player.coins += coins;
  return { ok: true, coins, n };
}

export function sellAll(save) {
  const st = F(save);
  let coins = 0, n = 0;
  for (const [k, c] of Object.entries(st.bag)) { coins += priceOf(k) * c; n += c; }
  st.bag = {};
  save.player.coins += coins;
  return { ok: n > 0, coins, n, msg: n ? '' : 'Giỏ cá trống' };
}

/** Đổi cá lấy hạt giống: cần seedCost con (cùng loài, tính gộp mọi số sao) ⇒ seedGive hạt của loài hoa gắn với loài cá đó */
export function seedDeal(id) { const f = FISH[id]; return f ? { vkey: f.seed, cost: FISH_RULES.seedCost[f.t], give: FISH_RULES.seedGive[f.t], name: variantName(parseVkey(f.seed).species, parseVkey(f.seed).variant) } : null; }
export const countOf = (save, id) => Object.entries(F(save).bag).reduce((a, [k, n]) => a + (parseFishKey(k).id === id ? n : 0), 0);

/** Lấy n con của 1 loài ra khỏi giỏ (con ít sao, không ánh kim trước) */
function takeSpecies(st, id, n) {
  const keys = Object.keys(st.bag).filter((k) => parseFishKey(k).id === id).sort((a, b) => priceOf(a) - priceOf(b));
  for (const k of keys) { const t = Math.min(n, st.bag[k]); take(st, k, t); n -= t; if (!n) break; }
}

export function tradeSeed(save, id) {
  const d = seedDeal(id), st = F(save);
  if (!d) return fail('Loài này không đổi hạt được');
  if (countOf(save, id) < d.cost) return fail(`Cần ${d.cost} con ${FISH[id].name}`);
  takeSpecies(st, id, d.cost);
  save.inventory.seeds[d.vkey] = (save.inventory.seeds[d.vkey] || 0) + d.give;
  return { ok: true, msg: `Đổi ${d.cost} ${FISH[id].name} lấy ${d.give} hạt ${d.name}` };
}

export function tradeFert(save, id, n = 1) {
  const f = FISH[id], st = F(save);
  if (!f) return fail('Không rõ loài cá');
  n = Math.min(n, countOf(save, id));
  if (!n) return fail('Không còn con nào');
  takeSpecies(st, id, n);
  const fert = FISH_RULES.fertPer[f.t] * n;
  save.inventory.items.fertilizer = (save.inventory.items.fertilizer || 0) + fert;
  return { ok: true, fert, msg: `Ủ ${n} ${f.name} được ${fert} 🧪 phân cá` };
}

// ---------------- thống kê ----------------
export const speciesCaught = (save) => FISH_IDS.filter((id) => F(save).book[id]?.n).length;
export const rareCaught = (save) => FISH_IDS.filter((id) => FISH[id].t >= 3 && F(save).book[id]?.n).length;
export const bagCount = (save) => Object.values(F(save).bag).reduce((a, n) => a + n, 0);
export const bagValue = (save) => Object.entries(F(save).bag).reduce((a, [k, n]) => a + priceOf(k) * n, 0);

/** Sổ cá theo chỗ câu: [{ spot, def, fish: [{ id, f, got: {n,max,q,shiny} | null }], done }] */
export function bookBySpot(save) {
  const st = F(save);
  return Object.entries(FISH_SPOTS).map(([spot, def]) => ({ spot, def, fish: fishOfSpot(spot).map((id) => ({ id, f: FISH[id], got: st.book[id]?.n ? st.book[id] : null })), done: st.spotDone.includes(spot) }));
}
