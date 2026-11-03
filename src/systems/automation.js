// Tự động hóa (thuần dữ liệu): vòi tưới, máy bón phân, nhân viên
import { MACHINES, STAFF } from '../../data/automation.js';
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

export function hireStaff(save, id) {
  const s = STAFF[id];
  const st = save.automation.staff;
  if (!s) return fail('Không rõ');
  if (st[id]?.hired && st[id].active) return fail('Đã thuê rồi');
  if (save.player.level < s.level) return fail(`Cần đạt cấp ${s.level}`);
  const cost = st[id]?.hired ? s.wage : s.hire; // thuê lại sau khi nghỉ chỉ trả lương 1 ngày
  if (save.player.coins < cost) return fail(`Không đủ tiền (cần ${cost} 💰)`);
  save.player.coins -= cost;
  st[id] = { hired: true, active: true, nextAt: save.time.gameMinutes + 5 };
  return { ok: true, msg: `${s.icon} ${s.name} đã bắt đầu làm việc!` };
}

export function fireStaff(save, id) {
  if (save.automation.staff[id]) save.automation.staff[id] = { hired: false, active: false, nextAt: 0 };
  return { ok: true, msg: `Đã cho ${STAFF[id].name} nghỉ việc` };
}

/** Trả lương đầu ngày. Trả về [{id, paid}] ; không đủ tiền thì nhân viên tạm nghỉ */
export function payWages(save) {
  const out = [];
  for (const [id, st] of Object.entries(save.automation.staff)) {
    if (!st.hired || !st.active) continue;
    const w = STAFF[id].wage;
    if (save.player.coins >= w) { save.player.coins -= w; out.push({ id, paid: true }); }
    else { st.active = false; out.push({ id, paid: false }); }
  }
  return out;
}

/** Máy móc trên 1 ô (gọi mỗi bước mô phỏng) */
export function runMachines(save, plot, tile, cap) {
  const m = plot.machines;
  if (!m) return;
  if (m.sprinkler && ['tilled', 'growing', 'ready'].includes(tile.state) && tile.water < cap * MACHINES.sprinkler.threshold) tile.water = cap;
  if (m.feeder && farming.canFertilize(tile) && save.inventory.items.fertilizer > 0) farming.fertilize(tile, save);
}

/**
 * Bác làm vườn: thu hoạch, dọn, xới, gieo lại. Trả về { harvested: [{flower, variant, quality, pi, ti}], planted }
 */
export function runGardener(save, now) {
  const st = save.automation.staff.gardener;
  if (!st?.hired || !st.active || now < st.nextAt) return null;
  st.nextAt = now + STAFF.gardener.everyMinutes;
  const res = { harvested: [], planted: 0, tilled: 0 };
  save.farm.plots.forEach((plot, pi) => plot.tiles.forEach((tile, ti) => {
    let replant = null;
    if (tile.state === 'ready') {
      replant = vkey(tile.flower, tile.variant);
      const h = farming.harvest(tile, save);
      if (h.ok) res.harvested.push({ ...h, pi, ti });
    } else if (tile.state === 'dead') {
      replant = vkey(tile.flower, tile.variant);
    }
    if (tile.state === 'untilled' || tile.state === 'dead') { if (farming.till(tile, save).ok) res.tilled++; }
    if (replant && tile.state === 'tilled' && save.inventory.seeds[replant] > 0) {
      if (farming.plant(tile, replant, save, now, { plot }).ok) res.planted++;
    }
  }));
  return res;
}

export const staffActive = (save, id) => !!(save.automation?.staff?.[id]?.hired && save.automation.staff[id].active);
