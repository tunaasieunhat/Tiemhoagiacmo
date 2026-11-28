// 🌿 Nghề trồng hoa thật sự — LOGIC THUẦN. Số liệu: data/garden.js
// save.garden = { strains: { [id]: { sp, v, g: { size, bloom, hardy, speed }, name, gen, from } }, sseeds: { [id]: n }, next, breed: null | { a, b, readyAt } }
// plot.ph = độ pH hiện tại của lô (thiếu thì lấy pH tự nhiên)
import { GENES, STRAIN_RULES, SOIL_PH, FLOWER_PH, AMENDMENTS, INSECTS } from '../../data/garden.js';
import { FLOWERS } from '../../data/flowers.js';
import { MACHINES } from '../../data/automation.js';
import { variantName, vkey } from './variants.js';
import { isEnPlot } from '../../data/muien.js';
import * as farming from './farming.js';

export function G(save) {
  save.garden = save.garden || {};
  const g = save.garden;
  g.strains = g.strains || {};
  g.sseeds = g.sseeds || {};
  g.next = g.next || 1;
  if (g.breed === undefined) g.breed = null;
  return g;
}
const fail = (msg) => ({ ok: false, msg });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hash = (str) => { let h = 2166136261; for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 16; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; // FNV + trộn bit (giá trị đều hơn)

// ============================================================= DÒNG GIỐNG
export const strainKey = (id) => `S:${id}`;
export const isStrainKey = (k) => typeof k === 'string' && k.startsWith('S:');
export const strainOf = (save, k) => G(save).strains[isStrainKey(k) ? k.slice(2) : k] || null;
export const strainName = (save, id) => { const st = G(save).strains[id]; return st ? `${variantName(st.sp, st.v)} · ${st.name}` : ''; };
export const geneStars = (g) => Object.keys(GENES).map((k) => `${GENES[k].icon}${g[k]}`).join(' ');
export const geneTotal = (g) => Object.keys(GENES).reduce((a, k) => a + (g[k] || 1), 0);

function newStrain(save, sp, v, genes, gen, from, owner = 'Vườn') {
  const g = G(save);
  if (Object.keys(g.strains).length >= STRAIN_RULES.maxStrains) {
    // sổ đầy: bỏ dòng yếu nhất không còn hạt
    const weak = Object.entries(g.strains).filter(([id]) => !(g.sseeds[id] > 0)).sort((a, b) => geneTotal(a[1].g) - geneTotal(b[1].g))[0];
    if (!weak) return null;
    delete g.strains[weak[0]];
  }
  const id = String(g.next++);
  g.strains[id] = { sp, v, g: genes, gen, from, name: `dòng ${owner} F${gen}·${id}` };
  return id;
}

/** Trồng hạt dòng giống: như hạt thường + gắn gen vào ô */
export function plantStrain(tile, save, id, nowMin, opts = {}) {
  const g = G(save), st = g.strains[id];
  if (!st) return fail('Không rõ dòng giống');
  if (!(g.sseeds[id] > 0)) return fail('Hết hạt dòng giống này!');
  const k = vkey(st.sp, st.v);
  save.inventory.seeds[k] = (save.inventory.seeds[k] || 0) + 1; // mượn 1 hạt thường để dùng chung luật gieo
  const r = farming.plant(tile, k, save, nowMin, opts);
  if (!r.ok) { save.inventory.seeds[k] -= 1; return r; }
  g.sseeds[id] -= 1;
  applyStrain(tile, st);
  tile.strain = id;
  return { ...r, msg: `${r.msg} · 🧬 ${st.name}` };
}

/** Gắn hiệu ứng gen lên ô (gọi lúc gieo và khi mở game) */
export function applyStrain(tile, st) {
  tile.gMult = 1 + GENES.speed.perLevel * ((st?.g.speed || 1) - 1);
  tile.hardy = Math.max(0.3, 1 - GENES.hardy.perLevel * ((st?.g.hardy || 1) - 1));
}

/** Gen của ô đang trồng (null nếu ô thường) */
export const tileGenes = (save, tile) => (tile.strain ? G(save).strains[tile.strain]?.g || null : null);

/**
 * Sau khi hái (tile = bản sao TRƯỚC khi hái, res = kết quả farming.harvest).
 * Trả về { extra, seedBack, newStrain, hiveSeed } để game báo cho người chơi.
 */
export function afterHarvest(save, tile, res, plot, rng = Math.random) {
  const g = G(save), out = {};
  const genes = tileGenes(save, tile);
  // gen Sai hoa: thêm 1 bông
  if (genes && rng() < GENES.bloom.perLevel * (genes.bloom - 1)) {
    const key = `${vkey(res.flower, res.variant)}|${res.quality}`;
    save.inventory.flowers[key] = (save.inventory.flowers[key] || 0) + 1;
    out.extra = 1;
  }
  // hái cây dòng giống: có thể được lại hạt (giữ dòng)
  if (tile.strain && g.strains[tile.strain] && !res.perennial && rng() < STRAIN_RULES.returnSeed) { g.sseeds[tile.strain] = (g.sseeds[tile.strain] || 0) + 1; out.seedBack = tile.strain; }
  // hoa 3★ thường: có thể "giữ giống" thành dòng mới
  if (!tile.strain && res.quality >= 3 && save.player.level >= STRAIN_RULES.unlockLevel && !FLOWERS[res.flower].luck
    && rng() < STRAIN_RULES.keepChance + (res.golden ? STRAIN_RULES.keepGoldenBonus : 0)) {
    const [lo, hi] = STRAIN_RULES.newGenes;
    const genes2 = {};
    for (const k of Object.keys(GENES)) genes2[k] = lo + Math.floor(rng() * (hi - lo + 1));
    const id = newStrain(save, res.flower, res.variant, genes2, 1, null, save.player.name?.split(' ').pop() || 'Vườn');
    if (id) { g.sseeds[id] = (g.sseeds[id] || 0) + 1; out.newStrain = id; }
  }
  // nhà ong: thụ phấn ⇒ có thể rơi thêm 1 hạt thường cùng màu
  if (plot?.machines?.hive && rng() < INSECTS.hive.seedChance && !FLOWERS[res.flower].luck) {
    const k = vkey(res.flower, res.variant);
    save.inventory.seeds[k] = (save.inventory.seeds[k] || 0) + 1;
    out.hiveSeed = k;
  }
  return out;
}

/** Lai 2 dòng cùng loài (tốn 1 hạt mỗi dòng + tiền). Hạt lai ra sau STRAIN_RULES.breedHours */
export function startBreed(save, a, b, nowMin) {
  const g = G(save);
  if (save.player.level < STRAIN_RULES.unlockLevel) return fail(`Vườn ươm mở ở cấp ${STRAIN_RULES.unlockLevel}`);
  if (g.breed) return fail('Vườn ươm đang lai một cặp rồi');
  const A = g.strains[a], B = g.strains[b];
  if (!A || !B || a === b) return fail('Chọn 2 dòng giống khác nhau');
  if (A.sp !== B.sp) return fail('Chỉ lai được 2 dòng cùng loài hoa');
  if (!(g.sseeds[a] > 0) || !(g.sseeds[b] > 0)) return fail('Mỗi dòng cần ít nhất 1 hạt');
  if (save.player.coins < STRAIN_RULES.breedCost) return fail(`Cần ${STRAIN_RULES.breedCost} 💰`);
  save.player.coins -= STRAIN_RULES.breedCost;
  g.sseeds[a] -= 1; g.sseeds[b] -= 1;
  g.breed = { a, b, readyAt: nowMin + STRAIN_RULES.breedHours * 60 };
  return { ok: true, msg: `🧬 Đang lai ${A.name} × ${B.name}… ${STRAIN_RULES.breedHours} giờ nữa có hạt` };
}

/** Lấy hạt lai khi đã đủ giờ. Trả về { ok, id, msg } */
export function collectBreed(save, nowMin, rng = Math.random, owner = 'Vườn') {
  const g = G(save), br = g.breed;
  if (!br) return fail('Không có cặp nào đang lai');
  if (nowMin < br.readyAt) return fail('Chưa xong');
  const A = g.strains[br.a], B = g.strains[br.b];
  g.breed = null;
  if (!A || !B) return fail('Dòng bố mẹ đã mất');
  const genes = {};
  for (const k of Object.keys(GENES)) {
    const base = (A.g[k] + B.g[k]) / 2;
    genes[k] = clamp(Math.round(base + (rng() - 0.5)), 1, 5);
  }
  const keys = Object.keys(GENES);
  let mutated = null;
  if (rng() < STRAIN_RULES.mutation) { mutated = keys[Math.floor(rng() * keys.length)]; genes[mutated] = clamp(genes[mutated] + 1, 1, 5); }
  const v = rng() < 0.5 ? A.v : B.v;
  const id = newStrain(save, A.sp, v, genes, Math.max(A.gen, B.gen) + 1, [br.a, br.b], owner);
  if (!id) return fail('Sổ dòng giống đầy');
  g.sseeds[id] = (g.sseeds[id] || 0) + STRAIN_RULES.breedSeeds;
  return { ok: true, id, mutated, msg: `🧬 Ra dòng mới ${g.strains[id].name}: ${geneStars(genes)}${mutated ? ` · ✨ đột biến ${GENES[mutated].name}!` : ''}` };
}

/** Bỏ 1 dòng khỏi sổ */
export function dropStrain(save, id) { const g = G(save); delete g.strains[id]; delete g.sseeds[id]; return { ok: true }; }

// ============================================================= ĐẤT (pH)
const plotId = (plot, idx) => plot.parcel || `slot${plot.slot ?? idx}`;
/** pH tự nhiên của lô (cố định theo lô) */
export function nativePh(plot, idx) {
  if (isEnPlot(plot)) return SOIL_PH.enNative;
  const [a, b] = SOIL_PH.native;
  return Math.round((a + (b - a) * hash(`ph:${plotId(plot, idx)}`)) * 10) / 10;
}
export const phOf = (plot, idx) => (plot.ph != null ? plot.ph : nativePh(plot, idx));
export const phName = (ph) => (ph < 5.5 ? 'rất chua' : ph < 6.3 ? 'hơi chua' : ph <= 7.2 ? 'trung tính' : ph <= 7.9 ? 'hơi kiềm' : 'kiềm');
/** Độ lệch pH so với khẩu vị loài (0 = vừa ý) */
export function phOff(flower, ph) {
  const r = FLOWER_PH[flower];
  if (!r) return 0;
  return ph < r[0] ? r[0] - ph : ph > r[1] ? ph - r[1] : 0;
}
export const phGrowMult = (flower, ph) => Math.max(SOIL_PH.minGrow, 1 - SOIL_PH.offGrowPerUnit * phOff(flower, ph));
export const phQuality = (flower, ph) => { const off = phOff(flower, ph); return FLOWER_PH[flower] ? (off === 0 ? SOIL_PH.fitBonus : -SOIL_PH.offPerUnit * off) : 0; };

/** pH trôi dần về tự nhiên (gọi theo bước thời gian) */
export function driftPh(plot, idx, dMin) {
  if (plot.ph == null) return;
  const nat = nativePh(plot, idx), step = SOIL_PH.driftPerDay * (dMin / 1440);
  const d = nat - plot.ph;
  plot.ph = Math.abs(d) <= step ? nat : Math.round((plot.ph + Math.sign(d) * step) * 1000) / 1000;
  if (plot.ph === nat) plot.ph = null;
}

/** Rải vật tư chỉnh đất cho cả lô (kind: lime | peat | fishmeal). fishmeal dùng phân bón ủ từ cá (items.fishmeal) */
export function amend(save, plotIdx, kind) {
  const plot = save.farm.plots[plotIdx], A = AMENDMENTS[kind];
  if (!plot || !A) return fail('Không rõ');
  if (!(save.inventory.items[kind] > 0)) return fail(`Hết ${A.name}! ${kind === 'fishmeal' ? 'Đổi cá lấy phân cá ở quầy cá Cồn Lặng.' : 'Mua ở 🏪 Chợ › Vật tư.'}`);
  save.inventory.items[kind] -= 1;
  if (A.ph) {
    const before = phOf(plot, plotIdx);
    plot.ph = clamp(Math.round((before + A.ph) * 10) / 10, SOIL_PH.min, SOIL_PH.max);
    return { ok: true, msg: `${A.icon} Đã rải ${A.name} cho lô ${plotIdx + 1}: pH ${before.toFixed(1)} → ${plot.ph.toFixed(1)} (${phName(plot.ph)})` };
  }
  plot.tiles.forEach((t) => { t.soil = Math.min(100, (t.soil ?? 100) + A.soil); });
  return { ok: true, msg: `${A.icon} Đã ủ ${A.name} cho lô ${plotIdx + 1}: đất màu mỡ hơn (+${A.soil})` };
}

/** Loài hợp đất của lô này nhất (để gợi ý) */
export function bestFor(ph, ids) { return ids.filter((f) => FLOWER_PH[f] && phOff(f, ph) === 0); }

// ============================================================= CÔN TRÙNG & SINH THÁI
/** Số loài khác nhau đang trồng trong lô */
export const plotDiversity = (plot) => new Set(plot.tiles.filter((t) => t.flower && ['growing', 'ready'].includes(t.state)).map((t) => t.flower)).size;
/** Hệ số sinh sâu của lô (nhà chim, đa dạng loài) */
export function bugMult(plot) {
  let m = 1;
  if (plot.machines?.birdhouse) m *= INSECTS.birdhouse.bugMult;
  if (plotDiversity(plot) >= INSECTS.diversity.species) m *= INSECTS.diversity.bugMult;
  return m;
}

/** Điểm chất lượng cộng thêm của ô (pH + gen Bông to + ong + đa dạng loài). Gọi mỗi bước mô phỏng */
export function tileBonus(save, plot, idx, tile) {
  if (!tile.flower) return 0;
  let q = phQuality(tile.flower, phOf(plot, idx));
  const genes = tileGenes(save, tile);
  if (genes) q += GENES.size.perLevel * (genes.size - 1);
  if (plot.machines?.hive) q += INSECTS.hive.qualityBonus;
  if (plotDiversity(plot) >= INSECTS.diversity.species) q += INSECTS.diversity.qualityBonus;
  return Math.round(q * 1000) / 1000;
}

/** Cây lâu năm có đang nghỉ mùa không */
export const isDormant = (flower, seasonId) => !!FLOWERS[flower]?.perennial?.dormant?.includes(seasonId);

export { MACHINES };
