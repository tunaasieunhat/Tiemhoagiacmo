// =============================================================
//  LOGIC CỬA HÀNG (thuần dữ liệu): khách, yêu cầu, chấm điểm, giá, uy tín
//  -> có thể chạy lại trên máy chủ để kiểm tra gian lận sau này
// =============================================================
import { FLOWERS } from '../../data/flowers.js';
import { SHOP, DISPLAY, REP_TIERS, REQUEST_MIX, REQUEST_SIZE, QUALITY_DEMAND, TONES, OCCASIONS, MEANING_DEMAND, COLOR_DEMAND, SMART } from '../../data/shop.js';
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
  return { open: true, customers: [], nextSpawnAt: null, nextId: 1, display: [] };
}

// ------------------- 🪴 treo hoa (0.20) -------------------
/** Số móc treo hoa của tiệm (tăng theo quy mô tiệm) */
export const displaySlots = (save) => DISPLAY.baseSlots + DISPLAY.perShopLevel * (save.shopLevel || 0);

/** Các loài đang treo (chỉ tính loài còn hợp lệ trong danh sách cho phép).
 *  (0.26.1) Chưa tự treo loài nào ⇒ tiệm TỰ TREO các loài nhiều hàng nhất trong kho, rồi tới loài đang trồng */
export function displayedFlowers(save, flowerIds) {
  const d = save.shop?.display || [];
  if (d.length || !isAutoDisplay(save)) return d.filter((id) => flowerIds.includes(id)).slice(0, displaySlots(save));
  return autoDisplayList(save, flowerIds);
}
export const isAutoDisplay = (save) => SMART.autoDisplay && !(save.shop?.display || []).length && save.shop?.autoDisp !== false;
export function autoDisplayList(save, flowerIds) {
  const { stock, growing } = stockInfo(save);
  const list = Object.keys(stock).filter((id) => flowerIds.includes(id)).sort((a, b) => stock[b].n - stock[a].n);
  for (const id of growing) if (flowerIds.includes(id) && !list.includes(id)) list.push(id);
  return list.slice(0, displaySlots(save));
}

/** Kho & ruộng đang có gì: { stock: { loài: { n, bestQ, variants: [màu] } }, growing: [loài đang trồng / chờ thu] } */
export function stockInfo(save) {
  const stock = {};
  for (const [k, n] of Object.entries(save.inventory?.flowers || {})) {
    if (!(n > 0)) continue;
    const f = parseFlowerKey(k);
    if (!FLOWERS[f.species] || FLOWERS[f.species].luck) continue;
    const st = stock[f.species] || (stock[f.species] = { n: 0, bestQ: 0, variants: [] });
    st.n += n; st.bestQ = Math.max(st.bestQ, f.q);
    if (!st.variants.includes(f.variant)) st.variants.push(f.variant);
  }
  const growing = [];
  for (const p of save.farm?.plots || []) for (const t of p.tiles) if (t.flower && (t.state === 'growing' || t.state === 'ready') && !growing.includes(t.flower)) growing.push(t.flower);
  return { stock, growing };
}

/** Treo / gỡ 1 loài. Trả về { ok, on, msg } */
export function toggleDisplay(save, id, flowerIds) {
  const sh = save.shop;
  sh.display = (sh.display || []).filter((x) => flowerIds.includes(x));
  if (sh.display.includes(id)) { sh.display = sh.display.filter((x) => x !== id); return { ok: true, on: false }; }
  if (!flowerIds.includes(id)) return { ok: false, msg: 'Loài này chưa mở' };
  if (sh.display.length >= displaySlots(save)) return { ok: false, msg: `Tiệm chỉ có ${displaySlots(save)} móc treo — gỡ bớt 1 loài hoặc nâng quy mô tiệm` };
  sh.display.push(id);
  return { ok: true, on: true };
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
  // (0.26.1) A: khách ưu tiên loài bạn đang có trong kho, rồi tới loài đang trồng
  const stock = ctx.stock || {};
  const inStock = Object.keys(stock).filter((f) => flowerIds.includes(f));
  const grow = (ctx.growing || []).filter((f) => flowerIds.includes(f));
  const pickFlower = () => {
    if (inStock.length && rng() < SMART.stockBias) return pick(rng, inStock);
    if (grow.length && rng() < SMART.growingBias) return pick(rng, grow);
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
    let colors = (ctx.found || []).filter((k) => k.startsWith(req.flower + ':') && !k.endsWith(':' + DEFAULT_VARIANT[req.flower]));
    const st = stock[req.flower];
    // loài đang có: thường chỉ đòi màu bạn đang có
    if (st && rng() < SMART.capToStock) colors = colors.filter((k) => st.variants.includes(k.split(':')[1]));
    if (colors.length && rng() < COLOR_DEMAND) req.variant = pick(rng, colors).split(':')[1];
    // loài đang có: thường không đòi nhiều sao / nhiều cành hơn thứ trong kho
    if (st && rng() < SMART.capToStock) {
      req.minQuality = Math.max(1, Math.min(req.minQuality || 1, st.bestQ));
      if (req.type === 'multi' && st.n >= 2) req.count = Math.max(2, Math.min(req.count, st.n));
    }
  }
  if (req.type === 'bouquet' && inStock.length && rng() < SMART.capToStock) {
    const best = Math.max(...inStock.map((f) => stock[f].bestQ));
    req.minQuality = Math.max(1, Math.min(req.minQuality || 1, best));
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

/** Yêu cầu còn hợp với danh sách loài đang bán không */
const reqFits = (req, flowerIds) => (req.type === 'bouquet' ? !req.mustInclude || flowerIds.includes(req.mustInclude.flower) : flowerIds.includes(req.flower));

/** (0.26.1) D: giữ sẵn danh sách khách sắp tới để báo trước cho người chơi chuẩn bị. Trả về danh sách */
export function ensureUpcoming(save, rng, flowerIds, ctx = {}) {
  const sh = save.shop;
  const tier = tierOf(save.player.reputation);
  sh.upcoming = (sh.upcoming || []).filter((u) => u && u.request && reqFits(u.request, flowerIds));
  const full = { ...stockInfo(save), ...ctx };
  while (sh.upcoming.length < SMART.upcoming) sh.upcoming.push({ npc: pick(rng, CUSTOMERS).id, request: generateRequest(rng, tier, flowerIds, full) });
  return sh.upcoming;
}

export function spawnCustomer(save, rng, flowerIds, ctx = {}) {
  const sh = save.shop;
  const tier = tierOf(save.player.reputation);
  const busy = new Set(sh.customers.map((c) => c.npc));
  const pool = CUSTOMERS.filter((c) => !busy.has(c.id));
  const used = new Set(sh.customers.map((c) => c.spot));
  let spot = 0;
  while (used.has(spot)) spot++;
  // lấy khách đã báo trước (nếu còn hợp với loài đang bán), rồi bổ sung danh sách
  ensureUpcoming(save, rng, flowerIds, ctx);
  const next = sh.upcoming.shift();
  ensureUpcoming(save, rng, flowerIds, ctx);
  const npc = !busy.has(next.npc) ? npcOf(next.npc) : pick(rng, pool.length ? pool : CUSTOMERS);
  const c = {
    id: sh.nextId++,
    npc: npc.id,
    spot,
    request: { ...next.request },
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

/** Cho thời gian trôi ở cửa hàng. Trả về danh sách sự kiện [{type:'arrive'|'timeout', customer} | {type:'preorder', order}]
 *  preorder(npcId, flowerId): hàm tạo đơn đặt trước (do game truyền vào, dùng orders.makePreorder) — không có thì bỏ qua */
export function shopTick(save, { offline = false, rng = Math.random, hourFloat, flowerIds, festival = null, seasonal = [], day = 1, spawnMult = 1, preorder = null }) {
  const sh = save.shop;
  const now = save.time.gameMinutes;
  const events = [];
  for (const c of [...sh.customers]) {
    if (now - c.arrivedAt > c.patience) {
      sh.customers.splice(sh.customers.indexOf(c), 1);
      // (0.26.1) D: kho không có gì đưa được ⇒ khách hẹn mai quay lại (đơn đặt trước), không mất uy tín
      const nothing = SMART.comeBack && !c.regular && canServe(c.request, save.inventory) === 'no';
      const back = nothing && c.request.type !== 'bouquet' && preorder ? preorder(c.npc, c.request.flower) : null;
      if (!offline && !c.regular && !nothing) save.player.reputation = Math.max(0, save.player.reputation + SHOP.rep.timeout);
      events.push({ type: 'timeout', customer: c, silent: offline, comeBack: back, excused: nothing });
    }
  }
  const ready = save.stats.harvested > 0 && sh.open && isOpenHour(hourFloat);
  if (!ready) return events;
  if (!offline) ensureUpcoming(save, rng, displayedFlowers(save, flowerIds).length ? displayedFlowers(save, flowerIds) : flowerIds, { festival, seasonal, found: Object.keys(save.book?.found || {}) });
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
    // 🪴 treo hoa: khách chỉ hỏi loài đang treo; ai muốn loài khác thì để lại đơn đặt trước
    const shown = displayedFlowers(save, flowerIds);
    const others = shown.length ? flowerIds.filter((id) => !shown.includes(id)) : [];
    const isReg = regs.length && rng() < REGULAR_RULES.chanceInsteadOfNormal;
    if (!isReg && others.length && preorder && rng() < DISPLAY.preorderChance) {
      const busy = new Set(sh.customers.map((c) => c.npc));
      const pool = CUSTOMERS.filter((c) => !busy.has(c.id));
      const order = preorder(pick(rng, pool.length ? pool : CUSTOMERS).id, pick(rng, others));
      // đã đủ số đơn đặt trước thì order = null ⇒ đi tiếp xuống dưới, khách vào tiệm như thường
      if (order) {
        events.push({ type: 'preorder', order });
        sh.nextSpawnAt = now + randRange(rng, SHOP.spawnEvery) * 0.5;
        return events;
      }
    }
    const customer = isReg
      ? spawnRegular(save, pick(rng, regs))
      : spawnCustomer(save, rng, shown.length ? shown : flowerIds, { festival, seasonal, found: Object.keys(save.book?.found || {}), ...stockInfo(save) });
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
  // (0.26.1) C: chưa đúng yêu cầu nhưng đưa được HOA THAY THẾ (khách vẫn mua, giá thấp hơn)
  const subOk = !ok && subAcceptable(req, items, total, sel);
  const sub = !ok && subOk && !!sel.sub;

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
  let price = Math.round(base * (0.8 + 0.4 * (score / 100)) * (req.priceMult || 1));

  const S = SHOP.satisfaction;
  let mood = score >= S.perfect ? 'perfect' : score >= S.good ? 'good' : score >= S.ok ? 'ok' : 'bad';
  let repDelta = SHOP.rep[mood];
  if (sub) {
    price = Math.round(price * SMART.sub.priceMult);
    const order = ['bad', 'ok', 'good', 'perfect'];
    if (order.indexOf(mood) > order.indexOf(SMART.sub.maxMood)) mood = SMART.sub.maxMood;
    repDelta = SMART.sub.rep;
  }
  return { ok: ok || sub, exact: ok, sub, subOk, checks, score, parts, tips, price, mood, repDelta, qAvg, items };
}

export function tipAmount(rng, tier, ev) {
  const chance = SHOP.tip.baseChance + tier * SHOP.tip.chancePerTier + (ev.mood === 'perfect' ? SHOP.tip.happyBonus : 0);
  if (ev.mood === 'bad' || rng() >= chance) return 0;
  return Math.max(1, Math.round(ev.price * randRange(rng, SHOP.tip.pct)));
}

// ------------------- 🔁 hoa thay thế (0.26.1) -------------------
const reqTones = (req) => (req.type === 'bouquet' ? [req.tone] : tonesOf(req.flower, req.variant || DEFAULT_VARIANT[req.flower]) || []);
const reqMeans = (req) => (req.type === 'bouquet' ? (req.meaning ? [req.meaning] : []) : VARIANTS_MEANINGS[`${req.flower}:${req.variant || DEFAULT_VARIANT[req.flower]}`] || []);
/** 1 cành có dùng thay được không: cùng loài (khác màu / ít sao hơn), hoặc loài khác cùng tông màu / cùng ý nghĩa (không mang ý nghĩa buồn) */
function subItemOk(req, it) {
  if (it.species === req.flower) return true;
  const ms = VARIANTS_MEANINGS[`${it.species}:${it.variant}`] || [];
  if (ms.some((m) => MEANINGS[m]?.negative)) return false;
  return (tonesOf(it.species, it.variant) || []).some((t) => reqTones(req).includes(t)) || ms.some((m) => reqMeans(req).includes(m));
}
function subAcceptable(req, items, total, sel) {
  if (!total) return false;
  if (req.type !== 'bouquet') return total === req.count && items.every((it) => subItemOk(req, it));
  // bó hoa: chỉ nới "phải có loài X" và "đủ sao"; số cành, giấy, ruy băng vẫn phải đúng
  return total >= req.min && total <= req.max && !!PAPERS[sel.paper] && !!RIBBONS[sel.ribbon];
}

/** Gợi ý hoa thay thế tốt nhất trong kho. Trả về sel (có sub: true) hoặc null */
export function subPick(req, inventory, known = null) {
  if (req.type === 'bouquet') {
    const p = autoPick({ ...req, minQuality: 1, mustInclude: null }, inventory, known);
    const n = Object.values(p.items).reduce((a, b) => a + b, 0);
    return n >= req.min ? { ...p, sub: true } : null;
  }
  const stacks = Object.entries(inventory.flowers).filter(([, n]) => n > 0).map(([k, n]) => { const f = parseFlowerKey(k); return { k, n, it: { species: f.species, variant: f.variant, q: f.q } }; })
    .filter((x) => !FLOWERS[x.it.species]?.luck && subItemOk(req, x.it))
    // cùng loài trước, rồi nhiều sao trước
    .sort((a, b) => (b.it.species === req.flower) - (a.it.species === req.flower) || b.it.q - a.it.q);
  const items = {};
  let need = req.count;
  for (const x of stacks) { if (!need) break; const t = Math.min(need, x.n); items[x.k] = t; need -= t; }
  return need ? null : { items, sub: true };
}

/** Kho đáp ứng được khách không: 'yes' (đúng yêu cầu) | 'sub' (chỉ hoa thay thế) | 'no' */
export function canServe(req, inventory, known = null) {
  const p = autoPick(req, inventory, known);
  const sel = { ...p, paper: p.paper || 'kraft', ribbon: p.ribbon || 'twine' };
  if (evaluateDelivery(req, sel).exact) return 'yes';
  return subPick(req, inventory, known) ? 'sub' : 'no';
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
