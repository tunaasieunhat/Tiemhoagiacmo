// =============================================================
//  🍀 VẬN MAY (GĐ15) — LOGIC THUẦN (không import three/DOM)
//  save.luck = { tickets: {luck, gold}, shards, pity: {normal, gold}, opened: {normal, gold},
//                dailyDate: 'YYYY-MM-DD' (giờ VN), got: {mã: số lần}, history: [{pack, tier, icon, text, at}] }
// =============================================================
import { LUCK_RULES, PACKS, TIERS, TIER_ORDER, REWARDS, DUP_SHARDS, SHARD_SHOP, TICKET_SOURCES } from '../../data/luck.js';
import { FLOWERS, NORMAL_FLOWER_IDS, LUCK_FLOWER_IDS } from '../../data/flowers.js';
import { VARIANTS } from '../../data/variants.js';
import { DECOR } from '../../data/decor.js';
import { UPGRADES } from '../../data/market.js';
import { PROTECTION } from '../../data/seasons.js';
import { vkey, variantName } from './variants.js';

export const LUCK_DECOR_IDS = Object.keys(DECOR).filter((id) => DECOR[id].luck);

export function createLuckState() {
  return {
    tickets: { luck: LUCK_RULES.welcome.luck, gold: LUCK_RULES.welcome.gold },
    shards: 0,
    pity: { normal: 0, gold: 0 },
    opened: { normal: 0, gold: 0 },
    dailyDate: '',
    got: {},
    history: [],
  };
}

const L = (save) => {
  save.luck = save.luck || createLuckState();
  const l = save.luck;
  l.tickets = l.tickets || { luck: 0, gold: 0 };
  l.pity = l.pity || { normal: 0, gold: 0 };
  l.opened = l.opened || { normal: 0, gold: 0 };
  l.got = l.got || {};
  l.history = l.history || [];
  return l;
};

/** Ngày thật theo giờ Việt Nam (UTC+7), dạng YYYY-MM-DD */
export const vnDate = (ts = Date.now()) => new Date(ts + 7 * 3600 * 1000).toISOString().slice(0, 10);

/** Cộng vé / mảnh. rw = { luck, gold, shard } */
export function grantTickets(save, rw = {}) {
  const l = L(save);
  if (rw.luck) l.tickets.luck = (l.tickets.luck || 0) + rw.luck;
  if (rw.gold) l.tickets.gold = (l.tickets.gold || 0) + rw.gold;
  if (rw.shard) l.shards = (l.shards || 0) + rw.shard;
  return rw;
}

/** Vé mỗi ngày (lần đầu vào game trong ngày thật). Trả về phần thưởng hoặc null */
export function claimDaily(save, ts = Date.now()) {
  const l = L(save);
  const d = vnDate(ts);
  if (l.dailyDate === d) return null;
  l.dailyDate = d;
  return grantTickets(save, TICKET_SOURCES.daily);
}

/** Vé khi lên cấp lv */
export function levelUpTickets(save, lv) {
  const rw = { ...TICKET_SOURCES.levelUp };
  if (TICKET_SOURCES.levelUpGoldEvery && lv % TICKET_SOURCES.levelUpGoldEvery === 0) rw.gold = (rw.gold || 0) + 1;
  return grantTickets(save, rw);
}

const tierIdx = (t) => TIER_ORDER.indexOf(t);
const randInt = (rng, [a, b]) => a + Math.floor(rng() * (b - a + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const decorCount = (save, id) => (save.decor?.owned?.[id] || 0) + (save.decor?.placed || []).filter((p) => p.id === id).length;

// ---------- tạo quà theo loại ----------
const GEN = {
  seed(save, r, rng) {
    const sp = NORMAL_FLOWER_IDS.filter((id) => FLOWERS[id].unlockLevel <= save.player.level);
    if (!sp.length) return null;
    const s = pick(rng, sp), n = randInt(rng, r.n);
    return { type: 'seed', key: vkey(s), n, icon: FLOWERS[s].icon, text: `${n} hạt ${variantName(s, null)}` };
  },
  item(save, r, rng) {
    const n = randInt(rng, r.n);
    const names = { fertilizer: ['🧪', 'Phân bón'], medicine: [PROTECTION.medicine.icon, PROTECTION.medicine.name], cover: [PROTECTION.cover.icon, PROTECTION.cover.name] };
    const [icon, name] = names[r.id] || ['📦', r.id];
    return { type: 'item', key: r.id, n, icon, text: `${n} ${name}` };
  },
  coins(save, r, rng) {
    const n = Math.round(randInt(rng, r.n) / 10) * 10;
    return { type: 'coins', n, icon: '💰', text: `${n} 💰` };
  },
  colorSeed(save, r, rng) {
    const list = [];
    for (const sp of NORMAL_FLOWER_IDS) {
      if (FLOWERS[sp].unlockLevel > save.player.level + 1) continue;
      for (const [v, d] of Object.entries(VARIANTS[sp] || {})) if (d.rarity === r.rarity) list.push([sp, v]);
    }
    if (!list.length) return null;
    const [sp, v] = pick(rng, list), n = randInt(rng, r.n);
    return { type: 'seed', key: `${sp}:${v}`, n, icon: FLOWERS[sp].icon, text: `${n} hạt ${variantName(sp, v)}` };
  },
  earlySeed(save, r, rng) {
    const sp = NORMAL_FLOWER_IDS.filter((id) => FLOWERS[id].unlockLevel > save.player.level);
    if (!sp.length) return null;
    const s = pick(rng, sp), n = randInt(rng, r.n);
    return { type: 'seed', key: vkey(s), n, icon: FLOWERS[s].icon, text: `${n} hạt ${variantName(s, null)}`, early: FLOWERS[s].unlockLevel };
  },
  decor(save, r, rng) {
    let list = Object.keys(DECOR).filter((id) => !DECOR[id].luck && DECOR[id].price >= (r.minPrice || 0) && DECOR[id].price <= (r.maxPrice ?? 1e9));
    if (!list.length) return null;
    const fresh = list.filter((id) => !decorCount(save, id));
    if (fresh.length) list = fresh;
    if (r.early) { const e = list.filter((id) => DECOR[id].level > save.player.level); if (e.length) list = e; }
    const id = pick(rng, list);
    return { type: 'decor', key: id, n: 1, icon: DECOR[id].icon, text: DECOR[id].name, early: DECOR[id].level > save.player.level ? DECOR[id].level : 0 };
  },
  upgrade(save, r, rng) {
    const list = Object.keys(UPGRADES).filter((k) => (save.upgrades?.[k] || 0) < UPGRADES[k].tiers.length - 1);
    if (!list.length) return null;
    const k = pick(rng, list);
    const t = UPGRADES[k].tiers[(save.upgrades[k] || 0) + 1];
    return { type: 'upgrade', key: k, n: 1, icon: UPGRADES[k].icon, text: `Nâng cấp: ${t.name}`, early: t.level > save.player.level ? t.level : 0 };
  },
  luckDecor(save, r, rng) {
    const id = pick(rng, LUCK_DECOR_IDS);
    if (decorCount(save, id)) return { type: 'dup', key: id, icon: DECOR[id].icon, text: DECOR[id].name };
    return { type: 'decor', key: id, n: 1, icon: DECOR[id].icon, text: DECOR[id].name, exclusive: true };
  },
  luckFlower(save, r, rng) {
    const s = pick(rng, LUCK_FLOWER_IDS), n = randInt(rng, r.n);
    return { type: 'seed', key: vkey(s), n, icon: FLOWERS[s].icon, text: `${n} hạt ${FLOWERS[s].name}`, luckFlower: s, isNew: !L(save).got[s] };
  },
};

/** Chọn 1 món trong bậc tier (thử loại khác nếu loại vừa chọn không còn gì để tặng) */
export function generateReward(save, tier, rng = Math.random) {
  let pool = [...REWARDS[tier]];
  while (pool.length) {
    const total = pool.reduce((a, r) => a + r.w, 0);
    let x = rng() * total, i = 0;
    for (; i < pool.length - 1; i++) { x -= pool[i].w; if (x < 0) break; }
    const r = pool[i];
    const out = GEN[r.kind]?.(save, r, rng);
    if (out) return { ...out, kind: r.kind, tier };
    pool.splice(i, 1);
  }
  return { type: 'dup', kind: 'none', tier, icon: '🧩', text: 'Mảnh may mắn' };
}

/** Cộng quà vào save. Trả về số mảnh nhận được do trùng */
function applyReward(save, rw) {
  const inv = save.inventory;
  if (rw.type === 'seed') inv.seeds[rw.key] = (inv.seeds[rw.key] || 0) + rw.n;
  else if (rw.type === 'item') inv.items[rw.key] = (inv.items[rw.key] || 0) + rw.n;
  else if (rw.type === 'coins') save.player.coins += rw.n;
  else if (rw.type === 'decor') save.decor.owned[rw.key] = (save.decor.owned[rw.key] || 0) + 1;
  else if (rw.type === 'upgrade') save.upgrades[rw.key] = (save.upgrades[rw.key] || 0) + 1;
  else if (rw.type === 'dup') { const n = DUP_SHARDS[rw.tier] || 1; L(save).shards += n; return n; }
  const g = L(save).got;
  const gk = rw.luckFlower || (rw.exclusive ? rw.key : null);
  if (gk) g[gk] = (g[gk] || 0) + 1;
  return 0;
}

/** Kiểm tra mở được không. pay: 'ticket' | 'coins' */
export function canOpen(save, packId, pay = 'ticket') {
  const P = PACKS[packId];
  if (!P) return { ok: false, msg: 'Không có gói này' };
  if (save.player.level < P.level) return { ok: false, msg: `Cần đạt cấp ${P.level} để mở ${P.name}` };
  const l = L(save);
  if (pay === 'coins') {
    if (save.player.coins < P.coins) return { ok: false, msg: `Không đủ tiền (cần ${P.coins} 💰)` };
  } else {
    for (const [t, n] of Object.entries(P.cost)) if ((l.tickets[t] || 0) < n) return { ok: false, msg: `Không đủ vé (cần ${n} ${t === 'gold' ? '🎫 vé vàng' : '🎟️ vé may mắn'})` };
  }
  return { ok: true };
}

/** Số lần mở nữa thì chắc chắn ra bậc bảo hiểm (1 = lần tới chắc chắn) */
export function pityLeft(save, packId) {
  const P = PACKS[packId];
  return P.pity.every - (L(save).pity[packId] || 0);
}

/** Tung bậc quà theo tỉ lệ (có bảo hiểm) */
export function rollTier(save, packId, rng = Math.random) {
  const P = PACKS[packId];
  if (pityLeft(save, packId) <= 1) return { tier: P.pity.tier, forced: true };
  let x = rng();
  const tiers = TIER_ORDER.filter((t) => P.odds[t]);
  for (const t of tiers) { x -= P.odds[t]; if (x < 0) return { tier: t, forced: false }; }
  return { tier: tiers[tiers.length - 1], forced: false };
}

/** Mở 1 gói. Trả về { ok, msg } hoặc { ok, pack, tier, forced, reward, dupShards, baseShards, pityLeft } */
export function openPack(save, packId, pay = 'ticket', rng = Math.random, now = Date.now()) {
  const chk = canOpen(save, packId, pay);
  if (!chk.ok) return chk;
  const P = PACKS[packId];
  const l = L(save);
  if (pay === 'coins') { save.player.coins -= P.coins; save.stats.spent = (save.stats.spent || 0) + P.coins; }
  else for (const [t, n] of Object.entries(P.cost)) l.tickets[t] -= n;
  const { tier, forced } = rollTier(save, packId, rng);
  const reward = generateReward(save, tier, rng);
  const dupShards = applyReward(save, reward);
  l.shards += P.shards;
  l.opened[packId] = (l.opened[packId] || 0) + 1;
  l.pity[packId] = tierIdx(tier) >= tierIdx(P.pity.tier) ? 0 : (l.pity[packId] || 0) + 1;
  l.history.unshift({ pack: packId, tier, icon: reward.icon, text: reward.type === 'dup' ? `${reward.text} (trùng → ${dupShards} 🧩)` : reward.text, at: now });
  l.history.length = Math.min(l.history.length, LUCK_RULES.historySize);
  return { ok: true, pack: packId, tier, forced, reward, dupShards, baseShards: P.shards, pityLeft: pityLeft(save, packId) };
}

/** Bảng tỉ lệ công khai: [{ tier, p, items: [{ label, p }] }] — p là xác suất trên 1 lần mở */
export function oddsTable(packId) {
  const P = PACKS[packId];
  const LABEL = {
    seed: 'Hạt giống loài đã mở', item: null, coins: 'Tiền 💰', colorSeed: null, earlySeed: '🔓 Hạt loài chưa tới cấp (mở khóa sớm)',
    decor: null, upgrade: '🔧 Nâng 1 bậc dụng cụ', luckDecor: '🍀 Đồ trang trí Vận May (trùng → mảnh)', luckFlower: null,
  };
  const ITEM = { fertilizer: '🧪 Phân bón', medicine: '💊 Thuốc', cover: '⛺ Bạt che' };
  return TIER_ORDER.filter((t) => P.odds[t]).map((tier) => {
    const list = REWARDS[tier];
    const total = list.reduce((a, r) => a + r.w, 0);
    const items = [];
    for (const r of list) {
      const p = P.odds[tier] * (r.w / total);
      if (r.kind === 'luckFlower') {
        LUCK_FLOWER_IDS.forEach((id) => items.push({ label: `${FLOWERS[id].icon} ${FLOWERS[id].name} ×${r.n[0]}`, p: p / LUCK_FLOWER_IDS.length }));
        continue;
      }
      let label = LABEL[r.kind];
      if (r.kind === 'item') label = ITEM[r.id] || r.id;
      if (r.kind === 'colorSeed') label = r.rarity === 'rare' ? 'Hạt màu Hiếm' : 'Hạt màu Ít gặp';
      if (r.kind === 'decor') label = r.early ? '🎨 Đồ trang trí đắt (ưu tiên món chưa tới cấp)' : '🎨 Đồ trang trí chưa có';
      items.push({ label: `${label}${r.n && r.kind !== 'coins' ? ` ×${r.n[0]}–${r.n[1]}` : r.kind === 'coins' ? ` ${r.n[0]}–${r.n[1]}` : ''}`, p });
    }
    return { tier, name: TIERS[tier].name, color: TIERS[tier].color, p: P.odds[tier], items };
  });
}

/** Đổi mảnh. what: 'luckFlower' | 'luckDecor' | 'gold' | 'luck'; id: loài / món */
export function exchangeShards(save, what, id) {
  const S = SHARD_SHOP[what];
  const l = L(save);
  if (!S) return { ok: false, msg: 'Không có món này' };
  if ((l.shards || 0) < S.cost) return { ok: false, msg: `Cần ${S.cost} 🧩 (đang có ${l.shards || 0})` };
  let text = '';
  if (what === 'luckFlower') {
    if (!LUCK_FLOWER_IDS.includes(id)) return { ok: false, msg: 'Hãy chọn 1 Cây Vận May' };
    save.inventory.seeds[vkey(id)] = (save.inventory.seeds[vkey(id)] || 0) + S.n;
    l.got[id] = (l.got[id] || 0) + 1;
    text = `${S.n} hạt ${FLOWERS[id].name}`;
  } else if (what === 'luckDecor') {
    if (!LUCK_DECOR_IDS.includes(id)) return { ok: false, msg: 'Hãy chọn 1 món' };
    if (decorCount(save, id)) return { ok: false, msg: `Bạn đã có ${DECOR[id].name} rồi` };
    save.decor.owned[id] = 1;
    l.got[id] = (l.got[id] || 0) + 1;
    text = DECOR[id].name;
  } else {
    l.tickets[what] = (l.tickets[what] || 0) + S.n;
    text = `${S.n} ${what === 'gold' ? '🎫 vé vàng' : '🎟️ vé may mắn'}`;
  }
  l.shards -= S.cost;
  return { ok: true, text };
}

export const ownsLuckDecor = (save, id) => decorCount(save, id) > 0;
