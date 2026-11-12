// 🐾 Thú cưng & trứng (GĐ26) — logic thuần.
// save.pets = { list: [{ id, sp, name, lvl, xp, love, feedDay, petDay, mailDay, born }], active: id | null,
//   eggs: [{ id, kind, inc: phút game bắt đầu ấp | null }], incubators, seq, starter, walkAt }
import { PET_SPECIES, EGGS, PET_RULES, PET_NAMES } from '../../data/pets.js';

const fail = (msg) => ({ ok: false, msg });
export const createPetState = () => ({ list: [], active: null, eggs: [], incubators: PET_RULES.incubators, seq: 1, starter: false, walkAt: 0 });
export function PS(save) {
  save.pets = save.pets || createPetState();
  const p = save.pets;
  p.list = p.list || []; p.eggs = p.eggs || [];
  p.incubators = p.incubators || PET_RULES.incubators;
  return p;
}
export const petOf = (save, id) => PS(save).list.find((x) => x.id === id) || null;
export const activePet = (save) => petOf(save, PS(save).active);
export const xpNeed = (pet) => PET_RULES.xpPerLevel * pet.lvl;
export const hasSkill = (pet, key) => !!pet && pet.lvl >= PET_RULES.skills[key].level;

/** Thêm trứng. Trả về trứng mới */
export function addEgg(save, kind = 'common') {
  if (!EGGS[kind]) return null;
  const p = PS(save);
  const egg = { id: p.seq++, kind, inc: null };
  p.eggs.push(egg);
  return egg;
}

/** Trứng đầu tiên (mở ở cấp PET_RULES.unlockLevel) */
export function claimStarter(save) {
  const p = PS(save);
  if (p.starter) return fail('Đã nhận rồi');
  if (save.player.level < PET_RULES.unlockLevel) return fail(`Mở ở cấp ${PET_RULES.unlockLevel}`);
  p.starter = true;
  addEgg(save, 'common');
  return { ok: true, msg: '🥚 Bà Tư gửi bạn một quả trứng! Đặt vào ổ ấp để chờ nở nhé.' };
}

export const incubating = (save) => PS(save).eggs.filter((e) => e.inc != null);
export function incubate(save, eggId, now) {
  const p = PS(save);
  const egg = p.eggs.find((e) => e.id === eggId);
  if (!egg) return fail('Không rõ');
  if (egg.inc != null) return fail('Đang ấp rồi');
  if (incubating(save).length >= p.incubators) return fail(`Chỉ có ${p.incubators} ổ ấp — đợi trứng kia nở hoặc mua thêm ổ`);
  if (p.list.length + incubating(save).length >= PET_RULES.maxPets) return fail(`Tối đa ${PET_RULES.maxPets} thú cưng`);
  egg.inc = now;
  return { ok: true, msg: `🪺 Đã đặt ${EGGS[egg.kind].name} vào ổ ấp. ${EGGS[egg.kind].hours / 24} ngày game nữa nở!` };
}
export const hatchLeft = (egg, now) => (egg.inc == null ? null : Math.max(0, egg.inc + EGGS[egg.kind].hours * 60 - now));

export function buyIncubator(save) {
  const p = PS(save);
  if (p.incubators >= PET_RULES.incubatorMax) return fail('Đã có đủ ổ ấp');
  const cost = PET_RULES.incubatorPrice[p.incubators - 1];
  if (save.player.coins < cost) return fail(`Cần ${cost.toLocaleString('vi-VN')} 💰`);
  save.player.coins -= cost;
  save.stats.spent = (save.stats.spent || 0) + cost;
  p.incubators += 1;
  return { ok: true, msg: `🪺 Đã có thêm ổ ấp (${p.incubators}/${PET_RULES.incubatorMax})` };
}

/** Chọn loài khi trứng nở theo tỉ lệ độ hiếm */
export function rollSpecies(kind, rng = Math.random) {
  const odds = EGGS[kind].odds;
  let r = rng(), rar = Object.keys(odds)[0];
  for (const [k, v] of Object.entries(odds)) { if (r < v) { rar = k; break; } r -= v; }
  const pool = Object.keys(PET_SPECIES).filter((id) => PET_SPECIES[id].rarity === rar);
  return pool[Math.floor(rng() * pool.length)];
}

/** Trứng nào ấp đủ giờ thì nở. Trả về [thú mới] */
export function hatchTick(save, now, rng = Math.random) {
  const p = PS(save), out = [];
  for (const egg of [...p.eggs]) {
    if (egg.inc == null || hatchLeft(egg, now) > 0) continue;
    p.eggs = p.eggs.filter((e) => e !== egg);
    const sp = rollSpecies(egg.kind, rng);
    const used = new Set(p.list.map((x) => x.name));
    const free = PET_NAMES.filter((n) => !used.has(n));
    const pet = { id: p.seq++, sp, name: free[Math.floor(rng() * free.length)] || PET_SPECIES[sp].name, lvl: 1, xp: 0, love: 50, feedDay: 0, petDay: 0, mailDay: 0, born: now, egg: egg.kind };
    p.list.push(pet);
    if (!p.active) p.active = pet.id;
    out.push(pet);
  }
  return out;
}

function gainXp(pet, n) {
  pet.xp += n;
  let up = false;
  while (pet.lvl < PET_RULES.maxLevel && pet.xp >= xpNeed(pet)) { pet.xp -= xpNeed(pet); pet.lvl += 1; up = true; }
  if (pet.lvl >= PET_RULES.maxLevel) pet.xp = Math.min(pet.xp, xpNeed(pet));
  return up;
}

/** Cho ăn: food = 'flower:<mã hoa>' | 'snack:<mã>' (game trừ món trong kho trước khi gọi). 1 lần / ngày */
export function feed(save, id, day, snack = false) {
  const pet = petOf(save, id);
  if (!pet) return fail('Không rõ');
  if (pet.feedDay === day) return fail(`${pet.name} no rồi, mai cho ăn tiếp nhé!`);
  pet.feedDay = day;
  pet.love = Math.min(100, pet.love + PET_RULES.feedLove);
  const up = gainXp(pet, PET_RULES.feedXp * (snack ? PET_RULES.snackFeedBonus : 1));
  return { ok: true, up, msg: `${PET_SPECIES[pet.sp].icon} ${pet.name} ăn ngon lành! +${PET_RULES.feedXp * (snack ? PET_RULES.snackFeedBonus : 1)} XP` };
}
export function pat(save, id, day) {
  const pet = petOf(save, id);
  if (!pet) return fail('Không rõ');
  if (pet.petDay === day) return { ok: true, again: true, msg: `${pet.name} dụi đầu vào tay bạn 💕` };
  pet.petDay = day;
  pet.love = Math.min(100, pet.love + PET_RULES.petLove);
  const up = gainXp(pet, PET_RULES.petXp);
  return { ok: true, up, msg: `💕 ${pet.name} thích được vuốt ve lắm! +${PET_RULES.petXp} XP` };
}
export function setActive(save, id) {
  if (id != null && !petOf(save, id)) return fail('Không rõ');
  PS(save).active = id;
  return { ok: true };
}
export function rename(save, id, name) {
  const pet = petOf(save, id);
  const n = String(name || '').trim().slice(0, 12);
  if (!pet || !n) return fail('Tên chưa hợp lệ');
  pet.name = n;
  return { ok: true, msg: `Đã đặt tên “${n}”` };
}

/** Sang ngày mới: thú không được chăm thì giảm thân thiết */
export function newDay(save, day) {
  for (const pet of PS(save).list) if (pet.feedDay < day - 1 && pet.petDay < day - 1) pet.love = Math.max(0, pet.love - PET_RULES.loveDecay);
}

/**
 * Thú đang đi theo bạn làm việc (gọi mỗi bước thời gian khi đang chơi). Trả về [{ kind, ... }]
 * ctx: { seeds: [mã hạt có thể đào], rng, day }
 */
export function walkTick(save, from, to, ctx = {}) {
  const p = PS(save), pet = activePet(save);
  if (!pet) return [];
  const rng = ctx.rng || Math.random;
  const out = [];
  if (!p.walkAt || p.walkAt > to) p.walkAt = from;
  let guard = 0;
  while (p.walkAt + 60 <= to && guard++ < 48) {
    p.walkAt += 60;
    if (gainXp(pet, PET_RULES.walkXpPerHour)) out.push({ kind: 'level', pet });
    const k = pet.love / 100;
    const S = PET_RULES.skills;
    if (hasSkill(pet, 'dig') && ctx.seeds?.length && rng() < S.dig.chance * k) out.push({ kind: 'dig', pet, seed: ctx.seeds[Math.floor(rng() * ctx.seeds.length)] });
    if (hasSkill(pet, 'egg') && rng() < S.egg.chance * k) out.push({ kind: 'egg', pet, egg: rng() < 0.15 ? 'rare' : 'common' });
    const hour = (p.walkAt % 1440) / 60;
    if (hasSkill(pet, 'mail') && pet.mailDay !== ctx.day && hour >= 9 && hour < 18 && rng() < 0.25 * k + 0.05) {
      pet.mailDay = ctx.day;
      const [a, b] = S.mail.coins;
      out.push({ kind: 'mail', pet, coins: Math.round(a + rng() * (b - a)) });
    }
  }
  return out;
}
export { PET_SPECIES, EGGS, PET_RULES };
