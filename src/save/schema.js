// =============================================================
//  CẤU TRÚC DỮ LIỆU SAVE + CHUYỂN ĐỔI PHIÊN BẢN
// =============================================================
//  Mỗi khi đổi cấu trúc save:
//   1. Tăng SAVE_VERSION lên 1.
//   2. Thêm hàm vào MIGRATIONS[phiên_bản_cũ] để biến save cũ thành mới.
//  => Người chơi cũ không bị mất tiến độ.
// =============================================================
import { STARTER, TIME, FARM } from '../../data/config.js';
import { createTile } from '../systems/farming.js';

export const SAVE_VERSION = 2;

export function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function createPlot(id) {
  return {
    id,
    cols: FARM.plotCols,
    rows: FARM.plotRows,
    tiles: Array.from({ length: FARM.plotCols * FARM.plotRows }, createTile),
  };
}

export function createNewSave() {
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    meta: {
      saveId: newId(),
      ownerId: null,       // id tài khoản Supabase (GĐ2)
      rev: 0,              // tăng mỗi lần lưu trên máy
      syncedRev: 0,        // rev (trên máy) đã đẩy lên cloud thành công
      cloudRev: 0,         // số phiên bản trên cloud lần đồng bộ gần nhất (phát hiện xung đột giữa 2 máy)
      device: '',          // thiết bị lưu gần nhất
      createdAt: now,
      updatedAt: now,
    },
    player: {
      name: 'Người làm vườn',
      avatar: { skin: '#ffe0c7', hair: '#6b4433', outfit: '#8fc9e8', hat: '#f6d67a' },
      level: 1,
      xp: 0,
      coins: STARTER.coins,
      reputation: 0,
    },
    time: {
      gameMinutes: TIME.startHour * 60,
      lastRealTs: now,
    },
    tools: { ...STARTER.tools },
    inventory: {
      seeds: { ...STARTER.seeds },
      items: { ...STARTER.items },
      flowers: {},          // "rose|3": số lượng  (loài|số sao)
    },
    farm: {
      plots: [createPlot('plot-1')],
    },
    stats: { harvested: 0, playMinutes: 0, lastFreePackDay: 0 },
    tutorial: { step: 0, done: false },
    settings: { sound: true, shadows: true },
  };
}

// Hàm chuyển đổi: key = phiên bản CŨ.  Ví dụ khi lên phiên bản 2:
//   1: (s) => { s.player.reputation ??= 0; return s; },
export const MIGRATIONS = {
  // v1 -> v2 (Giai đoạn 2): thêm thông tin đồng bộ cloud
  1: (s) => {
    s.meta = s.meta || {};
    s.meta.cloudRev = s.meta.cloudRev ?? 0;
    s.meta.device = s.meta.device ?? '';
    s.meta.syncedRev = s.meta.syncedRev ?? 0;
    return s;
  },
};

/** Đưa save về phiên bản mới nhất + bổ sung các trường còn thiếu. */
export function migrateSave(save) {
  if (!save || typeof save !== 'object') return createNewSave();
  let s = save;
  let v = Number(s.version) || 1;
  while (v < SAVE_VERSION) {
    const fn = MIGRATIONS[v];
    if (fn) s = fn(s) || s;
    v += 1;
    s.version = v;
  }
  if (v > SAVE_VERSION) {
    // save đến từ bản game MỚI HƠN (vd máy khác đã cập nhật) — giữ nguyên, không xóa trường lạ
    console.warn('Save có phiên bản mới hơn game hiện tại:', v);
  }
  return fillDefaults(s, createNewSave());
}

// Thêm các trường mặc định nếu save cũ chưa có (không ghi đè dữ liệu có sẵn)
function fillDefaults(target, defaults) {
  for (const k of Object.keys(defaults)) {
    const dv = defaults[k];
    if (target[k] === undefined) target[k] = dv;
    else if (dv && typeof dv === 'object' && !Array.isArray(dv) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      // các "bản đồ" tự do (seeds/items/flowers) cũng được bổ sung khóa mặc định — chấp nhận được
      fillDefaults(target[k], dv);
    }
  }
  return target;
}
