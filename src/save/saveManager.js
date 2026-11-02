// =============================================================
//  QUẢN LÝ LƯU GAME
//  - Lưu trên máy (IndexedDB) định kỳ + khi thoát/ẩn tab.
//  - Mỗi lần lưu tăng meta.rev. "syncedRev" < "rev" nghĩa là còn thay đổi chưa đẩy lên cloud.
//  - Giai đoạn 2 sẽ gắn "cloudAdapter" (Supabase) vào đây: { pull(), push(save) }.
// =============================================================
import { getItem, setItem } from './localStore.js';
import { createNewSave, migrateSave, SAVE_VERSION } from './schema.js';
import { SAVE } from '../../data/config.js';

const slotKey = (profile) => `save:${profile}`;
const backupKey = (profile, v) => `backup:${profile}:v${v}`;

export class SaveManager {
  constructor(emitter, profile = 'guest') {
    this.emitter = emitter;
    this.profile = profile;   // 'guest' khi chưa đăng nhập; GĐ2: id người dùng
    this.save = null;
    this.cloud = null;        // GĐ2: cloudAdapter
    this.timer = null;
    this.saving = false;
    this.pendingDirty = false;
  }

  async load() {
    let raw = await getItem(slotKey(this.profile));
    if (raw && raw.version !== SAVE_VERSION) {
      // sao lưu save cũ trước khi chuyển đổi, phòng trường hợp lỗi
      await setItem(backupKey(this.profile, raw.version), raw).catch(() => {});
    }
    this.save = raw ? migrateSave(raw) : createNewSave();
    this.isNew = !raw;
    return this.save;
  }

  /** Gọi khi dữ liệu thay đổi quan trọng (thao tác người chơi) */
  markDirty() { this.pendingDirty = true; }

  async saveNow(reason = 'auto') {
    if (!this.save || this.saving) return;
    this.saving = true;
    try {
      const s = this.save;
      s.meta.rev += 1;
      s.meta.updatedAt = Date.now();
      s.time.lastRealTs = Date.now();
      // structuredClone để tránh lưu "nửa chừng" khi game đang chạy
      await setItem(slotKey(this.profile), structuredClone(s));
      this.pendingDirty = false;
      this.emitter.emit('saved', { reason, rev: s.meta.rev });
      if (this.cloud) this.cloud.push?.(s).catch?.(() => {});
    } catch (e) {
      console.warn('Lưu thất bại', e);
      this.emitter.emit('save-error', e);
    } finally {
      this.saving = false;
    }
  }

  startAutosave() {
    this.timer = setInterval(() => this.saveNow('auto'), SAVE.autosaveSeconds * 1000);
    const flush = () => this.saveNow('exit');
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
    window.addEventListener('pagehide', flush);
  }

  async reset() {
    this.save = createNewSave();
    await this.saveNow('reset');
    return this.save;
  }
}
