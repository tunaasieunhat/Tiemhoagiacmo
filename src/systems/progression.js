// =============================================================
//  CẤP ĐỘ, XP, NÂNG CẤP (thuần dữ liệu)
// =============================================================
import { LEVEL_XP, LEVEL_XP_AFTER, levelReward } from '../../data/levels.js';
import { UPGRADES, PLOT_UNLOCKS } from '../../data/market.js';
import { FLOWERS } from '../../data/flowers.js';
import { PAPERS, RIBBONS } from '../../data/wrapping.js';
import { BREEDING } from '../../data/variants.js';

/** Tổng XP cần để đạt cấp lv */
export function xpForLevel(lv) {
  if (lv <= 1) return 0;
  if (lv - 1 < LEVEL_XP.length) return LEVEL_XP[lv - 1];
  return LEVEL_XP[LEVEL_XP.length - 1] + (lv - LEVEL_XP.length) * LEVEL_XP_AFTER;
}

export function levelFromXp(xp) {
  let lv = 1;
  while (xp >= xpForLevel(lv + 1)) lv++;
  return lv;
}

export function levelProgress(player) {
  const cur = xpForLevel(player.level);
  const next = xpForLevel(player.level + 1);
  return { cur: player.xp - cur, need: next - cur, frac: Math.min(1, (player.xp - cur) / (next - cur)) };
}

/** Cộng XP; nếu lên cấp thì trao thưởng. Trả về danh sách cấp mới [{level, reward}] */
export function addXp(save, amount) {
  const p = save.player;
  p.xp += Math.max(0, Math.round(amount));
  const ups = [];
  while (p.xp >= xpForLevel(p.level + 1)) {
    p.level += 1;
    const reward = levelReward(p.level);
    p.coins += reward.coins;
    save.inventory.items.fertilizer = (save.inventory.items.fertilizer || 0) + reward.fertilizer;
    ups.push({ level: p.level, reward, unlocks: unlocksAt(p.level) });
  }
  return ups;
}

/** Những thứ mở khóa đúng ở cấp lv */
export function unlocksAt(lv) {
  const list = [];
  Object.values(FLOWERS).forEach((f) => { if (!f.luck && f.unlockLevel === lv) list.push(`${f.icon} Hạt ${f.name}`); });
  Object.values(PAPERS).forEach((w) => { if ((w.unlockLevel || 1) === lv) list.push(`📜 ${w.name}`); });
  Object.values(RIBBONS).forEach((w) => { if ((w.unlockLevel || 1) === lv) list.push(`🎀 ${w.name}`); });
  Object.values(UPGRADES).forEach((u) => u.tiers.forEach((t) => { if (t.level === lv) list.push(`${u.icon} ${t.name}`); }));
  PLOT_UNLOCKS.forEach((pl, i) => { if (pl.level === lv) list.push(`🗺️ Lô đất số ${i + 2}`); });
  if (lv === BREEDING.unlockLevel) list.push('🧬 Nhà Lai Tạo');
  return list;
}

/** Giá trị tác dụng của 1 nâng cấp hiện tại (vd 'can' -> 1.5) */
export function upgradeValue(save, key) {
  const tier = save.upgrades?.[key] || 0;
  return UPGRADES[key].tiers[Math.min(tier, UPGRADES[key].tiers.length - 1)].value;
}
