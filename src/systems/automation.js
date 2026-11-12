// Tự động hóa (thuần dữ liệu): vòi tưới, máy bón phân, nhân viên
import { MACHINES, STAFF, STAFF_RULES, TRAITS, STAFF_NAMES, STAFF_LOOKS } from '../../data/automation.js';
import { FLOWERS } from '../../data/flowers.js';
import { inSeason } from './calendar.js';
import * as farming from './farming.js';
import { vkey } from './variants.js';

export function createAutomationState() {
  return { staff: {} }; // staff[id] = { hired: true, active: true, nextAt: phút game }
}

const fail = (msg) => ({ ok: false, msg });

export function buyMachine(save, kind, plotIdx) {
  const m = MACHINES[kind];
  const plot = save.farm.plots[plotIdx];
  if (!m || !plot) return fail('Không rõ');
  if (plot.machines?.[kind]) return fail('Lô này đã có rồi');
  if (save.player.level < m.level) return fail(`Cần đạt cấp ${m.level}`);
  if (save.player.coins < m.price) return fail(`Không đủ tiền (cần ${m.price} 💰)`);
  save.player.coins -= m.price;
  save.stats.spent = (save.stats.spent || 0) + m.price;
  plot.machines = { ...(plot.machines || {}), [kind]: true };
  return { ok: true, msg: `${m.icon} Đã lắp ${m.name} cho lô số ${plotIdx + 1}!` };
}

/** Máy móc trên 1 ô (gọi mỗi bước mô phỏng) */
export function runMachines(save, plot, tile, cap) {
  const m = plot.machines;
  if (!m) return;
  if (m.sprinkler && ['tilled', 'growing', 'ready'].includes(tile.state) && tile.water < cap * MACHINES.sprinkler.threshold) tile.water = cap;
  if (m.feeder && farming.canFertilize(tile) && save.inventory.items.fertilizer > 0) farming.fertilize(tile, save);
}

// =============================================================
//  👥 NHÂN VIÊN (GĐ25) — save.automation.staff[vị trí] = {
//    hired, active, name, look, trait, skill (1–10), xp, pay ('fixed' | 'perf'), mood (0–100), unpaid (số ngày nợ lương),
//    nextAt (phút game lượt làm kế), today: { jobs, earned }, yesterday: { jobs, earned, wage } }
//  save.automation.plan[chỉ số lô] = 'same' (gieo lại đúng hạt cũ) | 'auto' (hạt đúng mùa, giá cao nhất trong kho) | 'loài:màu'
// =============================================================
const hash = (str) => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rngOf = (seed) => { let x = seed || 1; return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; };

export function A(save) {
  save.automation = save.automation || createAutomationState();
  const a = save.automation;
  a.staff = a.staff || {};
  a.plan = a.plan || {};
  // chuyển nhân viên kiểu cũ (chỉ có hired/active) sang kiểu mới: giữ người cũ, tay nghề trung bình
  for (const [role, st] of Object.entries(a.staff)) {
    if (!STAFF[role] || st.skill) continue;
    a.staff[role] = st.hired ? { ...newWorker(role, { name: role === 'gardener' ? 'Bác Tâm' : 'Chị Thu', look: STAFF[role].look, skill: 3, trait: 'hard' }), active: st.active !== false, nextAt: st.nextAt || 0 } : { hired: false };
  }
  return a;
}

function newWorker(role, c) {
  return { hired: true, active: true, name: c.name, look: c.look, trait: c.trait, skill: c.skill, xp: 0, pay: 'fixed', mood: 70, unpaid: 0, nextAt: 0, today: { jobs: 0, earned: 0 }, yesterday: null };
}

export const staffActive = (save, id) => !!(save.automation?.staff?.[id]?.hired && save.automation.staff[id].active);
export const workerOf = (save, role) => { const w = A(save).staff[role]; return w?.hired ? w : null; };

/** Lương cứng 1 ngày theo tay nghề (+ tính cách) */
export function fixedWage(role, skill, trait) {
  const R = STAFF[role];
  return Math.round((R.base + R.perSkill * skill) * (TRAITS[trait]?.wage || 1));
}
/** Hoa hồng mỗi việc (trả theo hiệu suất) */
export const commission = (role, skill) => Math.round(STAFF[role].commission * (1 + 0.05 * skill));
/** Lương sẽ trả hôm nay (perf: 40% lương cứng + hoa hồng việc đã làm) */
export function wageToday(role, w) {
  const fixed = fixedWage(role, w.skill, w.trait);
  return w.pay === 'perf' ? Math.round(fixed * 0.4) + (w.today?.jobs || 0) * commission(role, w.skill) : fixed;
}

/** Phút giữa 2 lượt làm: tay nghề cao, tính cách chăm, tâm trạng tốt ⇒ nhanh hơn */
export function intervalOf(role, w) {
  const [slow, fast] = STAFF[role].every;
  const k = (Math.min(STAFF_RULES.maxSkill, w.skill) - 1) / (STAFF_RULES.maxSkill - 1);
  const mood = 1.25 - (w.mood ?? 70) / 200; // 100 vui ⇒ ×0,75 · 0 buồn ⇒ ×1,25
  return Math.max(4, Math.round((slow + (fast - slow) * k) * (TRAITS[w.trait]?.speed || 1) * mood));
}

/** 3 ứng viên cho 1 vị trí trong tuần này (cố định theo tuần, không đổi khi mở lại bảng) */
export function candidates(save, role, week) {
  const r = rngOf(hash(`${role}|${week}|${save.player?.name || ''}`));
  const traits = Object.keys(TRAITS);
  return Array.from({ length: STAFF_RULES.candidates }, (_, i) => {
    let skill = STAFF_RULES.skill[0] + Math.floor(r() * (STAFF_RULES.skill[1] - STAFF_RULES.skill[0] + 1));
    if (i === 2 && r() < STAFF_RULES.rareSkill) skill = 7 + Math.floor(r() * 2);
    const trait = traits[Math.floor(r() * traits.length)];
    return { idx: i, name: STAFF_NAMES[Math.floor(r() * STAFF_NAMES.length)], look: STAFF_LOOKS[Math.floor(r() * STAFF_LOOKS.length)], skill, trait, wage: fixedWage(role, skill, trait) };
  });
}

/** Thuê ứng viên số idx của tuần này. Phí tuyển = 2 ngày lương cứng */
export function hireStaff(save, role, idx, week) {
  const R = STAFF[role];
  if (!R) return fail('Không rõ vị trí');
  if (save.player.level < R.level) return fail(`Cần đạt cấp ${R.level}`);
  const a = A(save);
  if (a.staff[role]?.hired) return fail('Vị trí này đã có người. Cho nghỉ trước rồi mới thuê người mới.');
  const c = candidates(save, role, week)[idx];
  if (!c) return fail('Không có ứng viên này');
  if ((a.hiredWeek || {})[role] === week && (a.hiredIdx || {})[role] === idx) return fail('Người này vừa nghỉ, tuần sau mới có người mới');
  const fee = c.wage * STAFF_RULES.hireFeeDays;
  if (save.player.coins < fee) return fail(`Không đủ tiền (phí tuyển ${fee} 💰)`);
  save.player.coins -= fee;
  save.stats.spent = (save.stats.spent || 0) + fee;
  a.staff[role] = { ...newWorker(role, c), nextAt: save.time.gameMinutes + 5 };
  a.hiredWeek = { ...(a.hiredWeek || {}), [role]: week };
  a.hiredIdx = { ...(a.hiredIdx || {}), [role]: idx };
  return { ok: true, msg: `${R.icon} ${c.name} (tay nghề ${c.skill}) bắt đầu làm ${R.name.toLowerCase()}!` };
}

export function fireStaff(save, role) {
  const a = A(save), w = a.staff[role];
  const name = w?.name || STAFF[role]?.name;
  a.staff[role] = { hired: false };
  return { ok: true, msg: `Đã cho ${name} nghỉ việc` };
}

export function setPay(save, role, pay) {
  const w = workerOf(save, role);
  if (!w || !['fixed', 'perf'].includes(pay)) return fail('Không rõ');
  w.pay = pay;
  return { ok: true, msg: pay === 'perf' ? `${w.name}: trả lương theo hiệu suất` : `${w.name}: trả lương cứng` };
}

/** Thưởng nóng 1 ngày lương: tâm trạng tăng */
export function bonus(save, role) {
  const w = workerOf(save, role);
  if (!w) return fail('Không rõ');
  const cost = fixedWage(role, w.skill, w.trait);
  if (save.player.coins < cost) return fail('Không đủ tiền');
  save.player.coins -= cost;
  w.mood = Math.min(100, (w.mood ?? 70) + STAFF_RULES.bonusMood);
  if (!w.active && w.unpaid === 0) w.active = true;
  return { ok: true, msg: `🎁 Đã thưởng ${w.name} ${cost} 💰 — tâm trạng ${w.mood}/100`, cost };
}

/** Gọi lại người đang tạm nghỉ vì nợ lương: trả hết lương nợ */
export function rehire(save, role) {
  const w = A(save).staff[role];
  if (!w?.hired || w.active) return fail('Không cần gọi lại');
  const owe = fixedWage(role, w.skill, w.trait) * Math.max(1, w.unpaid || 1);
  if (save.player.coins < owe) return fail(`Cần trả ${owe} 💰 tiền lương còn nợ`);
  save.player.coins -= owe;
  Object.assign(w, { active: true, unpaid: 0, mood: Math.max(40, (w.mood ?? 50) - 10) });
  return { ok: true, msg: `${w.name} đã quay lại làm việc` };
}

/** Ghi 1 việc làm được: cộng kinh nghiệm, lên tay nghề. Trả về true nếu vừa lên tay nghề */
export function addJob(w, n = 1) {
  w.today = w.today || { jobs: 0, earned: 0 };
  w.today.jobs += n;
  w.xp = (w.xp || 0) + n * (TRAITS[w.trait]?.xp || 1);
  if (w.skill < STAFF_RULES.maxSkill && w.xp >= STAFF_RULES.xpPerSkill * w.skill) { w.xp = 0; w.skill += 1; return true; }
  return false;
}

/** Trả lương đầu ngày (theo cách trả của từng người). Trả về [{ role, name, paid, wage, quit }] */
export function payWages(save) {
  const out = [];
  for (const [role, w] of Object.entries(A(save).staff)) {
    if (!w.hired) continue;
    if (!w.active) { w.unpaid = (w.unpaid || 0) + 1; if (w.unpaid >= STAFF_RULES.unpaidQuit + 1) { out.push({ role, name: w.name, quit: true }); A(save).staff[role] = { hired: false }; } w.today = { jobs: 0, earned: 0 }; continue; }
    const wage = wageToday(role, w);
    w.yesterday = { jobs: w.today?.jobs || 0, earned: w.today?.earned || 0, wage };
    w.today = { jobs: 0, earned: 0 };
    if (save.player.coins >= wage) {
      save.player.coins -= wage;
      w.mood = Math.min(100, (w.mood ?? 70) + 3);
      w.unpaid = 0;
      out.push({ role, name: w.name, paid: true, wage });
    } else {
      w.active = false; w.unpaid = 1;
      w.mood = Math.max(0, (w.mood ?? 70) - 30 * (TRAITS[w.trait]?.mood || 1));
      out.push({ role, name: w.name, paid: false, wage });
    }
  }
  return out;
}

/** Hạt gieo cho 1 ô theo kế hoạch của lô */
function seedFor(save, plot, pi, tile, day) {
  const plan = A(save).plan[pi] || 'same';
  const inv = save.inventory.seeds;
  // 'same': gieo lại đúng loài vừa thu; ô mới / hết hạt loài cũ ⇒ tự chọn như 'auto' (không để đất trống)
  if (plan === 'same') { const k = tile.last ? Object.keys(inv).find((k2) => inv[k2] > 0 && k2.split(':')[0] === tile.last) : null; if (k) return k; }
  else if (plan !== 'auto') return inv[plan] > 0 ? plan : null;
  // tự chọn: hạt còn trong kho, đúng mùa, giá bán cao nhất
  const en = String(plot.parcel || '').startsWith('en'); // lô Mũi Én chỉ trồng hoa chịu mặn
  const okHere = (F) => F && !F.luck && !!F.salt === en && (!F.greenhouseOnly || plot.greenhouse);
  const keys = Object.keys(inv).filter((k) => inv[k] > 0 && okHere(FLOWERS[k.split(':')[0]]));
  keys.sort((a, b) => (inSeason(b.split(':')[0], day) - inSeason(a.split(':')[0], day)) || (FLOWERS[b.split(':')[0]].basePrice - FLOWERS[a.split(':')[0]].basePrice));
  return keys[0] || null;
}

/**
 * Người làm vườn: thu hoạch, dọn, xới, gieo theo kế hoạch, tưới ô khô (lô không có vòi tưới), bón phân (tay nghề 3+), chữa bệnh (tay nghề 5+).
 * Trả về { harvested: [...], planted, tilled, watered, fed, cured, levelUp } hoặc null nếu chưa tới lượt
 */
export function runGardener(save, now, { cap = 1, day = 1, offline = false } = {}) {
  const w = workerOf(save, 'gardener');
  if (!w?.active || now < (w.nextAt || 0)) return null;
  w.nextAt = now + intervalOf('gardener', w) * (offline ? 1.5 : 1);
  const res = { harvested: [], planted: 0, tilled: 0, watered: 0, fed: 0, cured: 0, levelUp: false };
  // mỗi lượt làm được số ô có hạn theo tay nghề
  let budget = 6 + w.skill * 3;
  save.farm.plots.forEach((plot, pi) => plot.tiles.forEach((tile, ti) => {
    if (budget <= 0) return;
    let did = false;
    if (tile.state === 'ready') { const h = farming.harvest(tile, save); if (h.ok) { res.harvested.push({ ...h, pi, ti }); did = true; } }
    if (tile.state === 'untilled' || tile.state === 'dead') { if (farming.till(tile, save).ok) { res.tilled++; did = true; } }
    if (tile.state === 'tilled') { const k = seedFor(save, plot, pi, tile, day); if (k && farming.plant(tile, k, save, now, { plot }).ok) { res.planted++; did = true; } }
    if (['growing', 'ready'].includes(tile.state)) {
      if (!plot.machines?.sprinkler && tile.water < cap * 0.35) { tile.water = cap; res.watered++; did = true; }
      if (w.skill >= 5 && tile.sick && save.inventory.items.medicine > 0 && farming.treat(tile, save, now).ok) { res.cured++; did = true; }
      if (w.skill >= 3 && farming.canFertilize(tile) && save.inventory.items.fertilizer > 0 && farming.fertilize(tile, save).ok) { res.fed++; did = true; }
    }
    if (did) budget--;
  }));
  const jobs = res.harvested.length + res.planted + res.tilled + res.watered + res.fed + res.cured;
  if (jobs) res.levelUp = addJob(w, jobs);
  return res;
}

/** Tới lượt làm của một vị trí chưa (bán hàng / giao hàng: game tự làm việc cụ thể) */
export function due(save, role, now) {
  const w = workerOf(save, role);
  if (!w?.active || now < (w.nextAt || 0)) return null;
  w.nextAt = now + intervalOf(role, w);
  return w;
}
