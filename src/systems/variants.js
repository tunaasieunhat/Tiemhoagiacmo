// Biến thể màu: mã hạt "rose:red", mã hoa trong kho "rose:red|3"
import { FLOWERS } from '../../data/flowers.js';
import { VARIANTS, MEANINGS, RARITY } from '../../data/variants.js';

export const DEFAULT_VARIANT = Object.fromEntries(Object.entries(VARIANTS).map(([sp, vs]) => [sp, Object.keys(vs).find((k) => vs[k].default) || Object.keys(vs)[0]]));

export const vkey = (species, variant) => `${species}:${variant || DEFAULT_VARIANT[species]}`;
export function parseVkey(k) {
  const [species, variant] = String(k).split(':');
  return { species, variant: variant || DEFAULT_VARIANT[species], vkey: `${species}:${variant || DEFAULT_VARIANT[species]}` };
}
export const flowerKey = (species, variant, q) => `${vkey(species, variant)}|${q}`;
export function parseFlowerKey(k) {
  const [v, q] = String(k).split('|');
  return { ...parseVkey(v), q: +q || 1 };
}

export function variantData(species, variant) {
  return VARIANTS[species]?.[variant || DEFAULT_VARIANT[species]] || VARIANTS[species]?.[DEFAULT_VARIANT[species]];
}

/** Màu đầy đủ để dựng mô hình (màu thân/lá của loài + màu cánh của biến thể) */
export function variantColors(species, variant) {
  const base = FLOWERS[species].colors;
  const v = variantData(species, variant);
  return { ...base, petal: v.petal, petalDark: v.petalDark };
}

export function variantName(species, variant, { short = false } = {}) {
  const v = variantData(species, variant);
  return short ? v.name : `${FLOWERS[species].name} ${v.name}`;
}

export const tonesOf = (species, variant) => variantData(species, variant).tones;
export const meaningsOf = (species, variant) => variantData(species, variant).meanings;
export const rarityOf = (species, variant) => RARITY[variantData(species, variant).rarity];
export const meaningText = (id) => (MEANINGS[id] ? `${MEANINGS[id].icon} ${MEANINGS[id].name}` : '???');

/** Tất cả biến thể: [{species, variant, vkey}] */
export function allVariants() {
  return Object.entries(VARIANTS).flatMap(([species, vs]) => Object.keys(vs).map((variant) => ({ species, variant, vkey: `${species}:${variant}` })));
}
