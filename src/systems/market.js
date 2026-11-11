// =============================================================
//  MUA BÁN Ở KHU CHỢ (thuần dữ liệu). Mỗi hàm trả về { ok, msg }
// =============================================================
import { FLOWERS } from '../../data/flowers.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { SUPPLIES, UPGRADES, PLOT_UNLOCKS } from '../../data/market.js';
import { createPlot } from '../save/schema.js';
import { PROTECTION } from '../../data/seasons.js';
import { vkey } from './variants.js';

const fail = (msg) => ({ ok: false, msg });

function pay(save, cost) {
  if (save.player.coins < cost) return false;
  save.player.coins -= cost;
  save.stats.spent = (save.stats.spent || 0) + cost;
  return true;
}

function checkLevel(save, lv) {
  return save.player.level >= (lv || 1);
}

export function buySeeds(save, id, n = 1) {
  const f = FLOWERS[id];
  if (!f) return fail('Không rõ loại hạt');
  if (!checkLevel(save, f.unlockLevel)) return fail(`Cần đạt cấp ${f.unlockLevel} để mua hạt ${f.name}`);
  if (f.salt && !save.story?.seen?.e1_sao) return fail('Hạt này chỉ có sau khi bạn đặt chân tới 🌫️ Mũi Én');
  const cost = f.seedPrice * n;
  if (!pay(save, cost)) return fail(`Không đủ tiền (cần ${cost} 💰)`);
  const k = vkey(id);
  save.inventory.seeds[k] = (save.inventory.seeds[k] || 0) + n;
  return { ok: true, msg: `Đã mua ${n} hạt ${f.name} (−${cost} 💰)` };
}

export function buySupply(save, key, n = 1) {
  const it = SUPPLIES[key];
  if (!it) return fail('Không rõ món hàng');
  const cost = it.price * n;
  if (!pay(save, cost)) return fail(`Không đủ tiền (cần ${cost} 💰)`);
  save.inventory.items[key] = (save.inventory.items[key] || 0) + n;
  return { ok: true, msg: `Đã mua ${n} ${it.name} (−${cost} 💰)` };
}

/** kind: 'papers' | 'ribbons' */
export function buyWrap(save, kind, id, n = 1) {
  const dict = kind === 'papers' ? PAPERS : RIBBONS;
  const w = dict[id];
  if (!w || w.free) return fail('Món này miễn phí, không cần mua');
  if (!checkLevel(save, w.unlockLevel)) return fail(`Cần đạt cấp ${w.unlockLevel}`);
  const cost = w.price * n;
  if (!pay(save, cost)) return fail(`Không đủ tiền (cần ${cost} 💰)`);
  save.inventory[kind][id] = (save.inventory[kind][id] || 0) + n;
  return { ok: true, msg: `Đã mua ${n} ${w.name} (−${cost} 💰)` };
}

export function nextUpgrade(save, key) {
  const u = UPGRADES[key];
  const cur = save.upgrades?.[key] || 0;
  return cur + 1 < u.tiers.length ? u.tiers[cur + 1] : null;
}

export function buyUpgrade(save, key) {
  const u = UPGRADES[key];
  if (!u) return fail('Không rõ nâng cấp');
  const next = nextUpgrade(save, key);
  if (!next) return fail('Đã nâng cấp tối đa');
  if (!checkLevel(save, next.level)) return fail(`Cần đạt cấp ${next.level}`);
  if (!pay(save, next.price)) return fail(`Không đủ tiền (cần ${next.price} 💰)`);
  save.upgrades[key] = (save.upgrades[key] || 0) + 1;
  return { ok: true, msg: `${u.icon} Đã nâng cấp: ${next.name}!` };
}

/** Lô đất kế tiếp có thể mua (hoặc null nếu đã mua hết) */
/** Các vị trí lô trong nông trại đã có (lô mua của dân làng không tính) */
export const ownedSlots = (save) => new Set(save.farm.plots.map((p, i) => (p.parcel ? null : p.slot ?? i)).filter((x) => x != null));

export function nextPlot(save) {
  const own = ownedSlots(save);
  return PLOT_UNLOCKS.find((p) => !own.has(p.slot)) || null;
}

export function buyPlot(save) {
  const p = nextPlot(save);
  if (!p) return fail('Đã mở rộng hết đất');
  if (!checkLevel(save, p.level)) return fail(`Cần đạt cấp ${p.level} để mở lô đất này`);
  if (!pay(save, p.price)) return fail(`Không đủ tiền (cần ${p.price} 💰)`);
  save.farm.plots.push({ ...createPlot(`plot-${p.slot + 1}`), slot: p.slot });
  return { ok: true, msg: `🗺️ Đã mở rộng lô đất số ${p.slot + 1}!` };
}

// ---------------- phòng hộ (GĐ5) ----------------

/** key: 'cover' | 'medicine' */
export function buyProtection(save, key, n = 1) {
  const it = PROTECTION[key];
  if (!it || key === 'greenhouse') return fail('Không rõ món hàng');
  if (!checkLevel(save, it.level)) return fail(`Cần đạt cấp ${it.level}`);
  const cost = it.price * n;
  if (!pay(save, cost)) return fail(`Không đủ tiền (cần ${cost} 💰)`);
  save.inventory.items[key] = (save.inventory.items[key] || 0) + n;
  return { ok: true, msg: `Đã mua ${n} ${it.name} (−${cost} 💰)` };
}

export function buyGreenhouse(save, plotIdx) {
  const it = PROTECTION.greenhouse;
  const plot = save.farm.plots[plotIdx];
  if (!plot) return fail('Không có lô đất này');
  if (plot.greenhouse) return fail('Lô này đã có nhà kính');
  if (!checkLevel(save, it.level)) return fail(`Cần đạt cấp ${it.level}`);
  if (!pay(save, it.price)) return fail(`Không đủ tiền (cần ${it.price} 💰)`);
  plot.greenhouse = true;
  plot.coverUntil = 0;
  return { ok: true, msg: `🏠 Đã xây nhà kính cho lô số ${plotIdx + 1}!` };
}
