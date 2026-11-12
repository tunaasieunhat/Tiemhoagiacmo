// =============================================================
//  QUẢN LÝ LƯU GAME
//  - Lưu trên máy (IndexedDB) định kỳ + khi thoát/ẩn tab. Mỗi người chơi 1 ô lưu: "save:guest" hoặc "save:<id tài khoản>".
//  - Mỗi lần lưu tăng meta.rev. Nếu rev > syncedRev => còn thay đổi chưa đẩy lên cloud.
//  - Nếu có "cloud" (CloudSync) thì báo cho nó sau mỗi lần lưu.
// =============================================================
import { getItem, setItem } from './localStore.js';
import { createNewSave, migrateSave, SAVE_VERSION } from './schema.js';
import { SAVE } from '../../data/config.js';

export const slotKey = (profile) => `save:${profile}`;
const backupKey = (profile, tag) => `backup:${profile}:${tag}`;

export function deviceName() {
  const ua = navigator.userAgent || '';
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android'
    : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Thiết bị';
  const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
  return br ? `${os} · ${br}` : os;
}

/** Đọc save trên máy của 1 người chơi (đã chuyển sang phiên bản mới nhất), không có thì null */
export async function readLocalSave(profile) {
  const raw = await getItem(slotKey(profile));
  if (!raw) return null;
  if (raw.version !== SAVE_VERSION) await setItem(backupKey(profile, `v${raw.version}`), raw).catch(() => {});
  return migrateSave(raw);
}

export async function backupSave(profile, save, tag) {
  await setItem(backupKey(profile, tag), structuredClone(save)).catch(() => {});
}

export class SaveManager {
  constructor(emitter, profile = 'guest') {
    this.emitter = emitter;
    this.profile = profile;   // 'guest' hoặc id tài khoản
    this.save = null;
    this.cloud = null;        // CloudSync khi đã đăng nhập
    this.timer = null;
    this.saving = false;
    this.isNew = false;
  }

  /** Dùng save đã chọn (từ máy hoặc từ cloud) */
  use(save, isNew = false) {
    this.save = save;
    this.isNew = isNew;
    return save;
  }

  /** Đánh dấu có thay đổi quan trọng (để dành cho tối ưu sau này) */
  markDirty() { this.dirty = true; }

  /** Chế độ khách: đọc save trên máy hoặc tạo mới */
  async load() {
    const local = await readLocalSave(this.profile);
    return this.use(local || createNewSave(), !local);
  }

  /** Ghi xuống máy, KHÔNG tăng rev (dùng sau khi đồng bộ cloud) */
  async writeLocal() {
    if (!this.save) return;
    await setItem(slotKey(this.profile), structuredClone(this.save));
  }

  async saveNow(reason = 'auto') {
    if (!this.save || this.saving) return;
    this.saving = true;
    try {
      const s = this.save;
      s.meta.rev += 1;
      s.meta.updatedAt = Date.now();
      s.meta.device = deviceName();
      s.time.lastRealTs = Date.now();
      await setItem(slotKey(this.profile), structuredClone(s));
      this.emitter.emit('saved', { reason, rev: s.meta.rev });
    } catch (e) {
      console.warn('Lưu thất bại', e);
      this.emitter.emit('save-error', e);
    } finally {
      this.saving = false;
    }
    this.cloud?.notify(reason);
  }

  startAutosave() {
    this.timer = setInterval(() => this.saveNow('auto'), SAVE.autosaveSeconds * 1000);
    const flush = () => this.saveNow('exit');
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
    window.addEventListener('pagehide', flush);
  }

  async reset() {
    const old = this.save;
    this.save = createNewSave();
    if (old) {
      // giữ liên kết cloud để lần đẩy tiếp theo không bị coi là xung đột
      this.save.meta.ownerId = old.meta.ownerId;
      this.save.meta.cloudRev = old.meta.cloudRev;
      this.save.player.name = old.player.name;
      this.save.player.avatar = old.player.avatar;
      await backupSave(this.profile, old, `reset-${Date.now()}`);
    }
    await this.saveNow('reset');
    return this.save;
  }
}
