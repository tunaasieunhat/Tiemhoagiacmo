// Làng Hoa (GĐ11) — LOGIC THUẦN: ai đang ở đâu, làm gì (theo giờ game, thời tiết); tìm đường theo đường đá.
import { VILLAGE, HOUSES, NEW_VILLAGERS, REGULAR_ROLES, LEAVES_AFTER_STORY, GONE_WHEN, ACTIVITIES, SPOTS, SCHEDULES, NODES, EDGES, LINES } from '../../data/village.js';
import { REGULARS } from '../../data/regulars.js';
import { BAD_WEATHER as BAD_WEATHER_LIST } from '../../data/seasons.js';

export const VILLAGER_IDS = Object.keys(SCHEDULES);
const BAD_WEATHER = new Set(BAD_WEATHER_LIST);

export function homeOf(id) {
  return Object.keys(HOUSES).find((h) => HOUSES[h].owner === id) || null;
}

export function villagerInfo(id) {
  const reg = REGULARS[id];
  const nv = NEW_VILLAGERS[id];
  const base = reg || nv;
  if (!base) return null;
  return { id, name: base.name, self: base.self, look: base.look, bio: base.bio, role: nv?.role || REGULAR_ROLES[id] || '', regular: !!reg, home: homeOf(id) };
}

/** Dòng lịch đang áp dụng lúc "hour" (0–24) */
export function scheduleAt(id, hour) {
  const list = SCHEDULES[id] || [];
  let cur = list[0];
  for (const e of list) if (hour >= e[0]) cur = e;
  return cur ? { from: cur[0], spot: cur[1], act: cur[2] } : null;
}

/**
 * Người dân đang muốn ở đâu: { spot, act, absent, reason }
 * ctx: { hour, weather, festivalId, save }
 */
export function desiredState(id, { hour, weather = null, festivalId = null, save = null } = {}) {
  const gone = GONE_WHEN[id];
  if (gone && save?.story?.done?.l6 && save.story.flags?.[gone.flag]) return { absent: true, reason: 'moved', note: gone.note };
  const leave = LEAVES_AFTER_STORY[id];
  // (GĐ20B) holdByStory: người này là nhân vật của cốt truyện chính ⇒ hoãn chuyến đi, ở lại đảo
  if (leave && !(leave.holdByStory && save?.story) && (save?.regulars?.[id]?.hearts || 0) >= leave.hearts && !(leave.back || []).includes(festivalId)) {
    return { absent: true, reason: 'moved', note: leave.note };
  }
  // khách quen đang đứng ở tiệm hoa => không có mặt ở làng
  if (save?.shop?.customers?.some((c) => c.regular === id)) return { absent: true, reason: 'shop' };
  const e = scheduleAt(id, hour);
  if (!e) return { absent: true, reason: 'none' };
  let { spot, act } = e;
  if (ACTIVITIES[act]?.outdoor && BAD_WEATHER.has(weather)) { spot = 'home'; act = 'home'; }
  if (spot === 'home') spot = `door_${homeOf(id)}`;
  return { spot, act, absent: false };
}

/** Vị trí 1 chỗ: { x, z, rot (độ), door: mã nhà nếu là cửa nhà } */
export function spotPos(spotId) {
  const s = SPOTS[spotId];
  if (!s) return null;
  if (s.door) { const n = NODES[s.node]; return { x: n.x, z: n.z, rot: 0, door: s.door }; }
  return { x: s.x, z: s.z, rot: s.rot || 0, door: null };
}

// ---- tìm đường (Dijkstra trên các điểm đường) ----
const ADJ = (() => {
  const adj = Object.fromEntries(Object.keys(NODES).map((k) => [k, []]));
  for (const [a, b] of EDGES) {
    const d = Math.hypot(NODES[a].x - NODES[b].x, NODES[a].z - NODES[b].z);
    adj[a].push([b, d]); adj[b].push([a, d]);
  }
  return adj;
})();

export function nearestNode(x, z) {
  let best = null, bd = Infinity;
  for (const [k, n] of Object.entries(NODES)) { const d = Math.hypot(n.x - x, n.z - z); if (d < bd) { bd = d; best = k; } }
  return best;
}

export function nodePath(from, to) {
  if (from === to) return [from];
  const dist = { [from]: 0 }, prev = {}, done = new Set();
  const q = [from];
  while (q.length) {
    q.sort((a, b) => dist[a] - dist[b]);
    const u = q.shift();
    if (done.has(u)) continue;
    done.add(u);
    if (u === to) break;
    for (const [v, w] of ADJ[u] || []) {
      const nd = dist[u] + w;
      if (nd < (dist[v] ?? Infinity)) { dist[v] = nd; prev[v] = u; q.push(v); }
    }
  }
  if (!(to in dist)) return [from];
  const path = [to];
  while (path[0] !== from) path.unshift(prev[path[0]]);
  return path;
}

/** Danh sách điểm cần đi qua từ (x, z) tới chỗ spotId (đi theo đường đá) */
export function routeTo(x, z, spotId) {
  const s = SPOTS[spotId];
  const target = spotPos(spotId);
  if (!s || !target) return [];
  // cùng ở trên quảng trường => đi thẳng, khỏi vòng quanh
  const inPlaza = (px, pz) => Math.hypot(px - VILLAGE.center.x, pz - VILLAGE.center.z) < VILLAGE.plazaRadius + 1.3;
  if (inPlaza(x, z) && inPlaza(target.x, target.z)) return [{ x: target.x, z: target.z }];
  const start = nearestNode(x, z);
  const pts = nodePath(start, s.node).map((k) => ({ x: NODES[k].x, z: NODES[k].z }));
  // bỏ điểm đầu nếu đang đứng gần hơn điểm thứ 2 (khỏi quay lui)
  if (pts.length > 1 && Math.hypot(pts[1].x - x, pts[1].z - z) < Math.hypot(pts[1].x - pts[0].x, pts[1].z - pts[0].z)) pts.shift();
  const last = pts[pts.length - 1];
  if (!last || Math.hypot(last.x - target.x, last.z - target.z) > 0.05) pts.push({ x: target.x, z: target.z });
  return pts;
}

/** Câu chào: ưu tiên câu theo thời tiết / buổi, xen câu chung */
export function greeting(id, { hour, weather }, rng = Math.random) {
  const L = LINES[id];
  if (!L) return '';
  let pool = [...(L.any || [])];
  if (BAD_WEATHER.has(weather) && L.rain) pool = pool.concat(L.rain, L.rain);
  else if (hour >= 5 && hour < 10 && L.morning) pool = pool.concat(L.morning, L.morning);
  else if (hour >= 16 && hour < 21 && L.evening) pool = pool.concat(L.evening, L.evening);
  return pool[Math.floor(rng() * pool.length)] || '';
}

/** Mô tả nhà: ai ở, có nhà không */
export function houseStatus(houseId, ctx) {
  const h = HOUSES[houseId];
  if (!h) return null;
  if (!h.owner) {
    const inside = VILLAGER_IDS.filter((v) => { const d = desiredState(v, ctx); return !d.absent && d.spot === `door_${houseId}`; });
    return { house: h, owner: null, inside };
  }
  const d = desiredState(h.owner, ctx);
  return { house: h, owner: villagerInfo(h.owner), state: d, atHome: !d.absent && d.spot === `door_${houseId}`, act: ACTIVITIES[d.act] || null };
}
