// =============================================================
//  LAI TẠO (thuần dữ liệu): 2 cành cùng loài -> hạt giống màu mới
// =============================================================
import { VARIANTS, BREEDING } from '../../data/variants.js';
import { parseFlowerKey, vkey } from './variants.js';

/** Các kết quả có thể có khi lai màu a với màu b (cùng loài). avgQ = trung bình số sao */
export function breedOutcomes(species, a, b, avgQ = 1) {
  const boost = BREEDING.rareBoostByQuality[Math.round(avgQ)] || 1;
  const out = [];
  let used = 0;
  for (const [v, d] of Object.entries(VARIANTS[species])) {
    for (const [p1, p2, chance] of d.breed || []) {
      if ((p1 === a && p2 === b) || (p1 === b && p2 === a)) {
        const p = chance * (d.rarity === 'rare' ? boost : 1);
        out.push({ variant: v, p });
        used += p;
      }
    }
  }
  const rest = Math.max(0, 1 - used);
  if (a === b) out.push({ variant: a, p: rest });
  else out.push({ variant: a, p: rest / 2 }, { variant: b, p: rest / 2 });
  // gộp trùng
  const merged = {};
  out.forEach((o) => { merged[o.variant] = (merged[o.variant] || 0) + o.p; });
  return Object.entries(merged).map(([variant, p]) => ({ variant, p })).sort((x, y) => y.p - x.p);
}

export function createLabState() {
  return { slot: null };
}

/** Bắt đầu lai 2 cành trong kho. keyA, keyB: mã hoa ("rose:red|3") */
export function startBreeding(save, keyA, keyB, rng = Math.random) {
  const lab = save.lab;
  if (lab.slot) return { ok: false, msg: 'Nhà lai tạo đang bận' };
  if (save.player.level < BREEDING.unlockLevel) return { ok: false, msg: `Cần đạt cấp ${BREEDING.unlockLevel}` };
  const A = parseFlowerKey(keyA), B = parseFlowerKey(keyB);
  if (A.species !== B.species) return { ok: false, msg: 'Chỉ lai được 2 cành cùng loài hoa' };
  const inv = save.inventory.flowers;
  const need = keyA === keyB ? 2 : 1;
  if ((inv[keyA] || 0) < need || (inv[keyB] || 0) < 1) return { ok: false, msg: 'Không đủ hoa trong kho' };
  inv[keyA] -= 1; inv[keyB] -= 1;
  if (!inv[keyA]) delete inv[keyA];
  if (!inv[keyB]) delete inv[keyB];
  const avgQ = (A.q + B.q) / 2;
  const outs = breedOutcomes(A.species, A.variant, B.variant, avgQ);
  let r = rng(), result = outs[outs.length - 1].variant;
  for (const o of outs) { if ((r -= o.p) <= 0) { result = o.variant; break; } }
  const now = save.time.gameMinutes;
  lab.slot = {
    species: A.species, a: A.variant, b: B.variant, avgQ,
    startedAt: now, readyAt: now + BREEDING.hours * 60,
    result, seeds: BREEDING.seeds + (avgQ >= BREEDING.bonusSeedAvgQuality ? 1 : 0),
  };
  return { ok: true, msg: 'Đã bắt đầu lai tạo!' };
}

export function labReady(save) {
  return !!save.lab.slot && save.time.gameMinutes >= save.lab.slot.readyAt;
}

export function collectBreeding(save) {
  const s = save.lab.slot;
  if (!s) return { ok: false, msg: 'Chưa có gì để nhận' };
  if (save.time.gameMinutes < s.readyAt) return { ok: false, msg: 'Chưa lai xong' };
  const k = vkey(s.species, s.result);
  save.inventory.seeds[k] = (save.inventory.seeds[k] || 0) + s.seeds;
  save.lab.slot = null;
  save.stats.bred = (save.stats.bred || 0) + 1;
  return { ok: true, species: s.species, variant: s.result, seeds: s.seeds, isNew: s.result !== s.a && s.result !== s.b };
}
