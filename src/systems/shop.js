// =============================================================
//  LOGIC CỬA HÀNG (thuần dữ liệu): khách, yêu cầu, chấm điểm, giá, uy tín
//  -> có thể chạy lại trên máy chủ để kiểm tra gian lận sau này
// =============================================================
import { FLOWERS } from '../../data/flowers.js';
import { SHOP, REP_TIERS, REQUEST_MIX, REQUEST_SIZE, QUALITY_DEMAND, TONES, OCCASIONS, MEANING_DEMAND, COLOR_DEMAND } from '../../data/shop.js';
import { MEANINGS } from '../../data/variants.js';
import { REGULARS } from '../../data/regulars.js';
import { parseFlowerKey, variantName, rarityOf, tonesOf, DEFAULT_VARIANT } from './variants.js';
import { scoreBouquet } from './bouquet.js';
import { eligibleRegulars, regularRequest } from './regulars.js';
import { REGULAR_RULES } from '../../data/regulars.js';
import { VARIANTS } from '../../data/variants.js';

const VARIANTS_MEANINGS = Object.fromEntries(Object.entries(VARIANTS).flatMap(([sp, vs]) => Object.entries(vs).map(([v, d]) => [`${sp}:${v}`, d.meanings])));
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { CUSTOMERS, REACTIONS } from '../../data/customers.js';
import { upgradeValue } from './progression.js';
import { SHOP_TIERS, VIP } from '../../data/shopTiers.js';

/** Quy mô tiệm hiện tại (GĐ18) */
export const shopTierOf = (save) => SHOP_TIERS[Math.min(save.shopLevel || 0, SHOP_TIERS.length - 1)];

export const SHOP_REP = SHOP.rep;

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const randInt = (rng, [a, b]) => a + Math.floor(rng() * (b - a + 1));
const randRange = (rng, [a, b]) => a + rng() * (b - a);

export function createShopState() {
  return { open: true, customers: [], nextSpawnAt: null, nextId: 1 };
}

export function tierOf(rep) {
  let t = 0;
  REP_TIERS.forEach((r, i) => { if (rep >= r.min) t = i; });
  return t;
}

export function tierInfo(rep) {
  const t = tierOf(rep);
  const next = REP_TIERS[t + 1];
  return { index: t, ...REP_TIERS[t], next, progress: next ? (rep - REP_TIERS[t].min) / (next.min - REP_TIERS[t].min) : 1 };
}

export function isOpenHour(hourFloat) {
  return hourFloat >= SHOP.openHour && hourFloat < SHOP.closeHour;
}

export const npcOf = (id) => (REGULARS[id] ? { id, ...REGULARS[id] } : CUSTOMERS.find((c) => c.id === id) || CUSTOMERS[0]);

// ------------------- tạo khách -------------------
/**
 * ctx.festival : lễ hội hôm nay (data/seasons.js) — khách thích loài hoa & tông riêng, trả giá cao hơn
 * ctx.seasonal : các loài đúng mùa — khách hỏi nhiều hơn
 */
export function generateRequest(rng, tier, flowerIds, ctx = {}) {
  const mix = [...REQUEST_MIX[Math.min(tier, REQUEST_MIX.length - 1)]];
  const fest = ctx.festival;
  if (fest) { const b = Math.min(mix[0], fest.bouquetBoost); mix[0] -= b; mix[2] += b; }
  const r = rng();
  const type = r < mix[0] ? 'single' : r < mix[0] + mix[1] ? 'multi' : 'bouquet';
  const festFlowers = fest ? fest.flowers.filter((f) => flowerIds.includes(f)) : [];
  const seasonal = (ctx.seasonal || []).filter((f) => flowerIds.includes(f));
  const pickFlower = () => {
    if (festFlowers.length && rng() < 0.65) return pick(rng, festFlowers);
    if (seasonal.length && rng() < 0.5) return pick(rng, seasonal);
    return pick(rng, flowerIds);
  };
  const extra = fest ? { festival: fest.id, priceMult: fest.priceMult } : {};
  const req = makeRequest(rng, tier, type, pickFlower, fest);
  if (type === 'bouquet') {
    const occ = OCCASIONS[req.occasion];
    if (fest?.meaning && rng() < 0.8) req.meaning = fest.meaning;
    else if (rng() < MEANING_DEMAND[Math.min(tier, MEANING_DEMAND.length - 1)]) req.meaning = occ.meaning;
  } else {
    // đặt đúng màu (chỉ những màu người chơi đã từng trồng ra)
    const colors = (ctx.found || []).filter((k) => k.startsWith(req.flower + ':') && !k.endsWith(':' + DEFAULT_VARIANT[req.flower]));
    if (colors.length && rng() < COLOR_DEMAND) req.variant = pick(rng, colors).split(':')[1];
  }
  return Object.assign(req, extra);
}

function makeRequest(rng, tier, type, pickFlower, fest) {
  const qd = QUALITY_DEMAND[Math.min(tier, QUALITY_DEMAND.length - 1)];
  const q = rng();
  let minQuality = q < qd[1] ? 3 : q < qd[0] + qd[1] ? 2 : 1;
  if (type === 'single') return { type, flower: pickFlower(), count: 1, minQuality };
  if (type === 'multi') return { type, flower: pickFlower(), count: randInt(rng, REQUEST_SIZE.multi[tier]), minQuality };
  const [min, max] = REQUEST_SIZE.bouquet[tier];
  const occ = Math.floor(rng() * OCCASIONS.length);
  let tone = rng() < 0.75 ? OCCASIONS[occ].tone : pick(rng, Object.keys(TONES));
  if (fest && rng() < 0.8) tone = fest.tone;
  const mustInclude = rng() < (fest ? 0.75 : 0.5) ? { flower: pickFlower(), n: Math.min(2, min) } : null;
  if (minQuality === 3 && rng() < 0.5) minQuality = 2;
  const req = { type, min, max, occasion: occ, tone, mustInclude, minQuality };
  if (fest) req.occasionText = fest.occasion;
  return req;
}

export function spawnCustomer(save, rng, flowerIds, ctx = {}) {
  const sh = save.shop;
  const tier = tierOf(save.player.reputation);
  const busy = new Set(sh.customers.map((c) => c.npc));
  const pool = CUSTOMERS.filter((c) => !busy.has(c.id));
  const npc = pick(rng, pool.length ? pool : CUSTOMERS);
  const used = new Set(sh.customers.map((c) => c.spot));
  let spot = 0;
  while (used.has(spot)) spot++;
  const c = {
    id: sh.nextId++,
    npc: npc.id,
    spot,
    request: generateRequest(rng, tier, flowerIds, ctx),
    arrivedAt: save.time.gameMinutes,
    patience: Math.round(randRange(rng, SHOP.patience) * (1 + tier * SHOP.patienceBonusPerTier) * (save.upgrades ? upgradeValue(save, 'sign') : 1)),
  };
  // GĐ18: quy mô tiệm làm khách trả cao hơn; khách 👑 VIP trả rất đắt nhưng đòi hoa đẹp
  const st = shopTierOf(save);
  c.request.priceMult = (c.request.priceMult || 1) * st.priceMult;
  if (st.vipChance && rng() < st.vipChance) {
    c.vip = true;
    c.request.priceMult *= VIP.priceMult;
    c.request.minQuality = Math.max(c.request.minQuality || 1, VIP.minQuality);
    c.patience = Math.round(c.patience * VIP.patienceMult);
  }
  sh.customers.push(c);
  return c;
}

/** Khách quen ghé tiệm với chương truyện hiện tại */
export function spawnRegular(save, id) {
  const sh = save.shop;
  const used = new Set(sh.customers.map((c) => c.spot));
  let spot = 0;
  while (used.has(spot)) spot++;
  const c = {
    id: sh.nextId++, npc: id, regular: id, chapter: save.regulars[id].hearts, spot,
    request: regularRequest(id, save), arrivedAt: save.time.gameMinutes,
    patience: Math.round(SHOP.patience[1] * REGULAR_RULES.patienceMult * (save.upgrades ? upgradeValue(save, 'sign') : 1)),
  };
  sh.customers.push(c);
  return c;
}

/** Cho thời gian trôi ở cửa hàng. Trả về danh sách sự kiện [{type:'arrive'|'timeout', customer}] */
export function shopTick(save, { offline = false, rng = Math.random, hourFloat, flowerIds, festival = null, seasonal = [], day = 1, spawnMult = 1 }) {
  const sh = save.shop;
  const now = save.time.gameMinutes;
  const events = [];
  for (const c of [...sh.customers]) {
    if (now - c.arrivedAt > c.patience) {
      sh.customers.splice(sh.customers.indexOf(c), 1);
      if (!offline && !c.regular) save.player.reputation = Math.max(0, save.player.reputation + SHOP.rep.timeout);
      events.push({ type: 'timeout', customer: c, silent: offline });
    }
  }
  const ready = save.stats.harvested > 0 && sh.open && isOpenHour(hourFloat);
  if (!ready) return events;
  const tier = tierOf(save.player.reputation);
  if (sh.nextSpawnAt == null) sh.nextSpawnAt = now + SHOP.firstCustomerDelay;
  if (offline) {
    // không cho khách dồn đến khi người chơi vắng mặt
    if (now >= sh.nextSpawnAt) sh.nextSpawnAt = now + 5;
    return events;
  }
  const maxQueue = (save.upgrades ? upgradeValue(save, 'counter') : SHOP.maxQueue) + shopTierOf(save).queue;
  if (now >= sh.nextSpawnAt && sh.customers.length < maxQueue) {
    const regs = save.regulars ? eligibleRegulars(save, day) : [];
    const customer = regs.length && rng() < REGULAR_RULES.chanceInsteadOfNormal
      ? spawnRegular(save, pick(rng, regs))
      : spawnCustomer(save, rng, flowerIds, { festival, seasonal, found: Object.keys(save.book?.found || {}) });
    events.push({ type: 'arrive', customer });
    sh.nextSpawnAt = now + randRange(rng, SHOP.spawnEvery) * (1 - SHOP.spawnFasterPerTier) ** tier * (festival ? festival.spawnMult : 1) * spawnMult * shopTierOf(save).spawnMult;
  } else if (now >= sh.nextSpawnAt) {
    sh.nextSpawnAt = now + 10; // hàng đã đầy, thử lại sau
  }
  return events;
}

// ------------------- lời nói -------------------
export function requestText(req, npcId) {
  const self = npcOf(npcId).self;
  const qText = req.minQuality > 1 ? ` loại ${req.minQuality}★ trở lên` : '';
  const fname = req.flower ? (req.variant ? variantName(req.flower, req.variant) : FLOWERS[req.flower].name).toLowerCase() : '';
  if (req.type === 'single') return `Cho ${self} 1 cành ${fname}${qText} nhé!`;
  if (req.type === 'multi') return `${cap(self)} cần ${req.count} cành ${fname}${qText}.`;
  const occText = req.occasionText || OCCASIONS[req.occasion].text;
  let t = `Gói giúp ${self} một bó ${req.min}–${req.max} cành ${occText}, ${TONES[req.tone].name}`;
  if (req.meaning) t += `, ý nghĩa ${MEANINGS[req.meaning].name.toLowerCase()}`;
  if (req.mustInclude) t += `, có ít nhất ${req.mustInclude.n} cành ${FLOWERS[req.mustInclude.flower].name.toLowerCase()}`;
  return t + (req.minQuality > 1 ? `, hoa${qText}.` : '.');
}

export function reactionText(mood, npcId, rng = Math.random) {
  return pick(rng, REACTIONS[mood]).replace(/\{self\}/g, npcOf(npcId).self);
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ------------------- chấm điểm & tính tiền -------------------
/**
 * sel = { items: { "rose|3": 2, ... }, paper, ribbon }
 * Trả về { ok, checks:[{ok,text}], score, price, mood, repDelta }
 */
export function evaluateDelivery(req, sel) {
  const items = Object.entries(sel.items || {}).filter(([, n]) => n > 0).map(([k, n]) => {
    const f = parseFlowerKey(k);
    return { species: f.species, variant: f.variant, flower: f.species, q: f.q, n };
  });
  const total = items.reduce((a, b) => a + b.n, 0);
  const checks = [];
  const add = (ok, text) => checks.push({ ok, text });
  const qOk = items.every((it) => it.q >= (req.minQuality || 1));

  if (req.type !== 'bouquet') {
    const name = req.variant ? variantName(req.flower, req.variant) : FLOWERS[req.flower].name;
    add(total === req.count, `Đúng ${req.count} cành (đang chọn ${total})`);
    add(total > 0 && items.every((it) => it.species === req.flower && (!req.variant || it.variant === req.variant)), `Chỉ dùng ${name}`);
  } else {
    add(total >= req.min && total <= req.max, `Từ ${req.min} đến ${req.max} cành (đang chọn ${total})`);
    if (req.mustInclude) {
      const have = items.filter((it) => it.species === req.mustInclude.flower).reduce((a, b) => a + b.n, 0);
      add(have >= req.mustInclude.n, `Có ít nhất ${req.mustInclude.n} cành ${FLOWERS[req.mustInclude.flower].name} (đang có ${have})`);
    }
    add(!!PAPERS[sel.paper], 'Chọn giấy gói');
    add(!!RIBBONS[sel.ribbon], 'Chọn ruy băng');
  }
  if (req.minQuality > 1) add(total > 0 && qOk, `Hoa từ ${req.minQuality}★ trở lên`);
  const ok = checks.every((c) => c.ok);

  const qAvg = total ? items.reduce((a, it) => a + it.q * it.n, 0) / total : 1;
  let score, parts = {}, tips = [];
  if (req.type !== 'bouquet') {
    score = 40 + 60 * ((qAvg - 1) / 2);
    parts.quality = Math.round(score);
  } else {
    const r = scoreBouquet(req, items, sel.paper, sel.ribbon);
    score = r.score; parts = r.parts; tips = r.tips;
  }
  score = Math.round(Math.max(0, Math.min(100, score)));

  let base = items.reduce((a, it) => a + FLOWERS[it.species].basePrice * SHOP.qualityMult[it.q] * rarityOf(it.species, it.variant).priceMult * it.n, 0);
  if (req.type === 'bouquet') base = base * SHOP.bouquetMult + (PAPERS[sel.paper]?.price || 0) + (RIBBONS[sel.ribbon]?.price || 0);
  const price = Math.round(base * (0.8 + 0.4 * (score / 100)) * (req.priceMult || 1));

  const S = SHOP.satisfaction;
  const mood = score >= S.perfect ? 'perfect' : score >= S.good ? 'good' : score >= S.ok ? 'ok' : 'bad';
  return { ok, checks, score, parts, tips, price, mood, repDelta: SHOP.rep[mood], qAvg, items };
}

export function tipAmount(rng, tier, ev) {
  const chance = SHOP.tip.baseChance + tier * SHOP.tip.chancePerTier + (ev.mood === 'perfect' ? SHOP.tip.happyBonus : 0);
  if (ev.mood === 'bad' || rng() >= chance) return 0;
  return Math.max(1, Math.round(ev.price * randRange(rng, SHOP.tip.pct)));
}

/** Ước tính tiền nhận được (để hiển thị trên thẻ khách) */
export function estimateReward(req) {
  const m = req.priceMult || 1;
  if (req.type !== 'bouquet') return Math.round(FLOWERS[req.flower].basePrice * SHOP.qualityMult[req.minQuality] * req.count * m);
  const normal = Object.values(FLOWERS).filter((f) => !f.luck);
  const avg = normal.reduce((a, f) => a + f.basePrice, 0) / normal.length;
  return Math.round(avg * req.min * SHOP.bouquetMult * SHOP.qualityMult[req.minQuality] * m);
}

/** Giá bán sỉ 1 cành (key = mã hoa trong kho, vd "rose:red|3") */
export function wholesalePrice(key) {
  const f = parseFlowerKey(key);
  return Math.max(1, Math.round(FLOWERS[f.species].basePrice * SHOP.qualityMult[f.q] * rarityOf(f.species, f.variant).priceMult * SHOP.wholesaleMult));
}

/** Tự chọn hoa tốt nhất đáp ứng yêu cầu (nút "Tự chọn") */
const meaningsOfKey = (f, known) => (known && known[f.vkey] ? (VARIANTS_MEANINGS[f.vkey] || []) : []);

/** known: { "rose:red": true } — ý nghĩa đã khám phá (nút Tự chọn chỉ dùng hiểu biết của người chơi) */
export function autoPick(req, inventory, known = null) {
  const stacks = Object.entries(inventory.flowers).filter(([, n]) => n > 0).map(([k, n]) => {
    const f = parseFlowerKey(k);
    return { key: k, flower: f.species, variant: f.variant, q: f.q, n, meanings: meaningsOfKey(f, known) };
  }).filter((s) => s.q >= (req.minQuality || 1)).sort((a, b) => b.q - a.q);
  const items = {};
  const take = (filter, count) => {
    let need = count;
    for (const s of stacks) {
      if (need <= 0) break;
      if (!filter(s)) continue;
      const free = s.n - (items[s.key] || 0);
      const t = Math.min(free, need);
      if (t > 0) { items[s.key] = (items[s.key] || 0) + t; need -= t; }
    }
    return count - need;
  };
  if (req.type !== 'bouquet') {
    take((s) => s.flower === req.flower && (!req.variant || s.variant === req.variant), req.count);
    return { items };
  }
  let got = 0;
  // số lẻ ở giữa khoảng yêu cầu
  let target = Math.ceil((req.min + req.max) / 2);
  if (target % 2 === 0) target = target + 1 <= req.max ? target + 1 : target - 1 >= req.min ? target - 1 : target;
  if (req.mustInclude) got += take((s) => s.flower === req.mustInclude.flower, req.mustInclude.n);
  // ưu tiên hoa mang ý nghĩa khách cần (chỉ những ý nghĩa bạn đã biết), rồi hoa hợp tông
  if (req.meaning) got += take((s) => s.meanings.includes(req.meaning), Math.max(0, Math.ceil(target * 0.6) - got));
  got += take((s) => tonesOf(s.flower, s.variant).includes(req.tone) && !s.meanings.some((m) => MEANINGS[m]?.negative), Math.max(0, target - got));
  if (got < req.min) got += take(() => true, req.min - got);
  const paper = Object.keys(PAPERS).find((p) => PAPERS[p].tones.includes(req.tone) && (PAPERS[p].free || inventory.papers?.[p] > 0)) || 'kraft';
  const ribbon = Object.keys(RIBBONS).find((r) => RIBBONS[r].tones.includes(req.tone) && (RIBBONS[r].free || inventory.ribbons?.[r] > 0)) || 'twine';
  return { items, paper, ribbon };
}
