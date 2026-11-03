// Đặt đồ trang trí tự do (GĐ10) — LOGIC THUẦN (không dùng three/DOM).
// Món đã đặt: { u: mã riêng, id: loại đồ, x, z: vị trí, r: góc xoay (độ) }
import { DECOR, DECOR_RULES, DECOR_EVENTS, LEGACY_SLOTS } from '../../data/decor.js';

export const sizeOf = (id) => DECOR[id]?.size ?? 0.6;

export function snap(v) {
  const g = DECOR_RULES.grid;
  return Math.round(v / g) * g;
}

function distToSeg(x, z, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const L = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L));
  return Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
}

/**
 * Kiểm tra đặt được không.
 * map: { islandR, circles: [{x, z, r}], rects: [{x, z, hx, hz}], paths: [[{x,z},{x,z}]] } — vùng cấm lấy từ bản đồ
 * Trả về { ok, reason }
 */
export function checkPlace(placed, id, x, z, map, ignoreUid = null) {
  const r = sizeOf(id);
  if (!DECOR[id]) return { ok: false, reason: 'Món đồ không hợp lệ' };
  if (Math.hypot(x, z) > map.islandR - DECOR_RULES.islandMargin - r * 0.5) return { ok: false, reason: 'Quá sát mép đảo' };
  for (const c of map.circles) if (Math.hypot(x - c.x, z - c.z) < c.r + r) return { ok: false, reason: c.name ? `Vướng ${c.name}` : 'Vướng cây hoặc công trình' };
  for (const q of map.rects) if (Math.abs(x - q.x) < q.hx + r && Math.abs(z - q.z) < q.hz + r) return { ok: false, reason: q.name ? `Vướng ${q.name}` : 'Vướng công trình' };
  for (const [a, b] of map.paths) if (distToSeg(x, z, a, b) < DECOR_RULES.pathMargin + r) return { ok: false, reason: 'Không đặt lên đường đi' };
  for (const p of placed) {
    if (p.u === ignoreUid) continue;
    if (Math.hypot(x - p.x, z - p.z) < sizeOf(p.id) + r - 0.05) return { ok: false, reason: `Đè lên ${DECOR[p.id]?.name || 'món khác'}` };
  }
  return { ok: true, reason: '' };
}

/** Tìm chỗ trống gần (x, z) nhất — vòng xoắn ốc theo lưới. */
export function findFreeSpot(placed, id, x, z, map, ignoreUid = null) {
  const g = DECOR_RULES.grid;
  const sx = snap(x), sz = snap(z);
  if (checkPlace(placed, id, sx, sz, map, ignoreUid).ok) return { x: sx, z: sz };
  for (let ring = 1; ring <= 30; ring++) {
    let best = null, bestD = Infinity;
    for (let i = -ring; i <= ring; i++) for (let j = -ring; j <= ring; j++) {
      if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
      const px = sx + i * g, pz = sz + j * g;
      if (!checkPlace(placed, id, px, pz, map, ignoreUid).ok) continue;
      const d = Math.hypot(px - x, pz - z);
      if (d < bestD) { bestD = d; best = { x: px, z: pz }; }
    }
    if (best) return best;
  }
  return null;
}

export const beautyOf = (placed = []) => placed.reduce((a, p) => a + (DECOR[p.id]?.beauty || 0), 0);

/** Đồ sự kiện có đang được bán không (theo mùa hiện tại) */
export function eventOpen(eventId, seasonId) {
  const ev = DECOR_EVENTS[eventId];
  return !ev || ev.season === seasonId;
}

/** Chuyển kiểu cũ { slotId: decorId } sang danh sách đặt tự do */
export function legacyToPlaced(slots = {}, startUid = 1) {
  const out = [];
  let u = startUid;
  for (const s of LEGACY_SLOTS) {
    const id = slots[s.id];
    if (!id || !DECOR[id]) continue;
    out.push({ u: u++, id, x: s.x, z: s.z, r: s.zone === 'shop' ? 17 : 34 });
  }
  return out;
}

/** Ảnh chụp gửi bạn bè: [[id, x, z, r], ...] gọn nhẹ */
export function placedToSnapshot(placed = []) {
  return placed.slice(0, DECOR_RULES.maxPlaced).map((p) => [p.id, Math.round(p.x * 100) / 100, Math.round(p.z * 100) / 100, Math.round(p.r) % 360]);
}

/** Đọc đồ trang trí từ ảnh chụp của người khác — làm sạch dữ liệu (không tin dữ liệu từ máy khác) */
export function placedFromSnapshot(snap) {
  const num = (v, lim) => { const n = Number(v); return Number.isFinite(n) ? Math.max(-lim, Math.min(lim, n)) : 0; };
  if (Array.isArray(snap?.deco)) {
    return snap.deco.slice(0, DECOR_RULES.maxPlaced)
      .filter((a) => Array.isArray(a) && typeof a[0] === 'string' && DECOR[a[0]])
      .map((a, i) => ({ u: i + 1, id: a[0], x: num(a[1], 30), z: num(a[2], 30), r: num(a[3], 720) }));
  }
  // ảnh chụp từ bản game cũ (đặt theo vị trí cố định)
  const slots = snap?.decor && typeof snap.decor === 'object' ? snap.decor : {};
  const clean = {};
  for (const s of LEGACY_SLOTS) if (typeof slots[s.id] === 'string' && DECOR[slots[s.id]]) clean[s.id] = slots[s.id];
  return legacyToPlaced(clean);
}
