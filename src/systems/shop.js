// =============================================================
//  LOGIC CỬA HÀNG (thuần dữ liệu): khách, yêu cầu, chấm điểm, giá, uy tín
//  -> có thể chạy lại trên máy chủ để kiểm tra gian lận sau này
// =============================================================
import { FLOWERS } from '../../data/flowers.js';
import { SHOP, REP_TIERS, REQUEST_MIX, REQUEST_SIZE, QUALITY_DEMAND, TONES, OCCASIONS } from '../../data/shop.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { CUSTOMERS, REACTIONS } from '../../data/customers.js';

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

export const npcOf = (id) => CUSTOMERS.find((c) => c.id === id) || CUSTOMERS[0];

// ------------------- tạo khách -------------------
export function generateRequest(rng, tier, flowerIds) {
  const mix = REQUEST_MIX[Math.min(tier, REQUEST_MIX.length - 1)];
  const r = rng();
  const type = r < mix[0] ? 'single' : r < mix[0] + mix[1] ? 'multi' : 'bouquet';
  const qd = QUALITY_DEMAND[Math.min(tier, QUALITY_DEMAND.length - 1)];
  const q = rng();
  let minQuality = q < qd[1] ? 3 : q < qd[0] + qd[1] ? 2 : 1;
  if (type === 'single') return { type, flower: pick(rng, flowerIds), count: 1, minQuality };
  if (type === 'multi') return { type, flower: pick(rng, flowerIds), count: randInt(rng, REQUEST_SIZE.multi[tier]), minQuality };
  const [min, max] = REQUEST_SIZE.bouquet[tier];
  const occ = Math.floor(rng() * OCCASIONS.length);
  const tone = rng() < 0.75 ? OCCASIONS[occ].tone : pick(rng, Object.keys(TONES));
  const mustInclude = rng() < 0.5 ? { flower: pick(rng, flowerIds), n: Math.min(2, min) } : null;
  if (minQuality === 3 && rng() < 0.5) minQuality = 2;
  return { type, min, max, occasion: occ, tone, mustInclude, minQuality };
}

export function spawnCustomer(save, rng, flowerIds) {
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
    request: generateRequest(rng, tier, flowerIds),
    arrivedAt: save.time.gameMinutes,
    patience: Math.round(randRange(rng, SHOP.patience) * (1 + tier * SHOP.patienceBonusPerTier)),
  };
  sh.customers.push(c);
  return c;
}

/** Cho thời gian trôi ở cửa hàng. Trả về danh sách sự kiện [{type:'arrive'|'timeout', customer}] */
export function shopTick(save, { offline = false, rng = Math.random, hourFloat, flowerIds }) {
  const sh = save.shop;
  const now = save.time.gameMinutes;
  const events = [];
  for (const c of [...sh.customers]) {
    if (now - c.arrivedAt > c.patience) {
      sh.customers.splice(sh.customers.indexOf(c), 1);
      if (!offline) save.player.reputation = Math.max(0, save.player.reputation + SHOP.rep.timeout);
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
  if (now >= sh.nextSpawnAt && sh.customers.length < SHOP.maxQueue) {
    events.push({ type: 'arrive', customer: spawnCustomer(save, rng, flowerIds) });
    sh.nextSpawnAt = now + randRange(rng, SHOP.spawnEvery) * (1 - SHOP.spawnFasterPerTier) ** tier;
  } else if (now >= sh.nextSpawnAt) {
    sh.nextSpawnAt = now + 10; // hàng đã đầy, thử lại sau
  }
  return events;
}

// ------------------- lời nói -------------------
export function requestText(req, npcId) {
  const self = npcOf(npcId).self;
  const qText = req.minQuality > 1 ? ` loại ${req.minQuality}★ trở lên` : '';
  if (req.type === 'single') return `Cho ${self} 1 cành ${FLOWERS[req.flower].name.toLowerCase()}${qText} nhé!`;
  if (req.type === 'multi') return `${cap(self)} cần ${req.count} cành ${FLOWERS[req.flower].name.toLowerCase()}${qText}.`;
  const occ = OCCASIONS[req.occasion];
  let t = `Gói giúp ${self} một bó ${req.min}–${req.max} cành ${occ.text}, ${TONES[req.tone].name}`;
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
    const [flower, q] = k.split('|');
    return { flower, q: +q, n };
  });
  const total = items.reduce((a, b) => a + b.n, 0);
  const checks = [];
  const add = (ok, text) => checks.push({ ok, text });
  const qOk = items.every((it) => it.q >= req.minQuality);

  if (req.type !== 'bouquet') {
    const name = FLOWERS[req.flower].name;
    add(total === req.count, `Đúng ${req.count} cành (đang chọn ${total})`);
    add(total > 0 && items.every((it) => it.flower === req.flower), `Chỉ dùng ${name}`);
  } else {
    add(total >= req.min && total <= req.max, `Từ ${req.min} đến ${req.max} cành (đang chọn ${total})`);
    if (req.mustInclude) {
      const have = items.filter((it) => it.flower === req.mustInclude.flower).reduce((a, b) => a + b.n, 0);
      add(have >= req.mustInclude.n, `Có ít nhất ${req.mustInclude.n} cành ${FLOWERS[req.mustInclude.flower].name} (đang có ${have})`);
    }
    add(!!PAPERS[sel.paper], 'Chọn giấy gói');
    add(!!RIBBONS[sel.ribbon], 'Chọn ruy băng');
  }
  if (req.minQuality > 1) add(total > 0 && qOk, `Hoa từ ${req.minQuality}★ trở lên`);
  const ok = checks.every((c) => c.ok);

  const qAvg = total ? items.reduce((a, it) => a + it.q * it.n, 0) / total : 1;
  let score;
  const parts = {};
  if (req.type !== 'bouquet') {
    score = 40 + 60 * ((qAvg - 1) / 2);
    parts.quality = Math.round(score);
  } else {
    parts.quality = 35 * ((qAvg - 1) / 2);
    const paper = PAPERS[sel.paper], ribbon = RIBBONS[sel.ribbon];
    parts.paper = paper?.tones.includes(req.tone) ? 20 : 0;
    parts.ribbon = ribbon?.tones.includes(req.tone) ? 10 : 0;
    const toneFlowers = items.filter((it) => FLOWERS[it.flower].tones?.includes(req.tone)).reduce((a, b) => a + b.n, 0);
    parts.flowerTone = total ? 20 * (toneFlowers / total) : 0;
    const species = new Set(items.map((it) => it.flower));
    const maxShare = total ? Math.max(...[...species].map((f) => items.filter((it) => it.flower === f).reduce((a, b) => a + b.n, 0))) / total : 1;
    parts.balance = species.size >= 2 && maxShare <= 0.7 ? 15 : species.size >= 2 ? 10 : 7;
    score = parts.quality + parts.paper + parts.ribbon + parts.flowerTone + parts.balance;
  }
  score = Math.round(Math.max(0, Math.min(100, score)));

  let base = items.reduce((a, it) => a + FLOWERS[it.flower].basePrice * SHOP.qualityMult[it.q] * it.n, 0);
  if (req.type === 'bouquet') base = base * SHOP.bouquetMult + (PAPERS[sel.paper]?.price || 0) + (RIBBONS[sel.ribbon]?.price || 0);
  const price = Math.round(base * (0.8 + 0.4 * (score / 100)));

  const S = SHOP.satisfaction;
  const mood = score >= S.perfect ? 'perfect' : score >= S.good ? 'good' : score >= S.ok ? 'ok' : 'bad';
  return { ok, checks, score, parts, price, mood, repDelta: SHOP.rep[mood], qAvg };
}

export function tipAmount(rng, tier, ev) {
  const chance = SHOP.tip.baseChance + tier * SHOP.tip.chancePerTier + (ev.mood === 'perfect' ? SHOP.tip.happyBonus : 0);
  if (ev.mood === 'bad' || rng() >= chance) return 0;
  return Math.max(1, Math.round(ev.price * randRange(rng, SHOP.tip.pct)));
}

/** Ước tính tiền nhận được (để hiển thị trên thẻ khách) */
export function estimateReward(req) {
  if (req.type !== 'bouquet') return Math.round(FLOWERS[req.flower].basePrice * SHOP.qualityMult[req.minQuality] * req.count);
  const avg = Object.values(FLOWERS).reduce((a, f) => a + f.basePrice, 0) / Object.keys(FLOWERS).length;
  return Math.round(avg * req.min * SHOP.bouquetMult * SHOP.qualityMult[req.minQuality]);
}

/** Giá bán sỉ 1 cành */
export function wholesalePrice(flower, q) {
  return Math.max(1, Math.round(FLOWERS[flower].basePrice * SHOP.qualityMult[q] * SHOP.wholesaleMult));
}

/** Tự chọn hoa tốt nhất đáp ứng yêu cầu (nút "Tự chọn") */
export function autoPick(req, inventory) {
  const stacks = Object.entries(inventory.flowers).filter(([, n]) => n > 0).map(([k, n]) => {
    const [flower, q] = k.split('|');
    return { key: k, flower, q: +q, n };
  }).filter((s) => s.q >= req.minQuality).sort((a, b) => b.q - a.q);
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
    take((s) => s.flower === req.flower, req.count);
    return { items };
  }
  let got = 0;
  if (req.mustInclude) got += take((s) => s.flower === req.mustInclude.flower, req.mustInclude.n);
  // ưu tiên hoa hợp tông, rồi đến hoa khác loài để cân đối
  got += take((s) => FLOWERS[s.flower].tones?.includes(req.tone) && !(items[s.key] >= s.n), Math.max(0, Math.ceil((req.min + req.max) / 2) - got));
  if (got < req.min) got += take(() => true, req.min - got);
  const paper = Object.keys(PAPERS).find((p) => PAPERS[p].tones.includes(req.tone) && (PAPERS[p].free || inventory.papers?.[p] > 0)) || 'kraft';
  const ribbon = Object.keys(RIBBONS).find((r) => RIBBONS[r].tones.includes(req.tone) && (RIBBONS[r].free || inventory.ribbons?.[r] > 0)) || 'twine';
  return { items, paper, ribbon };
}
