// Sổ tay thực vật: màu hoa đã trồng, ý nghĩa đã biết, mốc thưởng (thuần dữ liệu)
import { BOOK_MILESTONES } from '../../data/variants.js';
import { allVariants, vkey } from './variants.js';

export function createBook() {
  return { found: {}, meanings: {}, milestones: [] };
}

/** Ghi nhận thu hoạch. Trả về true nếu đây là màu mới */
export function recordHarvest(save, species, variant, q, day) {
  const k = vkey(species, variant);
  const b = save.book;
  const isNew = !b.found[k];
  const e = b.found[k] || (b.found[k] = { day, harvested: 0, bestQ: 0 });
  e.harvested += 1;
  e.bestQ = Math.max(e.bestQ, q);
  return isNew;
}

/** Biết thêm ý nghĩa của 1 màu hoa. Trả về true nếu mới biết */
export function learnMeaning(save, k) {
  if (save.book.meanings[k]) return false;
  save.book.meanings[k] = true;
  return true;
}

export function bookProgress(save) {
  const all = allVariants();
  const found = all.filter((v) => save.book.found[v.vkey]).length;
  const known = all.filter((v) => save.book.meanings[v.vkey]).length;
  return { found, known, total: all.length, pct: Math.round((found / all.length) * 100) };
}

/** Kiểm tra mốc thưởng mới đạt; cộng tiền; trả về danh sách mốc */
export function claimMilestones(save) {
  const { pct } = bookProgress(save);
  const got = [];
  for (const m of BOOK_MILESTONES) {
    if (pct >= m.pct && !save.book.milestones.includes(m.pct)) {
      save.book.milestones.push(m.pct);
      save.player.coins += m.coins;
      got.push(m);
    }
  }
  return got;
}
